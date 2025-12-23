"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { WorldMap } from "@/components/landing/WorldMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, MessagesSquare, Radio, ShieldCheck } from "lucide-react";

export default function ContactPage() {
  return (
    <Spotlight className="min-h-screen bg-black selection:bg-primary/20 overflow-hidden">
      <Navbar />
      
      {/* Background Layer */}
      <WorldMap />
      
      <main className="pt-32 pb-16 min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-6"
             >
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">Systems Operational</span>
             </motion.div>
             
             <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-4"
             >
                Open Frequency.
             </motion.h1>
             <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                 Initiate a secure channel with our engineering or sales team. We respond within 24ms (mostly).
             </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl items-start">
            
            {/* Left: Communication Array (Status Cards) */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-4 space-y-4"
            >
                <div className="group p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md hover:bg-white/5 transition-colors cursor-default">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <MessagesSquare className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" /> ONLINE
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Sales & Pilots</h3>
                    <p className="text-sm text-muted-foreground mb-4">For enterprise licensing and custom deployments.</p>
                    <div className="text-white font-mono text-sm">sales@assureqai.com</div>
                </div>

                <div className="group p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md hover:bg-white/5 transition-colors cursor-default">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" /> ONLINE
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Technical Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">Direct line to our integration engineers.</p>
                    <div className="text-white font-mono text-sm">support@assureqai.com</div>
                </div>

                <div className="group p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md hover:bg-white/5 transition-colors cursor-default">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-white/50">
                            UTC+5:30
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Global HQ</h3>
                    <p className="text-sm text-muted-foreground">Bengaluru, India</p>
                </div>
            </motion.div>

            {/* Right: The Glass Monolith (Form) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-8"
            >
                <form className="relative p-8 md:p-12 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                    {/* Decorative Top Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-50" />
                    
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="space-y-3">
                            <label className="text-xs font-mono text-white/60 uppercase tracking-widest pl-1">Input // First Name</label>
                            <Input className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-12 focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:bg-white/5 transition-all text-lg text-white placeholder:text-white/20" placeholder="Jane" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-mono text-white/60 uppercase tracking-widest pl-1">Input // Last Name</label>
                            <Input className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-12 focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:bg-white/5 transition-all text-lg text-white placeholder:text-white/20" placeholder="Doe" />
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <label className="text-xs font-mono text-white/60 uppercase tracking-widest pl-1">Input // Work Email</label>
                        <Input className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-12 focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:bg-white/5 transition-all text-lg text-white placeholder:text-white/20" placeholder="jane@company.com" />
                    </div>

                    <div className="space-y-3 mb-10">
                         <label className="text-xs font-mono text-white/60 uppercase tracking-widest pl-1">Input // Directive</label>
                         <Textarea className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 min-h-[100px] focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:bg-white/5 transition-all text-lg text-white placeholder:text-white/20 resize-none" placeholder="We need to audit 50k calls/month..." />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span>Encrypted Transmission</span>
                        </div>
                        <Button className="h-14 px-8 bg-white text-black hover:bg-white/90 rounded-full font-bold text-lg tracking-tight group">
                            Transmit Request
                        </Button>
                    </div>
                </form>
            </motion.div>

        </div>

      </main>
    </Spotlight>
  );
}
