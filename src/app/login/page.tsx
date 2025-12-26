"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  return (
    <Spotlight className="min-h-screen bg-white dark:bg-black selection:bg-primary/20 overflow-hidden flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-16 min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
        
        <div className="container mx-auto max-w-6xl">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             
             {/* Left: Content & Status */}
             <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8 order-2 lg:order-1"
             >
                 <div>
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 mb-6">
                         <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                         <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">System Online</span>
                     </div>
                     <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-6">
                         Access <br />
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-400 dark:via-purple-400 dark:to-rose-400">
                             Control Panel.
                         </span>
                     </h1>
                     <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                         Authenticate to manage audit parameters, view real-time intelligence, and configure AI agents.
                     </p>
                 </div>

                 <div className="space-y-4">
                     {[
                         "Secure 256-bit encryption session",
                         "Real-time audit dashboard access",
                         "AI agent configuration & training",
                         "Enterprise-grade role management"
                     ].map((item, i) => (
                         <div key={i} className="flex items-center gap-3 text-sm text-neutral-600 dark:text-gray-300">
                             <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                             <span>{item}</span>
                         </div>
                     ))}
                 </div>
             </motion.div>

             {/* Right: The Holographic Terminal (Login Form) */}
             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="relative w-full rounded-3xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 flex flex-col overflow-hidden group backdrop-blur-xl shadow-xl dark:shadow-2xl order-1 lg:order-2"
             >
                 {/* Terminal Header */}
                 <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02]">
                     <div className="flex items-center gap-2">
                         <div className="flex gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/50" />
                             <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                         </div>
                         <div className="h-4 w-[1px] bg-neutral-200 dark:bg-white/10 mx-2" />
                         <span className="text-[10px] font-mono text-neutral-400 dark:text-white/40 tracking-widest uppercase">Secure Channel // Encrypted</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-500 font-bold">LIVE</span>
                     </div>
                 </div>

                 {/* Scanline & Grid Background */}
                 <div className="absolute inset-0 pointer-events-none">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan" />
                 </div>
                 
                 {/* Form Content */}
                 <div className="relative z-10 p-8 flex-1">
                     <LoginForm />
                     
                     <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-white/5 flex justify-center gap-4 text-[10px] text-neutral-400 dark:text-white/30 font-mono uppercase tracking-wider">
                         <span className="flex items-center gap-1.5">
                             <ShieldCheck className="w-3 h-3" /> E2E Encrypted
                         </span>
                         <span className="flex items-center gap-1.5">
                             <Zap className="w-3 h-3" /> SSO Enabled
                         </span>
                     </div>
                 </div>
             </motion.div>
           </div>
        </div>

      </main>
    </Spotlight>
  );
}
