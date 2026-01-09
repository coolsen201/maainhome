import fs from "fs";
import path from "path";
import https from "https";

import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { WS_EVENTS, type WsMessage } from "@shared/ws-types";

// Ensure cache directory
const cacheDir = path.join(process.cwd(), "public/screensavers");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use('/screensavers', express.static(cacheDir));

  app.post('/api/cache-screensavers', async (req, res) => {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "Invalid URLs payload" });
    }

    const savedFiles: string[] = [];
    const downloadPromises = urls.map((url: string) => {
      return new Promise<void>((resolve) => {
        try {
          const filename = path.basename(new URL(url).pathname) || `image-${Date.now()}.jpg`;
          const filePath = path.join(cacheDir, filename);

          // Skip if exists
          if (fs.existsSync(filePath)) {
            savedFiles.push(filename);
            resolve();
            return;
          }

          https.get(url, (response) => {
            if (response.statusCode === 200) {
              const fileStream = fs.createWriteStream(filePath);
              response.pipe(fileStream);
              fileStream.on('finish', () => {
                fileStream.close();
                savedFiles.push(filename);
                resolve();
              });
            } else {
              resolve(); // Skip failed
            }
          }).on('error', () => resolve());
        } catch (e) {
          resolve();
        }
      });
    });

    await Promise.all(downloadPromises);
    res.json({ files: savedFiles });
  });

  app.get(api.health.path, (req, res) => {
    res.json({ status: "ok" });
  });

  // WebSocket Signaling Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Multi-remote support: Home station is unique, but many remotes can connect
  let homeSocket: WebSocket | null = null;
  const remoteSockets = new Set<WebSocket>();

  const broadcastStatus = (isHomeOnline: boolean) => {
    const statusMsg = JSON.stringify({
      type: WS_EVENTS.STATUS,
      payload: { homeOnline: isHomeOnline }
    });
    remoteSockets.forEach(s => {
      if (s.readyState === WebSocket.OPEN) s.send(statusMsg);
    });
  };

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WsMessage;
        console.log('Received message:', message.type);

        switch (message.type) {
          case WS_EVENTS.JOIN:
            if (message.payload.role === 'home') {
              console.log('Home device registered');
              homeSocket = ws;
              broadcastStatus(true);
            } else if (message.payload.role === 'remote') {
              console.log('Remote user registered');
              remoteSockets.add(ws);
              // Tell this specific remote if home is already online
              const isHomeOnline = homeSocket !== null && homeSocket.readyState === WebSocket.OPEN;
              ws.send(JSON.stringify({ type: WS_EVENTS.STATUS, payload: { homeOnline: isHomeOnline } }));
            }
            break;

          case WS_EVENTS.OFFER:
            // Forward offer from ANY Remote -> Home
            if (homeSocket && homeSocket.readyState === WebSocket.OPEN) {
              console.log('Forwarding OFFER to Home');
              homeSocket.send(JSON.stringify(message));
            } else {
              console.warn('Cannot forward offer: Home offline');
            }
            break;

          case WS_EVENTS.ANSWER:
            // Forward answer from Home -> Remote(s)
            // Note: Since WebRTC works 1-on-1, if multiple remotes call simultaneously, 
            // we'd need session IDs. For now, broadcasting to all remotes allows the caller to catch it.
            console.log('Broadcasting ANSWER to all Remotes');
            remoteSockets.forEach(s => {
              if (s.readyState === WebSocket.OPEN) s.send(JSON.stringify(message));
            });
            break;

          case WS_EVENTS.CANDIDATE:
            if (ws === homeSocket) {
              // Candidates from Home -> All Remotes
              remoteSockets.forEach(s => {
                if (s.readyState === WebSocket.OPEN) s.send(JSON.stringify(message));
              });
            } else if (remoteSockets.has(ws) && homeSocket?.readyState === WebSocket.OPEN) {
              // Candidates from a specific Remote -> Home
              homeSocket.send(JSON.stringify(message));
            }
            break;
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    });

    ws.on('close', () => {
      if (ws === homeSocket) {
        console.log('Home device disconnected');
        homeSocket = null;
        broadcastStatus(false);
      } else {
        console.log('Remote user disconnected');
        remoteSockets.delete(ws);
      }
    });

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });

  return httpServer;
}
