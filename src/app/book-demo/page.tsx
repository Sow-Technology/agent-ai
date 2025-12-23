"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { cn } from "@/lib/utils";
import { CheckCircle2, Calendar } from "lucide-react";

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

             {/* Right: Calendar Placeholder */}
             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative aspect-video lg:aspect-square w-full rounded-3xl bg-[#080808] border border-white/10 flex items-center justify-center overflow-hidden group"
             >
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-20" />
                 
                 {/* Simulated Scheduler Interface */}
                 <div className="text-center space-y-4 relative z-10">
                     <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 group-hover:scale-110 transition-transform duration-300">
                         <Calendar className="w-10 h-10 text-white" />
                     </div>
                     <h4 className="text-xl font-bold text-white">Scheduler Loading...</h4>
                     <p className="text-sm text-muted-foreground">Connecting to availability calendar</p>
                     
                     {/* Loading Spinner */}
                     <div className="w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden mt-6">
                         <div className="w-1/3 h-full bg-primary/50 animate-progress-bar rounded-full" />
                     </div>
                 </div>
             </motion.div>

        </div>

      </main>
    </Spotlight>
  );
}
