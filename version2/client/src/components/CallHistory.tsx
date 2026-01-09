import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CallHistory({ limit = 5, variant = "light" }: { limit?: number, variant?: "light" | "dark" }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Theme-based classes
    const textPrimary = variant === "light" ? "text-black" : "text-white";
    const textMuted = variant === "light" ? "text-black/40" : "text-white/40";
    const tableBg = variant === "light" ? "bg-white/50" : "bg-white/10";
    const borderCol = variant === "light" ? "border-black/5" : "border-white/10";

    useEffect(() => {
        async function fetchLogs() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("call_logs")
                .select("*")
                .eq("user_id", user.id)
                .order("start_time", { ascending: false })
                .limit(limit);

            if (!error && data) {
                setLogs(data);
            }
            setLoading(false);
        }

        fetchLogs();

        // Subscribe to new logs
        const channel = supabase
            .channel("call_logs_changes")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "call_logs" },
                () => fetchLogs()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [limit]);

    if (loading) return (
        <div className="flex items-center justify-center p-8">
            <div className={`w-6 h-6 border-2 ${variant === "light" ? "border-blue-600" : "border-white"} border-t-transparent rounded-full animate-spin`} />
        </div>
    );

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${textMuted} flex items-center gap-2`}>
                    <Clock className="w-4 h-4" />
                    Recent Call Sessions
                </h3>
                <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live Logs</span>
            </div>

            <div className={`${tableBg} backdrop-blur-sm rounded-2xl border ${variant === "light" ? "border-white/20" : "border-white/10"} overflow-hidden shadow-xl`}>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`border-b ${borderCol}`}>
                                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Timestamp</th>
                                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Duration</th>
                                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Status</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${borderCol}`}>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className={`px-6 py-12 text-center ${textMuted} text-xs font-bold uppercase tracking-widest italic`}>
                                        No call logs recorded yet
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`${variant === "light" ? "hover:bg-white/40" : "hover:bg-white/5"} transition-colors`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-bold ${textPrimary} flex items-center gap-2`}>
                                                    <Calendar className="w-3 h-3 text-blue-500" />
                                                    {format(new Date(log.start_time), "MMM dd, yyyy")}
                                                </span>
                                                <span className={`text-[10px] font-mono ${textMuted}`}>
                                                    {format(new Date(log.start_time), "hh:mm:ss a")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-mono font-bold ${variant === "light" ? "text-black bg-blue-50" : "text-white bg-white/10"} px-2 py-1 rounded-md`}>
                                                {log.duration_seconds || "0"}s
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
                                                    {log.status}
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
