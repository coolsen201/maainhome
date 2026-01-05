import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { UserPlus, ArrowLeft, Mail, Lock, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    const generateSecureKey = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
        let key = "";
        for (let i = 0; i < 256; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign up user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (signUpError) throw signUpError;
            if (!data.user) throw new Error("Registration failed.");

            // 2. Generate and Update Profile with Secure Key
            const secureKey = generateSecureKey();
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    secure_key: secureKey,
                    full_name: fullName,
                    email_id: email
                });

            if (profileError) {
                console.error("Profile update error:", profileError);
                // Note: The profile row might not be created yet if the trigger is slow
                // We handle this by allowing the handle_new_user function in SQL to handle initial creation
            }

            toast({
                title: "Account Created!",
                description: "Registration successful. Welcome to Mom in Home.",
            });
            setLocation("/dashboard");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.message || "Something went wrong.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[128px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <Link href="/" className="inline-flex items-center text-xs font-bold tracking-widest uppercase text-white/40 hover:text-primary transition-colors group mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                </Link>

                <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <UserPlus className="w-24 h-24 text-primary" />
                    </div>

                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2 italic">CREATE ACCOUNT</h1>
                        <p className="text-sm text-white/40 font-medium font-mono uppercase tracking-widest">Join the Secure Intercom</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-mono"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="email"
                                    placeholder="Email ID"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-mono"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="password"
                                    placeholder="Create Password"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-mono"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest leading-relaxed">
                                A unique 256-character cryptokey will be generated for your Station & Remote device automatically.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-primary text-black font-black tracking-[0.2em] uppercase text-xs hover:bg-yellow-400 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? "Initializing..." : "Register System"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-white/20 font-bold tracking-widest uppercase">
                            Already have a system? <Link href="/" className="text-primary hover:text-white transition-colors ml-2">Login</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
