import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoDisplayProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  muted?: boolean;
  className?: string;
  label?: string;
  offlineImage?: string;
  offlineText?: string;
  showLabel?: boolean;
  showStatus?: boolean;
}

export function VideoDisplay({
  stream,
  isLocal,
  muted = false,
  className,
  label,
  offlineImage,
  offlineText,
  showLabel = true,
  showStatus = true
}: VideoDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn("relative rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl group", className)}>
      <div className="absolute inset-0 scanline z-10 opacity-30 pointer-events-none" />

      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || muted}
          className={cn("w-full h-full object-cover", isLocal && "scale-x-[-1]")}
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-black/90 relative p-8 gap-12 overflow-hidden">
          {/* Header Text - Now in flex flow to avoid overlap */}
          <div className="z-20 text-center flex flex-col items-center shrink-0">
            <span className="text-3xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,1)] max-w-5xl mx-auto leading-tight">
              {offlineText || "Signal Lost"}
            </span>
          </div>

          {offlineImage ? (
            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
              <img
                src={offlineImage}
                alt="Offline"
                className="max-h-full max-w-full object-contain opacity-90 shadow-2xl rounded-2xl"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse border border-white/10">
                <VideoOff className="w-10 h-10 opacity-50" />
              </div>
            </div>
          )}
        </div>
      )}

      {showLabel && label && (
        <div className="absolute top-4 left-4 z-20">
          <span className="px-2 py-1 text-xs font-bold tracking-wider uppercase bg-black/50 backdrop-blur-sm text-white/80 rounded border border-white/10">
            {label}
          </span>
        </div>
      )}

      {/* Standardized Signal Indicator */}
      {showStatus && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-start items-center transition-opacity duration-300">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
            <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.5)]", stream ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50")} />
            <span className="text-[11px] font-bold font-mono text-white/90 tracking-tighter">
              {stream ? "Live Feed" : "No Signal"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
