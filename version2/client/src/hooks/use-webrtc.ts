import { useState, useEffect, useRef, useCallback } from "react";
import { WS_EVENTS, type WsMessage } from "@shared/ws-types";
import { useToast } from "@/hooks/use-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type WebRTCState = {
  status: "disconnected" | "connecting" | "connected" | "failed";
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  logs: string[];
  isHomeOnline: boolean;
};

export function useWebRTC(role: "home" | "remote") {
  const [state, setState] = useState<WebRTCState>({
    status: "disconnected",
    localStream: null,
    remoteStream: null,
    logs: [],
    isHomeOnline: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  // Ref to access current stream in callbacks without triggering re-renders or stale closures
  const localStreamRef = useRef<MediaStream | null>(null);
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const addLog = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, logs: [...prev.logs.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`] }));
    console.log(`[WebRTC] ${msg}`);
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use env var for split hosting (Vercel -> Render), fallback to relative for monolithic
    const wsUrl = import.meta.env.VITE_WS_URL || `wss://api.maahome.in/ws`;

    addLog(`Connecting to WebSocket at ${wsUrl}...`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog("WebSocket Connected");
      ws.send(JSON.stringify({ type: WS_EVENTS.JOIN, payload: { role } }));
    };

    ws.onmessage = async (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        handleSignalingMessage(msg);
      } catch (err) {
        addLog(`Error parsing WS message: ${err}`);
      }
    };

    ws.onclose = () => {
      addLog("WebSocket Disconnected");
      setState(prev => ({ ...prev, status: 'disconnected', isHomeOnline: false }));
    };

    return () => {
      ws.close();
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [role]);

  const setupPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    addLog("Creating RTCPeerConnection");
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: WS_EVENTS.CANDIDATE,
          payload: { candidate: event.candidate }
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      addLog(`Peer Connection State: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        if (disconnectTimeoutRef.current) {
          addLog("New connection detected, canceling screensaver delay");
          clearTimeout(disconnectTimeoutRef.current);
          disconnectTimeoutRef.current = null;
        }
        setState(prev => ({ ...prev, status: 'connected' }));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setState(prev => ({ ...prev, status: 'disconnected' }));

        addLog("Disconnected. Screensaver will activate in 30 seconds...");
        disconnectTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, remoteStream: null }));
          addLog("Screensaver activated (30s timeout reached)");
          disconnectTimeoutRef.current = null;
        }, 30000);

        // Clean up on disconnect to allow reconnection
        cleanupPeerConnection();
      }
    };

    pc.ontrack = (event) => {
      addLog(`Track received: ${event.track.kind}`);
      setState(prev => ({ ...prev, remoteStream: event.streams[0] }));
    };

    // Add local tracks if available (using Ref to avoid stale closure)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
      addLog(`Added ${localStreamRef.current.getTracks().length} local tracks to PC`);
    } else {
      addLog("No local stream to add to PC (Ref is null)");
    }

    pcRef.current = pc;
    return pc;
  }, []);

  const cleanupPeerConnection = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  const handleSignalingMessage = async (msg: WsMessage) => {
    switch (msg.type) {
      case 'status':
        setState(prev => ({ ...prev, isHomeOnline: msg.payload.homeOnline }));
        addLog(`Home station is ${msg.payload.homeOnline ? 'ONLINE' : 'OFFLINE'}`);
        break;

      case 'offer':
        addLog("Received Offer");
        try {
          const pc = setupPeerConnection();
          if (!pc) return;

          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
          addLog("Remote description set");

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          addLog("Local description set (Answer)");

          wsRef.current?.send(JSON.stringify({
            type: WS_EVENTS.ANSWER,
            payload: { sdp: answer }
          }));
        } catch (err) {
          addLog(`Error handling offer: ${err}`);
        }
        break;

      case 'answer':
        addLog("Received Answer");
        try {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
            addLog("Remote description set");
          }
        } catch (err) {
          addLog(`Error handling answer: ${err}`);
        }
        break;

      case 'candidate':
        // addLog("Received Candidate");
        try {
          if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
          }
        } catch (err) {
          addLog(`Error handling candidate: ${err}`);
        }
        break;

      case 'error':
        addLog(`Server Error: ${msg.payload.message}`);
        toast({
          title: "Connection Error",
          description: msg.payload.message,
          variant: "destructive"
        });
        break;
    }
  };

  const startLocalStream = async () => {
    try {
      addLog("Requesting camera/mic access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setState(prev => ({ ...prev, localStream: stream }));
      localStreamRef.current = stream; // Update Ref
      addLog("Local Media Stream Active");
      return stream;
    } catch (err) {
      addLog(`Failed to get media: ${err}`);
      toast({
        title: "Media Error",
        description: "Could not access camera/microphone. Please allow permissions.",
        variant: "destructive"
      });
      return null;
    }
  };

  const callHome = async () => {
    addLog("Initiating Call...");
    setState(prev => ({ ...prev, status: 'connecting' }));

    const pc = setupPeerConnection();
    if (!pc) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      addLog("Offer created and sent");

      wsRef.current?.send(JSON.stringify({
        type: WS_EVENTS.OFFER,
        payload: { sdp: offer }
      }));
    } catch (err) {
      addLog(`Error creating offer: ${err}`);
    }
  };

  return {
    ...state,
    startLocalStream,
    callHome,
    addLog
  };
}
