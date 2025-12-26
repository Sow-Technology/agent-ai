"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform, useInView } from "framer-motion";
// import { Navbar } from "@/components/landing/Navbar";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { Spotlight } from "@/components/landing/Spotlight";
import { cn } from "@/lib/utils";
import { 
  ArrowRight, ArrowLeft, ShieldCheck, Cpu, BarChart3, 
  Terminal, FileText, Globe, CheckCircle2, Zap, Lock, Sun, Moon,
  Maximize2, X, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import Image from "next/image";

// --- Components for Stats ---

function Counter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => 
    `${prefix}${Math.round(current).toLocaleString()}${suffix}`
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

// --- Carousel Component ---

function Carousel({ images, onExpand }: { images: string[], onExpand: (src: string) => void }) {
  const [index, setIndex] = useState(0);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    setIndex(0); // Reset on mount/prop change
  }, [images]);

  return (
    <div className="relative w-full h-full group bg-neutral-900/50 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10">
      <AnimatePresence mode="popLayout">
        <motion.div
           key={index}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.5 }}
           className="relative w-full h-full cursor-zoom-in"
           onClick={() => onExpand(images[index])}
        >
             {/* Blurred Background for Fill */}
             <div className="absolute inset-0 overflow-hidden">
                <Image 
                    src={images[index]} 
                    alt="Background Blur" 
                    fill 
                    className="object-cover blur-xl opacity-50 contrast-125 scale-110"
                />
             </div>
             
             {/* Main Image (Uncropped) */}
             <Image 
                src={images[index]} 
                alt="Dashboard Preview" 
                fill 
                className="object-contain relative z-10"
             />
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {images.length > 1 && (
        <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-20">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-20">
                <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {images.map((_, i) => (
                    <div 
                        key={i} 
                        className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors shadow-sm",
                            i === index ? "bg-emerald-500" : "bg-white/50"
                        )} 
                    />
                ))}
            </div>
        </>
      )}

      {/* Expand Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onExpand(images[index]); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-600 z-20"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Holographic Overlay Effects */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] mix-blend-overlay z-10" />
    </div>
  );
}

// Content Mapping
const DOSSIER_PAGES = [
  {
    id: "mission_brief",
    title: "Mission Brief",
    icon: ShieldCheck,
    images: ["/dashboard/1.png"],
    content: (
      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-mono text-emerald-600 dark:text-emerald-500 mb-2 uppercase tracking-widest">Subject // Product Overview</h2>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
            AssureQAi <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-600 dark:from-emerald-400 dark:to-cyan-500">Platform Overview</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
            A quality assurance platform built to audit <span className="text-neutral-900 dark:text-white font-bold">100% of your calls</span> across inbound, outbound, collections, sales, and tele-verification.
          </p>
        </div>
        
        <div className="p-6 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl md:backdrop-blur-sm shadow-xl dark:shadow-2xl">
          <h3 className="text-sm font-mono text-neutral-500 dark:text-neutral-400 mb-2 uppercase">Unique Selling Proposition</h3>
          <p className="text-lg text-neutral-800 dark:text-white font-medium">
            "Full coverage at scale, deeper diagnostics, faster turnarounds—at a fraction of manual QA costs."
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Parameter-level defect detection</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Automatic TNIs (Training Needs)</span>
            </div>
        </div>
      </div>
    )
  },
  {
    id: "specs",
    title: "Technical Specs",
    icon: Cpu,
    images: ["/dashboard/2.png", "/dashboard/3.png"],
    content: (
      <div className="space-y-8">
        <div>
           <h2 className="text-sm font-mono text-indigo-600 dark:text-indigo-500 mb-2 uppercase tracking-widest">Capabilities // Core Features</h2>
           <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">System Specifications.</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
                { title: "End-to-End Auditing", desc: "100% coverage or configurable sampling." },
                { title: "Configurable QA Forms", desc: "Parameters, weights, fatal flags logic." },
                { title: "Scoring & Status", desc: "Auto-calculated QA scores with GAR distribution." },
                { title: "Defect Intelligence", desc: "Tagging across behavioral, process, & compliance." },
                { title: "TNIs & Coaching", desc: "Smart TNIs linked to coaching plans." },
                { title: "Dashboards", desc: "Real-time drilldowns & trend charts." }
            ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                </div>
            ))}
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-white/10">
            <h3 className="text-sm font-mono text-neutral-500 dark:text-neutral-400 mb-4 uppercase">Packages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="font-bold text-neutral-900 dark:text-white mb-1 text-sm">Essential</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Core QA + GAR + Defect Tagging</div>
                </div>
                <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10">
                    <div className="font-bold text-neutral-900 dark:text-white mb-1 text-sm">Advanced</div>
                    <div className="text-[10px] text-neutral-600 dark:text-neutral-300">TNIs + Coaching + Dashboards</div>
                </div>
                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/10">
                    <div className="font-bold text-neutral-900 dark:text-white mb-1 text-sm">Enterprise</div>
                    <div className="text-[10px] text-neutral-600 dark:text-neutral-300">Governance + SSO/RBAC</div>
                </div>
            </div>
        </div>
      </div>
    )
  },
  {
    id: "intel",
    title: "Intelligence Intel",
    icon: BarChart3,
    images: ["/dashboard/4.png", "/dashboard/5.png"],
    content: (
      <div className="space-y-6">
        <div>
           <h2 className="text-sm font-mono text-amber-600 dark:text-amber-500 mb-2 uppercase tracking-widest">Analysis // Comparison</h2>
           <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">Tactical Advantage.</h1>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-transparent shadow-sm dark:shadow-none">
            <table className="w-full text-sm text-left min-w-[500px]">
                <thead className="bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono uppercase text-xs">
                    <tr>
                        <th className="p-3">Dimension</th>
                        <th className="p-3">Manual QA</th>
                        <th className="p-3 text-emerald-600 dark:text-emerald-400">AssureQAi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-white/10 text-neutral-600 dark:text-neutral-300">
                    <tr><td className="p-3 font-medium">Coverage</td><td className="p-3">Costly for 100%</td><td className="p-3 text-neutral-900 dark:text-white font-bold">100% at any volume</td></tr>
                    <tr><td className="p-3 font-medium">Turnaround</td><td className="p-3">Daily/Weekly batches</td><td className="p-3 text-neutral-900 dark:text-white font-bold">Near Real-time</td></tr>
                    <tr><td className="p-3 font-medium">Insights</td><td className="p-3">Manual consolidation</td><td className="p-3 text-neutral-900 dark:text-white font-bold">Auto-parameter level</td></tr>
                </tbody>
            </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-500/20 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none">
                <h3 className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-2 uppercase">Cost Efficiency</h3>
                <div className="text-4xl font-bold text-neutral-900 dark:text-white mb-1">
                    <Counter value={92} suffix="%" />
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">Savings at 150k calls/month</p>
                <div className="h-1.5 w-full bg-neutral-300 dark:bg-black/50 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "92%" }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-emerald-500" 
                    />
                </div>
            </div>

             <div className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Outcomes</h3>
                <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/> Lower regulatory risk</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/> Improve FCR/CSAT correlation</li>
                </ul>
            </div>
        </div>
      </div>
    )
  },
  {
    id: "logistics",
    title: "Logistics",
    icon: Terminal,
    images: ["/dashboard/6.png", "/dashboard/7.png"],
    content: (
      <div className="space-y-8">
        <div>
           <h2 className="text-sm font-mono text-purple-600 dark:text-purple-500 mb-2 uppercase tracking-widest">Pricing // Slabs</h2>
           <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">Investment Logic.</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
                { label: "0 – 10K calls", price: 10, sub: "/audit" },
                { label: "10K – 25K calls", price: 8, sub: "/audit" },
                { label: "25K – 50K calls", price: 6, sub: "/audit" },
                { label: "50K – 75K calls", price: 4, sub: "/audit" },
                { label: "75K – 100K calls", price: 3, sub: "/audit" },
                { label: "Above 100K", price: 2, sub: "/audit" },
            ].map((slab, i) => (
                <div key={i} className="p-3 rounded-xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-center hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors group shadow-sm dark:shadow-none">
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mb-1">{slab.label}</div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        <Counter value={slab.price} prefix="₹" />
                    </div>
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{slab.sub}</div>
                </div>
            ))}
        </div>

        <div className="p-5 rounded-xl border border-dashed border-neutral-300 dark:border-white/20 bg-neutral-50 dark:bg-white/[0.02] mt-4">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-2 text-sm">Optional Add-ons</h3>
            <div className="flex flex-wrap gap-2">
                {["Custom QA Form Design", "Calibration Workshops", "Advanced Coaching Modules", "Governance Support"].map((tag, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-white dark:bg-white/5 text-[10px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-none">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
      </div>
    )
  },
  {
    id: "reports",
    title: "Field Reports",
    icon: FileText,
    images: ["/dashboard/8.png", "/dashboard/9.png"],
    content: (
      <div className="space-y-8">
        <div>
           <h2 className="text-sm font-mono text-rose-600 dark:text-rose-500 mb-2 uppercase tracking-widest">Evidence // Case Studies</h2>
           <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">Proven Outcomes.</h1>
        </div>

        <div className="grid grid-cols-1 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 relative overflow-hidden group hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
                <div className="absolute left-0 top-0 w-1 h-full bg-rose-500" />
                <h3 className="font-bold text-neutral-900 dark:text-white text-base mb-1">Collections Campaign</h3>
                <div className="text-[10px] font-mono text-neutral-500 mb-2">Volume: 75K calls/month</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    "Fatal error rate reduced by <Counter value={42} suffix="%" />, audit cost down <Counter value={38} suffix="%" />."
                </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 relative overflow-hidden group hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
                <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500" />
                <h3 className="font-bold text-neutral-900 dark:text-white text-base mb-1">Sales Campaign</h3>
                <div className="text-[10px] font-mono text-neutral-500 mb-2">Volume: 40K calls/month</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">"Parameter compliance up <Counter value={27} suffix="%" />; improved conversion hygiene."</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 relative overflow-hidden group hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
                <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500" />
                <h3 className="font-bold text-neutral-900 dark:text-white text-base mb-1">Customer Support</h3>
                <div className="text-[10px] font-mono text-neutral-500 mb-2">Volume: 100K+ calls/month</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">"GAR distribution stabilized with <Counter value={51} suffix="%" /> Green scores in 8 weeks."</p>
            </div>
        </div>
      </div>
    )
  },
  {
    id: "debrief",
    title: "Debrief",
    icon: Globe,
    images: ["/dashboard/1.png", "/dashboard/4.png", "/dashboard/8.png"],
    content: (
      <div className="space-y-8 flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center mb-4 animate-pulse">
            <Globe className="w-8 h-8 text-neutral-900 dark:text-white" />
        </div>
        
        <div>
           <h2 className="text-sm font-mono text-neutral-500 mb-2 uppercase tracking-widest">Transmission Complete</h2>
           <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">Ready to Deploy?</h1>
           <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto mb-8">
             Built by QA and MIS practitioners who’ve audited millions of calls. Accuracy over assumptions.
           </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
            <Link href="/book-demo" className="flex-1">
                <button className="w-full h-12 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-lg">
                    <Zap className="w-4 h-4" /> Book Live Demo
                </button>
            </Link>
            <Link href="/contact" className="flex-1">
                <button className="w-full h-12 bg-transparent border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                    Contact Sales
                </button>
            </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-white/10 w-full max-w-lg mx-auto">
             <div className="flex justify-center gap-8 text-sm text-neutral-500 dark:text-neutral-400">
                <a href="https://linkedin.com/company/assureqai" className="hover:text-neutral-900 dark:hover:text-white transition-colors">LinkedIn</a>
                <a href="https://x.com/assureqai" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Twitter/X</a>
                <a href="mailto:info@assureqai.com" className="hover:text-neutral-900 dark:hover:text-white transition-colors">info@assureqai.com</a>
             </div>
        </div>
      </div>
    )
  }
];

export default function BrochurePage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Keyboard Navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "Escape") setFullScreenImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage]);

  // Trigger glitch effect on page change
  useEffect(() => {
    setGlitch(true);
    const timer = setTimeout(() => setGlitch(false), 300);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < DOSSIER_PAGES.length - 1) {
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(prev => prev - 1);
    }
  };

  // 3D Holographic Animated Transitions
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
      z: -100
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      z: 0,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
      z: -100,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    })
  };

  return (
    <Spotlight className="min-h-screen bg-neutral-50 dark:bg-black selection:bg-emerald-500/20 flex flex-col pt-12 pb-12 overflow-hidden transition-colors duration-500 relative">
      <div className="absolute top-6 right-6 z-50">
        <ThemeSwitcher />
      </div>
      {/* Full Screen Modal */}
      <AnimatePresence>
        {fullScreenImage && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                onClick={() => setFullScreenImage(null)}
            >
                <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="relative w-full max-w-7xl h-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Image src={fullScreenImage} alt="Fullscreen View" fill className="object-contain" />
                    <button 
                        onClick={() => setFullScreenImage(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white font-mono text-xs border border-white/10">
                        PRESS ESC TO CLOSE
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Glitch Overlay */}
      <AnimatePresence>
        {glitch && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 pointer-events-none bg-black dark:bg-white mix-blend-difference"
                style={{
                    background: `repeating-linear-gradient(0deg, transparent, transparent 2px, #10b981 2px, #10b981 4px)`
                }}
            />
        )}
      </AnimatePresence>

      {/* Cinematic Background Lines */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
          <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-neutral-300 dark:via-white/20 to-transparent" />
          <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-neutral-300 dark:via-white/20 to-transparent" />
          <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-300 dark:via-white/10 to-transparent" />
          <div className="absolute bottom-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-300 dark:via-white/10 to-transparent" />
      </div>

      <div className="flex-1 flex flex-col relative z-10 px-4 md:px-8 max-w-7xl mx-auto w-full">
        
        {/* Dossier Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-500 tracking-widest uppercase">
                    Classified // Dossier {glitch && <span className="animate-pulse text-neutral-900 dark:text-white">_LOADING_</span>}
                </span>
            </div>
            <div className="font-mono text-xs text-neutral-500">
                File {currentPage + 1} of {DOSSIER_PAGES.length}
            </div>
        </div>

        {/* Main Content Area - Flexible Growth */}
        <div className="flex-1 relative flex items-center justify-center min-h-[500px]">
             
             {/* Navigation Arrows (Large Screens) */}
             <button 
                onClick={prevPage} 
                disabled={currentPage === 0}
                className="hidden lg:flex absolute -left-8 xl:-left-16 z-20 p-4 rounded-full border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-neutral-900 dark:text-white disabled:opacity-0 hover:bg-neutral-50 dark:hover:bg-white/10 transition-all hover:scale-110 active:scale-95 shadow-md dark:shadow-none"
             >
                 <ArrowLeft className="w-6 h-6" />
             </button>

             <button 
                onClick={nextPage} 
                disabled={currentPage === DOSSIER_PAGES.length - 1}
                className="hidden lg:flex absolute -right-8 xl:-right-16 z-20 p-4 rounded-full border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-neutral-900 dark:text-white disabled:opacity-0 hover:bg-neutral-50 dark:hover:bg-white/10 transition-all hover:scale-110 active:scale-95 shadow-md dark:shadow-none"
             >
                 <ArrowRight className="w-6 h-6" />
             </button>

             {/* Slide Content */}
             <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-16 items-start lg:items-center justify-center perspective-[2000px]">
                 
                 {/* Visual Component: Carousel or Placeholder */}
                 <motion.div 
                    key={`visual-${currentPage}`}
                    initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full lg:w-5/12 aspect-[4/3] lg:aspect-video max-h-[400px] lg:max-h-[500px] rounded-2xl bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:to-black border border-neutral-200 dark:border-white/10 relative overflow-hidden group shadow-xl dark:shadow-2xl shrink-0 mx-auto"
                 >
                     {DOSSIER_PAGES[currentPage].images && DOSSIER_PAGES[currentPage].images.length > 0 ? (
                         <Carousel 
                            images={DOSSIER_PAGES[currentPage].images} 
                            onExpand={(src) => setFullScreenImage(src)} 
                         />
                     ) : (
                         /* Fallback for when no images are present (e.g. if we remove one later) */
                         <>
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 blur-xl rounded-full animate-pulse z-0" />
                                    {(() => {
                                        const Icon = DOSSIER_PAGES[currentPage].icon;
                                        return <Icon className="w-24 h-24 text-neutral-900 dark:text-white relative z-10 opacity-80" />;
                                    })()}
                                </div>
                            </div>
                         </>
                     )}
                 </motion.div>

                 {/* Text Content - Animated Transition */}
                 <div className="w-full lg:w-7/12 relative min-h-[400px] flex items-center">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={currentPage}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full"
                      >
                        {DOSSIER_PAGES[currentPage].content}
                      </motion.div>
                    </AnimatePresence>
                 </div>

             </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="mt-8 shrink-0 flex flex-col gap-4">
             {/* Progress Bar */}
             <div className="w-full h-1 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentPage + 1) / DOSSIER_PAGES.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                 />
             </div>

             {/* Mobile Navigation Controls */}
             <div className="flex lg:hidden items-center justify-between">
                 <button 
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="p-3 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white disabled:opacity-20 active:bg-neutral-100 dark:active:bg-white/10 transition-colors"
                 >
                     <ArrowLeft className="w-5 h-5" />
                 </button>
                 <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                     {DOSSIER_PAGES[currentPage].title}
                 </span>
                 <button 
                    onClick={nextPage}
                    disabled={currentPage === DOSSIER_PAGES.length - 1}
                    className="p-3 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white disabled:opacity-20 active:bg-neutral-100 dark:active:bg-white/10 transition-colors"
                 >
                     <ArrowRight className="w-5 h-5" />
                 </button>
             </div>

             {/* Desktop Tab Indicators */}
             <div className="hidden lg:flex items-center justify-between px-4">
                 {DOSSIER_PAGES.map((page, index) => (
                     <button
                        key={index}
                        onClick={() => {
                            setDirection(index > currentPage ? 1 : -1);
                            setCurrentPage(index);
                        }}
                        className={cn(
                            "flex items-center gap-2 py-2 px-4 rounded-lg transition-all text-xs font-mono uppercase tracking-widest group",
                            currentPage === index 
                                ? "bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 transition-colors" 
                                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                        )}
                     >
                         <span className={cn("transition-colors", currentPage === index ? "text-emerald-600 dark:text-emerald-500" : "")}>0{index + 1}</span>
                         <span className={cn("hidden xl:block transition-opacity", currentPage !== index && "opacity-50 group-hover:opacity-100")}>
                             {page.title}
                         </span>
                     </button>
                 ))}
             </div>
        </div>
      </div>
    </Spotlight>
  );
}
