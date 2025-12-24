"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Twitter, Linkedin, Github } from "lucide-react";
import Link from "next/link";
import { CosmicButton } from "./CosmicButton";
import { AssureQaiLogo } from "@/components/common/AssureQaiLogo";

export const CTASection = () => {
    return (
        <footer className="relative pt-32 pb-16 px-4 sm:px-6 overflow-hidden bg-black text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 pointer-events-none" />
            
            <div className="container relative z-10 mx-auto max-w-5xl text-center">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-5xl md:text-8xl font-bold tracking-tighter mb-8"
                >
                    Ready to <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Audit Everything?</span>
                </motion.h2>

                <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Join the automated QA revolution. Start your free pilot today and see parameter-level insights in action.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-32">
                    <CosmicButton>
                        <span className="flex items-center gap-2">
                           Start Free Pilot
                        </span>
                    </CosmicButton>
                    <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg bg-black/60 border-white/20 hover:bg-white/10 hover:border-white/30 text-white">
                        Contact Sales <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>

                {/* Footer Links */}
                <div className="border-t border-white/10 pt-24 pb-12 grid grid-cols-2 md:grid-cols-12 gap-12 text-left relative z-10">
                    <div className="col-span-2 md:col-span-4 flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                             <AssureQaiLogo 
                                 showIcon={true} 
                                 showLogo={true} 
                                 width={140} 
                                 className="h-9 w-auto"
                                 forceDark={true}
                             />
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                             Deep diagnostics for high-velocity teams. 
                             Replace random sampling with 100% automated coverage today.
                        </p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 md:col-start-7">
                        <h4 className="font-bold text-white mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Security</Link></li>
                        </ul>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <h4 className="font-bold text-white mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">About</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div className="col-span-2 md:col-span-2">
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                             <li><Link href="#" className="hover:text-indigo-400 transition-colors">Privacy</Link></li>
                             <li><Link href="#" className="hover:text-indigo-400 transition-colors">Terms</Link></li>
                             <li><Link href="#" className="hover:text-indigo-400 transition-colors">DPA</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                    <div>
                        © 2025 AssureQAi Inc. All rights reserved. Bengaluru, India.
                    </div>
                    <div className="flex gap-6">
                        <Twitter className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                        <Linkedin className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                        <Github className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                    </div>
                </div>
            </div>
        </footer>
    );
};
