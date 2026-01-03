import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoDisplayProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  muted?: boolean;
  className?: string;
  label?: string;
}

export function VideoDisplay({ stream, isLocal, muted = false, className, label }: VideoDisplayProps) {
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
        <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-black/60">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
              <VideoOff className="w-6 h-6 opacity-50" />
            </div>
            <span className="text-sm font-mono tracking-widest uppercase opacity-50">Signal Lost</span>
          </div>
        </div>
      )}

      {label && (
        <div className="absolute top-4 left-4 z-20">
          <span className="px-2 py-1 text-xs font-bold tracking-wider uppercase bg-black/50 backdrop-blur-sm text-white/80 rounded border border-white/10">
            {label}
          </span>
        </div>
      )}

      {/* Status Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <div className="flex gap-2">
            {/* Future controls could go here */}
         </div>
         <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10">
             <div className={cn("w-2 h-2 rounded-full animate-pulse", stream ? "bg-green-500" : "bg-red-500")} />
             <span className="text-[10px] font-mono text-white/70 uppercase">
               {stream ? "Live Feed" : "No Signal"}
             </span>
         </div>
      </div>
    </div>
  );
}
