import { useEffect } from "react";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoDisplay } from "@/components/VideoDisplay";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { LogConsole } from "@/components/LogConsole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Camera, CameraOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function RemoteViewer() {
  const { 
    localStream, 
    remoteStream, 
    status, 
    logs, 
    isHomeOnline,
    startLocalStream, 
    callHome 
  } = useWebRTC("remote");

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Initialize local stream (for talking back)
  useEffect(() => {
    startLocalStream();
  }, []);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">Remote Access</h1>
          <p className="text-sm text-muted-foreground">
            {isHomeOnline ? "Home station is online and ready." : "Waiting for home station..."}
          </p>
        </div>
        <ConnectionStatus status={status} />
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        
        {/* Main Remote Feed */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <Card className="flex-1 min-h-[300px] md:min-h-[500px] glass-panel border-0 p-1 relative overflow-hidden bg-black/50">
            <VideoDisplay 
              stream={remoteStream} 
              isLocal={false} 
              className="w-full h-full"
              label="Home Feed (Remote)"
            />
            
            {/* Overlay Controls (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
              <Button
                size="icon"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full w-12 h-12 shadow-lg backdrop-blur-md"
                onClick={toggleMute}
                disabled={!isConnected}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              {!isConnected ? (
                <Button 
                  size="lg" 
                  className={cn(
                    "rounded-full px-8 shadow-xl font-bold tracking-wide transition-all duration-300",
                    isHomeOnline 
                      ? "bg-green-500 hover:bg-green-600 hover:shadow-green-500/20 text-white" 
                      : "bg-slate-700 cursor-not-allowed opacity-50"
                  )}
                  onClick={callHome}
                  disabled={!isHomeOnline || isConnecting}
                >
                  <Phone className={cn("w-5 h-5 mr-2", isConnecting && "animate-pulse")} />
                  {isConnecting ? "Calling..." : "Call Home"}
                </Button>
              ) : (
                <Button 
                  size="icon" 
                  variant="destructive"
                  className="rounded-full w-14 h-14 shadow-xl hover:scale-105 transition-transform"
                  onClick={() => window.location.reload()} // Quick hangup implementation
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              )}

              <Button
                size="icon"
                variant={!isVideoEnabled ? "destructive" : "secondary"}
                className="rounded-full w-12 h-12 shadow-lg backdrop-blur-md"
                onClick={toggleVideo}
                disabled={!isConnected}
              >
                {!isVideoEnabled ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Self View (Mini) */}
          <Card className="aspect-video glass-panel overflow-hidden border-0 bg-black/40">
            <VideoDisplay 
              stream={localStream} 
              isLocal={true} 
              muted={true}
              className="w-full h-full"
              label="You"
            />
          </Card>

          {/* Diagnostics */}
          <Card className="flex-1 glass-panel border-white/5 p-4 flex flex-col gap-2 min-h-[200px]">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Diagnostics
            </h3>
            <LogConsole logs={logs} />
          </Card>
        </div>
      </div>
    </div>
  );
}
