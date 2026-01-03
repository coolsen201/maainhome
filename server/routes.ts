import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { WS_EVENTS, type WsMessage } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
