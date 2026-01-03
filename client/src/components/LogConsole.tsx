import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogConsoleProps {
  logs: string[];
}

export function LogConsole({ logs }: LogConsoleProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="w-full h-full bg-black/80 font-mono text-xs p-4 rounded-xl border border-white/10 shadow-inner overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
        <span className="text-muted-foreground uppercase tracking-widest text-[10px]">System Logs</span>
        <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/20" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
            <div className="w-2 h-2 rounded-full bg-green-500/20" />
        </div>
      </div>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-1">
          {logs.length === 0 && (
            <div className="text-muted-foreground/30 italic">System ready. Waiting for events...</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="text-white/70 break-all font-mono">
              <span className="text-primary/50 mr-2">{'>'}</span>
              {log}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
