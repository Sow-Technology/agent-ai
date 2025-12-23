"use client";

import { motion } from "framer-motion";

const LOGOS = [
  "Logo", "Logo", "Logo", "Logo", "Logo", "Logo", "Logo"
];

export const LogoTicker = () => {
  return (
    <section className="py-10 bg-black border-y border-white/5 overflow-hidden">
        <div className="container px-4 mb-4 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Trusted by industry leaders</p>
        </div>
        <div className="flex relative items-center overflow-hidden">
            <div className="absolute left-0 w-32 h-full z-10 bg-gradient-to-r from-black to-transparent pointer-events-none" />
            <div className="absolute right-0 w-32 h-full z-10 bg-gradient-to-l from-black to-transparent pointer-events-none" />
            
            <motion.div 
                className="flex gap-16 min-w-max pr-16"
                animate={{ x: "-50%" }}
                transition={{ duration: 20, ease: "linear", repeat: Infinity }}
            >
                {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
                    <div key={i} className="text-2xl font-bold text-white/20 hover:text-white/80 transition-colors cursor-default select-none whitespace-nowrap">
                        {logo}
                    </div>
                ))}
            </motion.div>
        </div>
    </section>
  );
};
