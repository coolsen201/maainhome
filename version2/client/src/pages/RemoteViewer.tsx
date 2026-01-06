import { useEffect, useState } from "react";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoDisplay } from "@/components/VideoDisplay";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Camera, CameraOff, Loader2, ShieldCheck, FileKey, Smartphone, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { usePairing } from "@/hooks/use-pairing";
import { useToast } from "@/hooks/use-toast";

import { QrScanner } from "@/components/QrScanner";

export default function RemoteViewer() {
  const [, setLocation] = useLocation();
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const { isPaired, validateAndPair, isValidating, unpair } = usePairing();
  const {
    localStream,
    remoteStream,
    status,
    isHomeOnline,
    startLocalStream,
    callHome
  } = useWebRTC("remote");
  const { toast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Auto-start local stream on mount if paired
  useEffect(() => {
    if (isPaired) {
      startLocalStream();
    }
  }, [isPaired]);

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

  const handleKeyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const key = event.target?.result as string;
      handlePairing(key.trim());
    };
    reader.readAsText(file);
  };

  const handlePairing = async (key: string) => {
    const cleanKey = key.includes("MOM_IN_HOME_AUTH:")
      ? key.split("MOM_IN_HOME_AUTH:")[1]
      : key;

    const result = await validateAndPair(cleanKey, "remote");
    if (result.success) {
      toast({ title: "Remote Paired", description: "You can now call home." });
    } else {
      toast({ variant: "destructive", title: "Pairing Failed", description: result.error });
    }
  };

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  if (authLoading && !isPaired) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Pairing Overlay
  if (!isPaired) {
    return (
      <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-6 text-white relative">
        <Link href="/dashboard" className="absolute top-8 left-8 inline-flex items-center text-xs font-bold tracking-widest uppercase text-white/40 hover:text-green-500 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <div className="w-24 h-24 mb-6 bg-green-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
          <Smartphone className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter mb-4 text-center uppercase">Remote Setup</h1>
        <p className="max-w-md text-blue-200 font-mono text-xs uppercase tracking-widest mb-10 text-center leading-relaxed">
          Scan the Dashboard QR Code <br /> or upload your <span className="text-white font-bold underline">android_secure_key.txt</span>
        </p>

        <div className="w-full max-w-sm space-y-8">
          {/* QR Scanner */}
          <QrScanner onScanSuccess={handlePairing} />

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <span className="relative px-4 bg-blue-900 text-[10px] font-black tracking-widest text-white/40 uppercase">OR</span>
          </div>

          {/* File Upload Alternative */}
          <label className="group relative cursor-pointer block">
            <input
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleKeyUpload}
              disabled={isValidating}
            />
            <div className="w-full h-20 border border-white/10 rounded-2xl flex items-center justify-center gap-4 bg-white/5 hover:bg-white/10 transition-all">
              <FileKey className="w-5 h-5 text-green-500" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">Upload Key File</span>
            </div>
          </label>
        </div>

        {isValidating && (
          <div className="mt-8 flex items-center gap-3 text-green-400 font-bold animate-pulse text-xs tracking-widest">
            <Loader2 className="w-4 h-4 animate-spin" />
            VALIDATING REMOTE...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#3d2b1f] overflow-hidden select-none">
      {/* Back Button for Feed */}
      {!isConnected && !isConnecting && (
        <Link href="/dashboard" className="absolute top-8 left-8 z-[100] inline-flex items-center text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>
      )}

      {/* Main Full-Screen Area */}
      <div className="relative w-full h-full">
        <VideoDisplay
          stream={remoteStream}
          isLocal={false}
          className="w-full h-full border-0 rounded-0"
          label="Home Feed"
          offlineImage={authProfile?.selfie_photo || "/Indian_grandmother.png"}
          offlineText={`${authProfile?.full_name || 'Mom'} is Waiting In Home`}
          showLabel={false}
          showStatus={false}
        />


        {/* Overlay Controls (Bottom Center) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-end gap-6 z-50">
          {/* Left: Mute Button */}
          <Button
            size="icon"
            variant={isMuted ? "destructive" : "secondary"}
            className="rounded-full w-14 h-14 shadow-2xl backdrop-blur-md hover:scale-110 transition-transform mb-2"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {/* Middle: Disconnect Button + Selfie Preview */}
          {isConnecting || isConnected ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full w-14 h-14 border-red-500/50 text-red-500 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md transition-all border-2"
                onClick={() => window.location.reload()}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>

              {localStream && (
                <div className="w-32 md:w-40 aspect-video rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl">
                  <VideoDisplay
                    stream={localStream}
                    isLocal={true}
                    muted={true}
                    showLabel={false}
                    className="w-full h-full border-0"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mb-2">
              <Button
                size="lg"
                className="rounded-full px-10 h-14 shadow-2xl font-bold tracking-wide transition-all duration-300 bg-green-500 hover:bg-green-600 hover:shadow-green-500/20 text-white text-lg"
                onClick={callHome}
              >
                <Phone className="w-6 h-6 mr-3" />
                Call Home
              </Button>
            </div>
          )}

          {/* Right: Video Toggle Button */}
          <Button
            size="icon"
            variant={!isVideoEnabled ? "destructive" : "secondary"}
            className="rounded-full w-14 h-14 shadow-2xl backdrop-blur-md hover:scale-110 transition-transform mb-2"
            onClick={toggleVideo}
          >
            {!isVideoEnabled ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
          </Button>

          <button onClick={unpair} className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] text-white/20 hover:text-white transition-colors uppercase tracking-widest font-black">Reset Pair</button>
        </div>

      </div>
    </div>
  );
}
