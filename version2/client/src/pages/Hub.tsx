import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import CallHistory from "@/components/CallHistory";

export default function Hub() {
    const [, setLocation] = useLocation();
    const { user, loading: authLoading, signOut } = useAuth();

    // Redirect to landing if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            setLocation("/");
        }
    }, [user, authLoading, setLocation]);
    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleSignOut = async () => {
        await signOut();
        setLocation("/");
    };

    const hubItems = [
        {
            title: "Home Station",
            description: "Launch the main display unit",
            icon: Monitor,
            href: "/home",
            color: "bg-blue-600",
            hover: "hover:bg-blue-700"
        },
        {
            title: "Remote View",
            description: "Open the caller application",
            icon: Smartphone,
            href: "/remote",
            color: "bg-green-600",
            hover: "hover:bg-green-700"
        },
        {
            title: "System Settings",
            description: "Manage photos & connections",
            icon: Settings,
            href: "/dashboard",
            color: "bg-red-600",
            hover: "hover:bg-red-700"
        }
    ];

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-black p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[128px]" />
            </div>

            <div className="max-w-6xl w-full z-10 space-y-12">
                <header className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <ShieldCheck className="w-10 h-10 text-black/60" />
                        <h1 className="text-2xl font-black uppercase tracking-[0.4em] italic">System Hub</h1>
                    </div>
                    <p className="text-black/40 font-mono text-xs uppercase tracking-widest leading-relaxed">
                        Secure session established for <span className="text-black font-bold">{user?.email}</span>
                    </p>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                    {hubItems.map((item, index) => (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link href={item.href}>
                                <div className="group cursor-pointer">
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl h-full transition-all hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] flex flex-col items-center text-center gap-6">
                                        <div className={`w-20 h-20 rounded-3xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                            <item.icon className="w-10 h-10 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black italic tracking-tight">{item.title}</h3>
                                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Call History Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full max-w-4xl mx-auto"
                >
                    <CallHistory limit={5} />
                </motion.div>
                <footer className="pt-12 flex flex-col items-center gap-6">
                    <button
                        onClick={handleSignOut}
                        className="bg-gray-50 hover:bg-red-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-3 text-xs font-bold uppercase tracking-widest transition-all hover:border-red-200 text-black/60 hover:text-red-600"
                    >
                        <LogOut className="w-4 h-4" />
                        Terminate Session
                    </button>
                    <div className="flex items-center gap-2 opacity-20">
                        <div className="w-1 h-1 rounded-full bg-white" />
                        <p className="text-[8px] font-bold uppercase tracking-[0.5em]">Mom in Home v2.0</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
