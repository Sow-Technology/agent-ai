"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function BookDemoPage() {
  return (
    <Spotlight className="min-h-screen bg-black selection:bg-primary/20">
      <Navbar />
      
      <main className="pt-32 pb-16 min-h-screen flex flex-col justify-center items-center">
        
        <div className="container px-4 text-center mb-12">
             <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-6">
                 See the Future of QA.
             </h1>
             <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                 Book a 30-minute walkthrough with a product expert. No aggressive sales pitch, just a deep dive into the tech.
             </p>
        </div>

        <div className="container px-4 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             
             {/* Left: Expectations */}
             <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8 p-8 rounded-3xl bg-white/[0.03] border border-white/10"
             >
                 <h3 className="text-2xl font-bold text-white mb-6">What to expect:</h3>
                 
                 {[
                    "Live demonstration of the 100% audit workflow.",
                    "Deep dive into sentiment analysis & fatal error detection.",
                    "Custom ROI calculation based on your volume.",
                    "Q&A on integration and security."
                 ].map((item, i) => (
                     <div key={i} className="flex items-start gap-4">
                         <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                         <span className="text-lg text-white/80">{item}</span>
                     </div>
                 ))}
             </motion.div>

             {/* Right: The Holographic Terminal */}
             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative lg:h-[600px] w-full rounded-3xl bg-black/40 border border-white/10 flex flex-col overflow-hidden group backdrop-blur-xl shadow-2xl"
             >
                 {/* Terminal Header */}
                 <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                     <div className="flex items-center gap-2">
                         <div className="flex gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/50" />
                             <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                         </div>
                         <div className="h-4 w-[1px] bg-white/10 mx-2" />
                         <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Secure Channel // Encrypted</span>
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
                 <div className="relative z-10 p-8 flex-1 flex flex-col justify-center">
                     <form className="space-y-6">
                         
                         <div className="grid grid-cols-2 gap-6">
                             <div className="group/input relative">
                                 <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                                     Identity // Name
                                 </label>
                                 <input 
                                     type="text" 
                                     className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all placeholder:text-white/40 font-mono"
                                     placeholder="Enter designation..."
                                 />
                                 <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-emerald-500 group-focus-within/input:w-full transition-all duration-500" />
                             </div>

                             <div className="group/input relative">
                                 <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                                     Comms // Email
                                 </label>
                                 <input 
                                     type="email" 
                                     className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all placeholder:text-white/40 font-mono"
                                     placeholder="name@company.com"
                                 />
                                 <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-emerald-500 group-focus-within/input:w-full transition-all duration-500" />
                             </div>
                         </div>

                         <div className="group/input relative">
                             <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                                 Entity // Company Name
                             </label>
                             <input 
                                 type="text" 
                                 className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all placeholder:text-white/40 font-mono"
                                 placeholder="Global Corp Ltd."
                             />
                             <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                             </div>
                         </div>

                         <div className="group/input relative">
                             <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                                 Parameters // Message
                             </label>
                             <textarea 
                                 className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all placeholder:text-white/40 font-mono min-h-[100px] resize-none"
                                 placeholder="Requesting 100% audit coverage..."
                             />
                         </div>

                         <button 
                             type="button"
                             className="group/btn relative w-full h-14 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold uppercase tracking-wider overflow-hidden transition-all duration-300"
                         >
                             <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
                                 <span>Initiate Uplink</span>
                                 <div className="w-2 h-2 border-t-2 border-r-2 border-emerald-400 transform rotate-45 group-hover/btn:translate-x-1 transition-transform" />
                             </div>
                             
                             {/* Button Scan Effect */}
                             <div className="absolute inset-0 bg-emerald-500/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                         </button>

                         <div className="text-center">
                             <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest">
                                 Transmission secure via 256-bit encryption
                             </p>
                         </div>
                     </form>
                 </div>
             </motion.div>

        </div>

      </main>
    </Spotlight>
  );
}
