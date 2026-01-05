import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthCallback() {
    const [, setLocation] = useLocation();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            // Supabase automatically parses the URL hash #access_token=...
            // We just need to check if we have a session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                setError(error.message);
                return;
            }

            if (session) {
                // Successful email verification or password reset login

                // Check URL params for type if you want specific messages
                // But usually session presence is enough for confirmation

                setSuccess("Email verified successfully!");

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    // If it was a password reset flow (type=recovery), we might want to go to a profile setting
                    // But dashboard is fine for now as they are logged in.
                    // For 'recovery' flow, usually they land here logged in, then we redirect to a place to change password.
                    // We can check the URL for `type=recovery` if needed, but standard confirm is fine.

                    // We can verify if this is a recovery flow by checking the URL hash/query if it persists,
                    // but `getSession` consumes it. 

                    setLocation("/dashboard");
                }, 2000);
            } else {
                // Sometimes the hash isn't processed yet or valid
                // Wait a moment or check if supabase client handles it
                // For PKCE flow or implicit flow, the redirect happens. 
                // If we land here without session, maybe something failed.

                // Let's give it a slight delay to ensure the client processed the hash
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                if (retrySession) {
                    setSuccess("Email verified successfully!");
                    setTimeout(() => setLocation("/dashboard"), 2000);
                } else {
                    setError("Verification failed or link expired.");
                }
            }
        };

        handleAuthCallback();
    }, [setLocation]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-8 rounded-3xl border border-white/10 max-w-sm w-full text-center z-10"
            >
                {error ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                        <p className="text-white/50 text-sm">{error}</p>
                        <button
                            onClick={() => setLocation("/")}
                            className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : success ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Email Verified!</h2>
                        <p className="text-white/50 text-sm">Redirecting to your dashboard...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Verifying...</h2>
                        <p className="text-white/50 text-sm">Please wait while we confirm your email.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
