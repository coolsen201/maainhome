import { useEffect, useState, useRef } from "react";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoDisplay } from "@/components/VideoDisplay";
import { LogConsole } from "@/components/LogConsole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Mic, MicOff, Camera, CameraOff, QrCode, Maximize2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { usePairing } from "@/hooks/use-pairing";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920&auto=format&fit=crop", // Nature
  "https://images.unsplash.com/photo-1501854140884-074bf86ee90c?q=80&w=1920&auto=format&fit=crop", // Mountain
];

import { QrScanner } from "@/components/QrScanner";

export default function HomeStation() {
  const [, setLocation] = useLocation();
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const { isPaired, secureKey, profileId, validateAndPair, isValidating, unpair } = usePairing();
  const { localStream, remoteStream, status, logs, startLocalStream } = useWebRTC("home");
  const { toast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const screensaverImages = authProfile?.screensaver_photos?.length > 0
    ? authProfile.screensaver_photos
    : DEFAULT_IMAGES;

  // Auto-start local stream on mount if paired and started
  useEffect(() => {
    if (isPaired && isStarted) {
      startLocalStream();
    }

    // Sideshow timer
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % screensaverImages.length);
    }, 7000); // 7 seconds

    return () => clearInterval(timer);
  }, [isPaired, isStarted, screensaverImages.length]);

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

  const handlePairing = async (qrData: string) => {
    const key = qrData.includes("MOM_IN_HOME_AUTH:")
      ? qrData.split("MOM_IN_HOME_AUTH:")[1]
      : qrData;

    const result = await validateAndPair(key, "home");
    if (result.success) {
      toast({ title: "Station Paired", description: "System ready for full-screen mode." });
    } else {
      toast({ variant: "destructive", title: "Pairing Failed", description: result.error });
    }
  };

  const enterFullScreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => {
        setIsStarted(true);
      }).catch((err) => {
        console.log("Fullscreen error:", err);
        // Still start even if fullscreen fails (some browsers block it)
        setIsStarted(true);
      });
    } else {
      setIsStarted(true);
    }
  };

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
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white relative">
        <Link href="/dashboard" className="absolute top-8 left-8 inline-flex items-center text-xs font-bold tracking-widest uppercase text-white/40 hover:text-red-500 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <div className="w-24 h-24 mb-8 bg-red-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.3)]">
          <QrCode className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter mb-4 text-center uppercase">Scan QR to Pair</h1>
        <p className="max-w-md text-gray-400 font-mono text-sm uppercase tracking-widest mb-12 text-center">
          Point this station's camera at the QR code on your dashboard.
        </p>

        <QrScanner onScanSuccess={handlePairing} />

        {isValidating && (
          <div className="mt-8 flex items-center gap-3 text-red-500 font-bold animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            VALIDATING STATION...
          </div>
        )}
      </div>
    );
  }

  // Full-Screen Trigger Overlay (Browser requirement)
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white relative">
        <Link href="/dashboard" className="absolute top-8 left-8 inline-flex items-center text-xs font-bold tracking-widest uppercase text-white/40 hover:text-green-500 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <ShieldCheck className="w-24 h-24 text-green-500 mb-8 animate-pulse" />
        <h1 className="text-5xl font-black italic tracking-tighter mb-4 text-center">SYSTEM READY</h1>
        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest mb-12 text-center">
          Station paired successfully with Secure Key.
        </p>
        <Button
          size="lg"
          className="h-20 px-12 bg-green-600 hover:bg-green-700 text-white font-black text-2xl rounded-3xl shadow-2xl flex items-center gap-4 transition-all hover:scale-105"
          onClick={enterFullScreen}
        >
          <Maximize2 className="w-8 h-8" />
          START STATION (FULL SCREEN)
        </Button>
        <button onClick={unpair} className="mt-8 text-xs text-white/20 hover:text-white transition-colors underline">Reset Pairing</button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* Back Button for Feed */}
      {!remoteStream && (
        <Link href="/dashboard" className="absolute top-8 left-8 z-[100] inline-flex items-center text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>
      )}

      {/* Main Full-Screen Area */}
      <div className="relative w-full h-full">
        {/* Main View: Remote Stream (The caller) */}
        {remoteStream ? (
          <VideoDisplay
            stream={remoteStream}
            className="w-full h-full bg-black border-0 rounded-0"
            label="Remote Caller"
            showStatus={true}
          />
        ) : (
          <div className="w-full h-full relative bg-black">
            {/* Slideshow Background */}
            {screensaverImages.map((img: string, index: number) => (
              <div
                key={img}
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{
                  backgroundImage: `url(${img})`,
                  opacity: index === currentImageIndex ? 0.6 : 0,
                }}
              />
            ))}

            {/* Top-Aligned Waiting Text */}
            <div className="absolute inset-x-0 top-0 pt-24 flex flex-col items-center z-10 p-4 text-center">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-widest drop-shadow-[0_4px_30px_rgba(0,0,0,1)] animate-pulse">
                Waiting for Connection
              </h2>
            </div>
          </div>
        )}

        {/* Picture-in-Picture: Local Stream (Self view) */}
        {localStream && (
          <div className="absolute bottom-6 right-6 w-48 md:w-64 aspect-video shadow-2xl z-40 transition-transform hover:scale-105 rounded-xl overflow-hidden border-2 border-primary/50">
            <VideoDisplay
              stream={localStream}
              isLocal={true}
              muted={true}
              className="w-full h-full"
              label="My Camera"
            />
          </div>
        )}


        {/* Overlay Controls (Bottom Center) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
          <Button
            size="icon"
            variant={isMuted ? "destructive" : "secondary"}
            className="rounded-full w-14 h-14 shadow-2xl backdrop-blur-md hover:scale-110 transition-transform"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            size="icon"
            variant={!isVideoEnabled ? "destructive" : "secondary"}
            className="rounded-full w-14 h-14 shadow-2xl backdrop-blur-md hover:scale-110 transition-transform"
            onClick={toggleVideo}
          >
            {!isVideoEnabled ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
          </Button>
          <button onClick={() => window.location.reload()} className="text-[8px] text-white/5 absolute -bottom-4 opacity-50">REL</button>
        </div>
      </div>
    </div>
  );
}
