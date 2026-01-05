import { Link, useLocation } from "wouter";
import { Monitor, Smartphone, Video, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login Successful",
        description: "Welcome back to Mom in Home.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for the password reset link.",
      });
      setShowResetModal(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Could not send reset email. Please try again.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 text-center space-y-4 mb-16"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/20 mb-6">
          <Video className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white/70 mb-2">
          Secure <span className="font-bold uppercase italic">Intercom</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto mb-6">
          High-fidelity, low-latency WebRTC video communication for your home security.
        </p>
        <span className="block text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_10px_40px_rgba(234,179,8,0.3)] italic">
          &nbsp;Mom in Home
        </span>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl z-10 px-4">
        <Link href="/home" className="group cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full glass-panel p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-colors flex flex-col items-center text-center space-y-6 group-hover:shadow-2xl group-hover:shadow-primary/10"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Monitor className="w-10 h-10 text-white group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Home Station</h2>
              <p className="text-muted-foreground text-sm">
                Deploy on your home device. Acts as the camera source and main receiver.
              </p>
            </div>
            <div className="mt-auto pt-6 w-full">
              <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium group-hover:bg-primary group-hover:border-primary transition-all">
                Launch Station
              </div>
            </div>
          </motion.div>
        </Link>

        <Link href="/remote" className="group cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full glass-panel p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 transition-colors flex flex-col items-center text-center space-y-6 group-hover:shadow-2xl group-hover:shadow-purple-500/10"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Smartphone className="w-10 h-10 text-white group-hover:text-purple-400 transition-colors" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Remote Viewer</h2>
              <p className="text-muted-foreground text-sm">
                Connect from your phone or laptop to view the stream and talk back.
              </p>
            </div>
            <div className="mt-auto pt-6 w-full">
              <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium group-hover:bg-purple-600 group-hover:border-purple-600 transition-all">
                Connect Remote
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Login Section */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="h-full glass-panel p-8 rounded-3xl border border-white/10 hover:border-green-500/50 transition-colors flex flex-col items-center text-center space-y-6 group-hover:shadow-2xl group-hover:shadow-green-500/10"
        >
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <Video className="w-10 h-10 text-white group-hover:text-green-400 transition-colors" />
          </div>
          <form onSubmit={handleLogin} className="space-y-4 w-full text-left">
            <h2 className="text-2xl font-semibold text-white text-center">System Login</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Email ID"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/50 transition-all font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/50 transition-all font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="mt-auto pt-6 w-full">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold tracking-widest uppercase text-xs hover:bg-green-600 hover:border-green-600 transition-all shadow-lg hover:shadow-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Authenticating..." : "Submit Login"}
              </button>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="w-full mt-3 py-2 text-[10px] text-white/40 hover:text-green-400 transition-colors font-bold tracking-widest uppercase"
              >
                Forgot Password?
              </button>
              <div className="mt-4 text-center pt-4 border-t border-white/5">
                <p className="text-[10px] text-white/20 font-bold tracking-widest uppercase">
                  New System? <Link href="/register" className="text-green-500 hover:text-white transition-colors ml-2">Join Now</Link>
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Online Advertisement Example Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="mt-16 w-full max-w-5xl z-10 px-4"
      >
        <div className="glass-panel p-1 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-3xl overflow-hidden group hover:border-yellow-500/30 transition-all duration-700">
          <div className="relative aspect-video w-full rounded-[2.2rem] overflow-hidden">
            <iframe
              className="absolute inset-0 w-full h-full border-0"
              src="https://www.youtube.com/embed/zTiV40-tErQ"
              title="Product Advertisement"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
          <div className="px-8 py-4 flex items-center justify-between text-white/40">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Advertisement Partner</span>
            <div className="flex gap-4">
              <span className="text-[10px] hover:text-white transition-colors cursor-pointer uppercase tracking-widest">Learn More</span>
              <span className="text-[10px] hover:text-white transition-colors cursor-pointer uppercase tracking-widest">Partner Portal</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-16 text-center text-xs text-muted-foreground/40 font-mono z-10">
        SYSTEM V1.0.4 • SECURE CONNECTION • END-TO-END ENCRYPTED
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-3xl border border-white/10 w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-semibold text-white text-center mb-2">Reset Password</h2>
              <p className="text-white/40 text-sm text-center mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/50 transition-all font-mono"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={resetLoading}
                  required
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 rounded-xl bg-green-600 border border-green-600 text-white font-bold tracking-widest uppercase text-xs hover:bg-green-500 transition-all shadow-lg hover:shadow-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
