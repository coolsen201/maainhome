import { useEffect } from "react";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoDisplay } from "@/components/VideoDisplay";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { LogConsole } from "@/components/LogConsole";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";

export default function HomeStation() {
  const { localStream, remoteStream, status, logs, startLocalStream } = useWebRTC("home");

  // Auto-start local stream on mount
  useEffect(() => {
    startLocalStream();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Home Station <ShieldCheck className="w-5 h-5 text-primary" />
            </h1>
            <Badge variant="outline" className="font-mono text-xs border-primary/20 text-primary bg-primary/10">
              HOST MODE
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Broadcasting secure feed. Waiting for incoming connections.
          </p>
        </div>
        <ConnectionStatus status={status} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Main Feed Area (Large) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="flex-1 min-h-[400px] glass-panel border-0 p-1 relative overflow-hidden group">
            {localStream ? (
               <VideoDisplay 
                 stream={localStream} 
                 isLocal={true} 
                 muted={true} // Always mute local self-view
                 className="w-full h-full bg-black" 
                 label="Camera Feed (Local)"
               />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black/50 text-muted-foreground gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p>Initializing Camera...</p>
              </div>
            )}
            
            {/* Picture-in-Picture for Remote (Audio/Video from Caller) */}
            {remoteStream && (
              <div className="absolute top-4 right-4 w-48 aspect-video shadow-2xl z-30 transition-transform hover:scale-105">
                <VideoDisplay 
                  stream={remoteStream} 
                  className="w-full h-full border-2 border-primary/50 shadow-primary/20"
                  label="Remote Audio"
                />
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-6 h-full">
          <Card className="glass-panel border-white/5 p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              System Status
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-muted-foreground">Camera</span>
                <span className={localStream ? "text-green-400" : "text-red-400"}>
                  {localStream ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-muted-foreground">Audio Input</span>
                <span className={localStream?.getAudioTracks().length ? "text-green-400" : "text-red-400"}>
                  {localStream?.getAudioTracks().length ? "Active" : "Muted"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-muted-foreground">Network</span>
                <span className="text-white font-mono">WebRTC/STUN</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-muted-foreground">Session ID</span>
                <span className="text-white font-mono opacity-50">#{Math.floor(Math.random() * 10000)}</span>
              </div>
            </div>
          </Card>

          <div className="flex-1 min-h-[200px]">
            <LogConsole logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}
