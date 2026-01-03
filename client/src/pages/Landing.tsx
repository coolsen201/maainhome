import { Link } from "wouter";
import { Monitor, Smartphone, Video } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
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
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Intercom</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          High-fidelity, low-latency WebRTC video communication for your home security.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl z-10">
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
              <p className="text-muted-foreground">
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
              <p className="text-muted-foreground">
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
      </div>

      <div className="mt-16 text-center text-xs text-muted-foreground/40 font-mono z-10">
        SYSTEM V1.0.4 • SECURE CONNECTION • END-TO-END ENCRYPTED
      </div>
    </div>
  );
}
