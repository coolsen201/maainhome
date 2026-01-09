import { useEffect, useState, useRef } from "react";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoDisplay } from "@/components/VideoDisplay";
import { LogConsole } from "@/components/LogConsole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Mic, MicOff, Camera, CameraOff, QrCode, Maximize2, ArrowLeft, Settings, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { usePairing } from "@/hooks/use-pairing";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
  const [isStarted, setIsStarted] = useState(() => {
    // skip "SYSTEM READY" if already paired
    return localStorage.getItem("intercom_pairing") !== null;
  });
  const [localScreensavers, setLocalScreensavers] = useState<string[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cacheScreensavers = async () => {
      if (authProfile?.screensaver_photos?.length > 0) {
        try {
          const res = await fetch('/api/cache-screensavers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: authProfile.screensaver_photos }),
          });
          const data = await res.json();
          if (data.files?.length > 0) {
            setLocalScreensavers(data.files.map((f: string) => `/screensavers/${f}`));
          }
        } catch (err) {
          console.error("Failed to cache screensavers:", err);
        }
      }
    };
    cacheScreensavers();
  }, [authProfile?.screensaver_photos]);

  const screensaverImages = localScreensavers.length > 0
    ? localScreensavers
    : ((authProfile?.screensaver_photos || []).filter((url: string | null) => !!url).length > 0
      ? authProfile.screensaver_photos.filter((url: string | null) => !!url)
      : DEFAULT_IMAGES);

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

  // No more auto-generating code on Home Station per user request
  // (Simplified QR experience: Dashboard shows, Home Station scans)

  const handlePairing = async (qrData: string) => {
    let key = qrData.includes("MOM_IN_HOME_AUTH:")
      ? qrData.split("MOM_IN_HOME_AUTH:")[1]
      : qrData;

    // Check if it's a 6-digit Simplified Token
    if (/^\d{6}$/.test(qrData)) {
      setIsResolving(true);
      try {
        const { data, error } = await supabase
          .from("pairing_tokens")
          .select("secure_key")
          .eq("token", qrData)
          .single();

        if (error || !data?.secure_key) {
          throw new Error("Invalid or Expired QR code.");
        }
        key = data.secure_key;
      } catch (err: any) {
        toast({ variant: "destructive", title: "Scan Failed", description: err.message });
        setIsResolving(false);
        return;
      } finally {
        setIsResolving(false);
      }
    }

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

  const [keyboardCode, setKeyboardCode] = useState("");

  // Pairing Overlay: Focused on Scanner & Keyboard
  if (!isPaired) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white relative">
        <Link href="/dashboard" className="absolute top-8 left-8 inline-flex items-center text-xs font-bold tracking-widest uppercase text-white/40 hover:text-red-500 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="w-24 h-24 mb-8 bg-black border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
          <Smartphone className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-4xl font-black italic tracking-tighter mb-4 text-center uppercase">Connect Station</h1>

        <div className="grid md:grid-cols-2 gap-8 items-start max-w-4xl w-full mt-8">
          {/* Option 1: Keyboard Input */}
          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl space-y-8 flex flex-col items-center">
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Method 1: Type Code</p>
              <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Enter 6-Digit Code</h3>
            </div>

            <div className="flex gap-2 w-full justify-center">
              <input
                autoFocus
                type="text"
                maxLength={6}
                value={keyboardCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setKeyboardCode(val);
                  if (val.length === 6) handlePairing(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && keyboardCode.length === 6) handlePairing(keyboardCode);
                }}
                className="w-full h-24 bg-white/5 border-2 border-white/10 rounded-3xl text-center text-5xl font-black italic tracking-[0.5em] text-red-500 outline-none focus:border-red-600 focus:bg-white/10 transition-all placeholder:text-white/5"
                placeholder="000000"
              />
            </div>

            <div className="w-full h-px bg-white/5" />

            <Button
              onClick={() => handlePairing(keyboardCode)}
              disabled={keyboardCode.length !== 6 || isValidating || isResolving}
              className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs tracking-widest uppercase"
            >
              {isValidating || isResolving ? <Loader2 className="w-5 h-5 animate-spin" /> : "LINK STATION"}
            </Button>
          </div>

          {/* Option 2: QR Scanner */}
          <div className="relative group flex flex-col items-center">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-600/20 to-red-400/20 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-black/40 backdrop-blur-3xl border border-white/10 p-4 rounded-[3rem] shadow-2xl flex flex-col items-center w-full min-h-[400px]">
              <div className="mt-4 mb-6 space-y-1 text-center">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Method 2: Scan QR</p>
                <h3 className="text-sm font-bold text-white uppercase italic">Point Camera at Phone</h3>
              </div>

              <QrScanner onScanSuccess={handlePairing} />

              <div className="mt-8 flex flex-col items-center gap-4 px-8 pb-4">
                <div className="flex gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <span className="text-[10px] font-bold text-red-500">1</span>
                    </div>
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-normal text-center">
                      6-8 inches<br />away
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <span className="text-[10px] font-bold text-red-500">2</span>
                    </div>
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-normal text-center">
                      Avoid<br />Glare
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(isValidating || isResolving) && (
          <div className="mt-12 flex items-center gap-3 text-red-500 font-bold animate-pulse tracking-widest uppercase text-xs">
            <Loader2 className="w-5 h-5 animate-spin" />
            {(isResolving ? "Resolving Token..." : "Verifying Station...")}
          </div>
        )}

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="mt-12 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white transition-colors"
        >
          {showManualInput ? "Hide Advanced Entry" : "Show Manual Key Entry"}
        </button>

        {showManualInput && (
          <div className="mt-8 w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <textarea
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              placeholder="Paste secure key..."
              className="w-full h-24 bg-black/40 border-white/10 rounded-2xl p-4 text-xs font-mono text-green-500 outline-none resize-none"
            />
            <Button
              onClick={() => handlePairing(manualKey)}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl"
            >
              Pair Manually With Key
            </Button>
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
        {(remoteStream || status === "connecting" || status === "connected") ? (
          <VideoDisplay
            stream={remoteStream}
            className="w-full h-full bg-black border-0 rounded-0"
            label="Remote Caller"
            offlineImage={authProfile?.selfie_photo || "/Indian_grandmother.png"}
            offlineText={`${authProfile?.full_name || 'Mom'} is connecting...`}
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
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-black tracking-widest drop-shadow-[0_4px_30px_rgba(255,255,255,0.8)] animate-pulse">
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
