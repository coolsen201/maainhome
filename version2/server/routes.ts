import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { WS_EVENTS, type WsMessage } from "@shared/ws-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure cache directory
const cacheDir = path.join(__dirname, "public/screensavers");
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

  // Simple in-memory store for the two peers
  let homeSocket: WebSocket | null = null;
  let remoteSocket: WebSocket | null = null;

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
              // Notify any existing remote that home is online
              if (remoteSocket && remoteSocket.readyState === WebSocket.OPEN) {
                remoteSocket.send(JSON.stringify({ type: WS_EVENTS.STATUS, payload: { homeOnline: true } }));
              }
            } else if (message.payload.role === 'remote') {
              console.log('Remote user registered');
              remoteSocket = ws;
              // Tell remote if home is already online
              const isHomeOnline = homeSocket !== null && homeSocket.readyState === WebSocket.OPEN;
              ws.send(JSON.stringify({ type: WS_EVENTS.STATUS, payload: { homeOnline: isHomeOnline } }));
            }
            break;

          case WS_EVENTS.OFFER:
            // Forward offer from Remote -> Home
            if (homeSocket && homeSocket.readyState === WebSocket.OPEN) {
              console.log('Forwarding OFFER to Home');
              homeSocket.send(JSON.stringify(message));
            } else {
              console.warn('Cannot forward offer: Home offline');
            }
            break;

          case WS_EVENTS.ANSWER:
            // Forward answer from Home -> Remote
            if (remoteSocket && remoteSocket.readyState === WebSocket.OPEN) {
              console.log('Forwarding ANSWER to Remote');
              remoteSocket.send(JSON.stringify(message));
            }
            break;

          case WS_EVENTS.CANDIDATE:
            // Forward candidates to the "other" party
            if (ws === homeSocket && remoteSocket?.readyState === WebSocket.OPEN) {
              remoteSocket.send(JSON.stringify(message));
            } else if (ws === remoteSocket && homeSocket?.readyState === WebSocket.OPEN) {
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
        // Notify remote
        if (remoteSocket && remoteSocket.readyState === WebSocket.OPEN) {
          remoteSocket.send(JSON.stringify({ type: WS_EVENTS.STATUS, payload: { homeOnline: false } }));
        }
      } else if (ws === remoteSocket) {
        console.log('Remote user disconnected');
        remoteSocket = null;
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
