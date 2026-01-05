import { cn } from "@/lib/utils";
import { Activity, Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  status: "disconnected" | "connecting" | "connected" | "failed";
  className?: string;
}

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: Wifi, text: "Secure Link Active" };
      case "connecting":
        return { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Activity, text: "Establishing Connection..." };
      case "failed":
        return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: WifiOff, text: "Connection Failed" };
      default:
        return { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: WifiOff, text: "Disconnected" };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-300",
      config.bg,
      config.border,
      className
    )}>
      <Icon className={cn("w-4 h-4", config.color, status === "connecting" && "animate-pulse")} />
      <span className={cn("text-xs font-bold tracking-wider uppercase", config.color)}>
        {config.text}
      </span>
    </div>
  );
}
