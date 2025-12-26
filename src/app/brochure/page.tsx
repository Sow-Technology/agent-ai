"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { AssureQaiLogo } from "@/components/common/AssureQaiLogo";
import { cn } from "@/lib/utils";
import { 
  ArrowRight, Check, Zap, BarChart3, ShieldCheck, 
  Terminal, Activity, Lock, Search, MousePointer2, Briefcase, Users, TrendingUp 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// --- Types & Data ---

interface PageContent {
    id: string;
    type: 'cover' | 'content' | 'back';
    title?: string;
    content: React.ReactNode;
}

const BOOK_PAGES: PageContent[] = [
    // COVER (Page 0)
    {
        id: 'cover',
        type: 'cover',
        content: (
            <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900 border-4 border-neutral-800 p-8 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30 mix-blend-overlay" />
                <div className="absolute top-0 left-8 w-[1px] h-full bg-neutral-800/50" />
                
                <div className="relative z-10 border-2 border-emerald-500/30 p-8 w-full h-full flex flex-col items-center justify-center rounded-sm">
                    {/* Fixed Logo Colors: Removed 'invert' to keep original brand colors */}
                    <AssureQaiLogo showIcon showLogo width={180} className="mb-12" />
                    
                    <h1 className="text-4xl font-mono font-bold text-emerald-500 uppercase tracking-widest mb-4">
                        Mission<br/>Dossier
                    </h1>
                    
                    <div className="w-16 h-1 bg-emerald-500 mb-8" />
                    
                    <p className="text-neutral-400 font-mono text-xs max-w-[200px] leading-relaxed">
                        CLASSIFIED DOCUMENT<br/>
                        FOR AUTHORIZED EYES ONLY
                    </p>
                    
                    <div className="mt-auto pt-12">
                         <div className="text-xs font-mono text-neutral-600">VOL. 2025 // A</div>
                    </div>
                </div>
            </div>
        )
    },
    // PAGE 1: Introduction (Left) - "The Blind Spot"
    {
        id: 'intro_blind_spot',
        type: 'content',
        content: (
            <div className="p-10 h-full flex flex-col bg-[#fdfbf7] dark:bg-neutral-900 text-neutral-900 dark:text-white relative">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <ShieldCheck className="w-32 h-32" />
                 </div>
                 
                 <h2 className="text-2xl font-bold font-serif mb-6 text-emerald-800 dark:text-emerald-400">01. The Blind Spot</h2>
                 <p className="font-serif leading-relaxed mb-6 text-lg">
                    In traditional QA, only <b>1–2%</b> of interactions are audited. This leaves 98% of your customer conversations in the dark.
                 </p>
                 <p className="font-serif leading-relaxed mb-8">
                    AssureQAi eliminates this blind spot by auditing <b>100% of calls</b> across inbound, outbound, collections, and sales with superhuman precision.
                 </p>

                 <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-sm italic opacity-80">
                    "Full coverage at scale, deeper diagnostics, faster turnarounds—at a fraction of manual QA costs."
                 </div>
                 
                 <div className="mt-auto border-t border-neutral-200 dark:border-white/10 pt-6">
                    <div className="flex items-center gap-4 text-sm font-mono text-neutral-500">
                        <span>CONFIDENTIAL</span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                         <span>PG. 01</span>
                    </div>
                 </div>
            </div>
        )
    },
    // PAGE 2: Core Features (Right)
    {
        id: 'core_features',
        type: 'content',
        content: (
            <div className="p-10 h-full flex flex-col bg-[#fdfbf7] dark:bg-neutral-900 text-neutral-900 dark:text-white">
                 <h2 className="text-2xl font-bold font-serif mb-6 text-emerald-800 dark:text-emerald-400">02. Core Capabilities</h2>
                 
                 <ul className="space-y-4 font-serif text-sm">
                    <li className="flex gap-3">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                        <span><b>End-to-End Auditing:</b> 100% coverage or configurable sampling.</span>
                    </li>
                    <li className="flex gap-3">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                        <span><b>Configurable QA Forms:</b> Parameters, weights, logic, and fatal flags.</span>
                    </li>
                     <li className="flex gap-3">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                        <span><b>Auto-Scoring:</b> QA scores with GAR (Green/Amber/Red) distribution.</span>
                    </li>
                    <li className="flex gap-3">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                        <span><b>TNIs & Coaching:</b> Smart TNIs from defect patterns linked to coaching plans.</span>
                    </li>
                 </ul>

                 <div className="mt-6 relative h-48 w-full border border-neutral-200 dark:border-white/10 bg-white dark:bg-black/20 p-2">
                     <Image 
                        src="/dashboard/1.png" 
                        alt="Dashboard Preview" 
                        fill 
                        className="object-contain opacity-90"
                     />
                 </div>

                 <div className="mt-auto border-t border-neutral-200 dark:border-white/10 pt-6">
                    <div className="flex items-center gap-4 text-sm font-mono text-neutral-500">
                        <span>CONFIDENTIAL</span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                         <span>PG. 02</span>
                    </div>
                 </div>
            </div>
        )
    },
    // PAGE 3: Benefits (Left)
    {
        id: 'benefits',
        type: 'content',
        content: (
            <div className="p-10 h-full flex flex-col bg-[#fdfbf7] dark:bg-neutral-900 text-neutral-900 dark:text-white">
                 <h2 className="text-2xl font-bold font-serif mb-6 text-emerald-800 dark:text-emerald-400">03. Business Outcomes</h2>
                 
                 <div className="space-y-6 font-serif">
                     <div>
                         <h3 className="font-bold flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Lower Risk</h3>
                         <p className="text-sm opacity-80">Automated fatal error detection for DNC violations, miscommitments, and mandatory disclosures.</p>
                     </div>
                     <div>
                         <h3 className="font-bold flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Improve Scores</h3>
                         <p className="text-sm opacity-80">Track correlation with FCR/CSAT for leadership clarity.</p>
                     </div>
                     <div>
                         <h3 className="font-bold flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4 text-emerald-600" /> Cost Efficiency</h3>
                         <p className="text-sm opacity-80">Reduce audit costs up to <b>90%+</b> at scale vs manual QA.</p>
                     </div>
                 </div>

                 <div className="mt-auto border-t border-neutral-200 dark:border-white/10 pt-6">
                    <div className="flex items-center gap-4 text-sm font-mono text-neutral-500">
                        <span>CONFIDENTIAL</span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                         <span>PG. 03</span>
                    </div>
                 </div>
            </div>
        )
    },
     // PAGE 4: Comparison Table (Right)
    {
        id: 'comparison',
        type: 'content',
        content: (
            <div className="p-10 h-full flex flex-col bg-[#fdfbf7] dark:bg-neutral-900 text-neutral-900 dark:text-white">
                 <h2 className="text-xl font-bold font-serif mb-4 text-emerald-800 dark:text-emerald-400">04. Manual vs AssureQAi</h2>
                 
                 <div className="flex-1 overflow-auto">
                     <table className="w-full text-left text-xs border-collapse">
                         <thead>
                             <tr className="border-b-2 border-emerald-500/20">
                                 <th className="py-2 font-mono uppercase opacity-50">Dimension</th>
                                 <th className="py-2 font-mono uppercase opacity-50">Manual</th>
                                 <th className="py-2 font-mono uppercase text-emerald-600 dark:text-emerald-400">AssureQAi</th>
                             </tr>
                         </thead>
                         <tbody className="font-serif">
                             <tr className="border-b border-black/5 dark:border-white/5">
                                 <td className="py-3 font-bold opacity-70">Coverage</td>
                                 <td className="py-3 opacity-70">1-2% (Costly)</td>
                                 <td className="py-3 font-bold">100%</td>
                             </tr>
                             <tr className="border-b border-black/5 dark:border-white/5">
                                 <td className="py-3 font-bold opacity-70">Turnaround</td>
                                 <td className="py-3 opacity-70">Weekly</td>
                                 <td className="py-3 font-bold">Real-time</td>
                             </tr>
                             <tr className="border-b border-black/5 dark:border-white/5">
                                 <td className="py-3 font-bold opacity-70">Insights</td>
                                 <td className="py-3 opacity-70">Consolidated</td>
                                 <td className="py-3 font-bold">Parameter-level</td>
                             </tr>
                             <tr className="border-b border-black/5 dark:border-white/5">
                                 <td className="py-3 font-bold opacity-70">Scalability</td>
                                 <td className="py-3 opacity-70">Linear Hiring</td>
                                 <td className="py-3 font-bold">Elastic</td>
                             </tr>
                         </tbody>
                     </table>

                     <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded border border-emerald-100 dark:border-emerald-500/10">
                         <h4 className="font-bold text-xs uppercase mb-2 text-emerald-700 dark:text-emerald-400">Cost Savings</h4>
                         <p className="text-xs opacity-80 mb-1">10k calls: <b>60%</b> saved</p>
                         <p className="text-xs opacity-80 mb-1">50k calls: <b>76%</b> saved</p>
                         <p className="text-xs opacity-80">150k calls: <b>92%</b> saved</p>
                     </div>
                 </div>

                 <div className="mt-auto border-t border-neutral-200 dark:border-white/10 pt-6">
                    <div className="flex items-center gap-4 text-sm font-mono text-neutral-500">
                        <span>CONFIDENTIAL</span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                         <span>PG. 04</span>
                    </div>
                 </div>
            </div>
        )
    },
    // PAGE 5: Case Studies (Left)
    {
        id: 'case_studies',
        type: 'content',
        content: (
            <div className="p-10 h-full flex flex-col bg-[#fdfbf7] dark:bg-neutral-900 text-neutral-900 dark:text-white">
                 <h2 className="text-2xl font-bold font-serif mb-6 text-emerald-800 dark:text-emerald-400">05. Field Reports</h2>
                 
                 <div className="space-y-6">
                     <div className="border-l-2 border-emerald-500 pl-4">
                         <h3 className="font-bold text-sm mb-1">Collections (75K calls/mo)</h3>
                         <p className="text-sm opacity-80">Fatal error rate reduced by <b>42%</b>. Coaching closures improved 3.1×</p>
                     </div>
                     <div className="border-l-2 border-emerald-500 pl-4">
                         <h3 className="font-bold text-sm mb-1">Customer Support (100K+/mo)</h3>
                         <p className="text-sm opacity-80">GAR distribution moved from 22/38/40 to <b>51/29/20</b> in 8 weeks.</p>
                     </div>
                     <div className="border-l-2 border-emerald-500 pl-4">
                         <h3 className="font-bold text-sm mb-1">Sales Campaign</h3>
                         <p className="text-sm opacity-80">Parameter compliance up <b>27%</b>; fewer rework escalations.</p>
                     </div>
                 </div>

                 <div className="mt-8">
                     <p className="text-sm italic opacity-60">
                         "AssureQAi’s 100% audit visibility changed our governance approach—pricing is a no-brainer."
                     </p>
                     <p className="text-xs font-bold mt-2">— Head of Ops, Tier-1 BPO</p>
                 </div>

                 <div className="mt-auto border-t border-neutral-200 dark:border-white/10 pt-6">
                    <div className="flex items-center gap-4 text-sm font-mono text-neutral-500">
                        <span>CONFIDENTIAL</span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                         <span>PG. 05</span>
                    </div>
                 </div>
            </div>
        )
    },
    // PAGE 6: Pricing Slabs (Right)
    {
        id: 'pricing_slabs',
        type: 'content',
        content: (
            <div className="p-10 h-full flex flex-col bg-[#fdfbf7] dark:bg-neutral-900 text-neutral-900 dark:text-white">
                 <h2 className="text-2xl font-bold font-serif mb-6 text-emerald-800 dark:text-emerald-400">06. Investment</h2>
                 
                 <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-white/20 pb-1">
                        <span>0 - 10K calls</span>
                        <span className="font-bold">₹10 / audit</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-white/20 pb-1">
                        <span>10K - 25K calls</span>
                        <span className="font-bold">₹8 / audit</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-white/20 pb-1">
                        <span>25K - 50K calls</span>
                        <span className="font-bold text-emerald-600">₹6 / audit</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-white/20 pb-1">
                        <span>50K - 75K calls</span>
                        <span className="font-bold">₹4 / audit</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-white/20 pb-1">
                        <span>75K - 100K calls</span>
                        <span className="font-bold">₹3 / audit</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-white/20 pb-1">
                        <span>100K+ calls</span>
                        <span className="font-bold">₹2 / audit</span>
                    </div>
                 </div>

                 <div className="mt-8 bg-neutral-900 text-white p-4 rounded-sm text-center">
                     <h3 className="font-bold text-sm mb-1">Company Info</h3>
                     <p className="text-xs opacity-70 mb-2">Built by practitioners. Accuracy over assumptions.</p>
                     <div className="flex justify-center gap-4 text-xs font-mono">
                         <Link href="https://linkedin.com/company/assureqai" className="hover:text-emerald-400">LinkedIn</Link>
                         <Link href="/" className="hover:text-emerald-400">Twitter</Link>
                     </div>
                 </div>

                 <div className="mt-auto border-t border-neutral-200 dark:border-white/10 pt-6">
                    <div className="flex items-center gap-4 text-sm font-mono text-neutral-500">
                        <span>CONFIDENTIAL</span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                         <span>PG. 06</span>
                    </div>
                 </div>
            </div>
        )
    },
    // BACK_COVER (CTA)
    {
        id: 'back_cover',
        type: 'back',
        content: (
             <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900 border-4 border-neutral-800 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30 mix-blend-overlay" />
                
                <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Deploy Protocol</h2>
                
                <Link href="/book-demo" className="relative z-10 w-full max-w-xs">
                    <button className="w-full py-4 bg-emerald-500 text-black font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-xl">
                        INITIATE AUDIT
                    </button>
                </Link>

                <div className="mt-8 text-xs font-mono text-neutral-500 relative z-10">
                    <p>info@assureqai.com</p>
                    <p>www.assureqai.com</p>
                </div>

                <div className="mt-12 opacity-50 relative z-10">
                    <AssureQaiLogo showIcon={false} showLogo width={120} />
                </div>
            </div>
        )
    }
];

// --- 3D Sheet Component ---

function BookSheet({ 
    index, 
    front, 
    back, 
    flipped, 
    zIndex 
}: { 
    index: number;
    front: React.ReactNode; 
    back: React.ReactNode; 
    flipped: boolean;
    zIndex: number;
}) {
    return (
        <motion.div
            className="absolute top-0 w-full h-full"
            style={{ 
                zIndex,
                transformStyle: "preserve-3d",
                transformOrigin: "left center",
            }}
            animate={{ rotateY: flipped ? -180 : 0 }}
            transition={{ duration: 1.2, type: "spring", stiffness: 100, damping: 20, mass: 1 }} // Slower, heavier feel
        >
            {/* Front of Sheet */}
            <div 
                className="absolute inset-0 w-full h-full backface-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                {front}
                
                {/* Dynamic Lighting/Shadow Overlay */}
                <motion.div 
                    className="absolute inset-0 pointer-events-none bg-gradient-to-l from-black/0 via-black/0 to-black/20 mix-blend-multiply"
                    animate={{ opacity: flipped ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                />
                
                {/* Spine Shadow */}
                <div className="absolute left-0 top-0 w-[20px] h-full bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Back of Sheet */}
            <div 
                className="absolute inset-0 w-full h-full backface-hidden"
                style={{ 
                    backfaceVisibility: "hidden", 
                    transform: "rotateY(180deg)",
                }}
            >
                {back}
                
                 {/* Dynamic Lighting/Shadow Overlay for Back */}
                 <motion.div 
                    className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/0 via-black/0 to-black/20 mix-blend-multiply"
                    animate={{ opacity: flipped ? 0 : 1 }}
                    transition={{ duration: 0.6 }}
                />

                 {/* Spine Shadow (Back side) */}
                 <div className="absolute right-0 top-0 w-[20px] h-full bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
            </div>
        </motion.div>
    );
}


export default function BrochurePage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle Resize / Mobile Detection
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine Sheets based on View Mode
  // Mobile: 1 Page per Sheet (Stacked). Total Sheets = Total Pages.
  // Desktop: 2 Pages per Sheet (Spread). Total Sheets = Total Pages / 2.
  const totalSheets = isMobile ? BOOK_PAGES.length : Math.ceil(BOOK_PAGES.length / 2);

  const nextPage = useCallback(() => {
    if (currentPage < totalSheets) {
        setCurrentPage(p => p + 1);
    }
  }, [currentPage, totalSheets]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
        setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  // Touch Swipe Logic
  const minSwipeDistance = 50;
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Swipe Left -> Next Page
    if (isLeftSwipe) {
        nextPage();
    } 
    // Swipe Right -> Prev Page
    else if (isRightSwipe) {
        prevPage();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage]);

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="h-screen w-full bg-neutral-200 dark:bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden perspective-[2000px] relative">
        
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-100/50 via-neutral-200 to-neutral-300 dark:from-black/10 dark:via-black/40 dark:to-black/80" />

        <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center pointer-events-none">
             <div className="pointer-events-auto">
                 <Link href="/" className="flex items-center gap-2 group">
                     <div className="w-10 h-10 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-lg border border-neutral-200 dark:border-white/10 group-hover:scale-110 transition-transform">
                         <ArrowRight className="w-4 h-4 text-black dark:text-white rotate-180" />
                     </div>
                 </Link>
             </div>
             <div className="pointer-events-auto">
                <ThemeSwitcher />
             </div>
        </nav>

        {/* Book Container */}
        {/* Mobile: Width = 90vw, Height = 70vh, Centered (x:0). Spine hidden. */}
        {/* Desktop: Width = 480px, Height = 680px, Shifts (x:50%). Spine visible. */}
        <motion.div 
            className={cn(
                "relative z-10 perspective-[2000px] cursor-grab active:cursor-grabbing touch-none", // Added touch-none to prevent browser scrolling
                isMobile ? "w-[85vw] h-[65vh]" : "w-[380px] md:w-[480px] h-[540px] md:h-[680px]"
            )}
            animate={{ 
                x: isMobile 
                    ? "0%" // Mobile: Always centered
                    : (currentPage > 0 ? "50%" : "0%") // Desktop: Shift for spread
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            // Native Touch Events
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
        >
            <div 
                className="relative w-full h-full" 
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Desktop Back Cover - Hidden on Mobile */}
                {!isMobile && (
                    <motion.div 
                        className="absolute right-full top-0 w-full h-full bg-neutral-900 rounded-l-sm border-l-4 border-neutral-800 skew-y-1 transform origin-right translate-x-[2px] shadow-2xl"
                        animate={{ opacity: currentPage > 0 ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                    />
                )}

                {/* Sheets Rendering */}
                {Array.from({ length: totalSheets }).map((_, i) => {
                    let contentFront: React.ReactNode;
                    let contentBack: React.ReactNode;

                    if (isMobile) {
                        // MOBILE MAPPING: 1 Page = 1 Sheet
                        // Front = Page[i]
                        // Back = Decorative "Back of Page" texture
                        contentFront = BOOK_PAGES[i]?.content;
                        contentBack = (
                            <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center opacity-10">
                                <AssureQaiLogo width={100} showLogo showIcon={false} />
                            </div>
                        );
                    } else {
                        // DESKTOP MAPPING: 2 Pages = 1 Sheet
                        const pageIndex = i * 2;
                        contentFront = BOOK_PAGES[pageIndex]?.content;
                        contentBack = BOOK_PAGES[pageIndex + 1]?.content || <div className="bg-white h-full w-full" />;
                    }

                    const isFlipped = i < currentPage;
                    const zIndex = isFlipped ? i : totalSheets - i; 

                    return (
                        <BookSheet 
                            key={i}
                            index={i}
                            front={contentFront}
                            back={contentBack}
                            flipped={isFlipped}
                            zIndex={zIndex}
                        />
                    );
                })}

                {/* Book Spine - Desktop Only */}
                {!isMobile && (
                    <motion.div 
                        className="absolute left-0 top-0 w-10 h-full bg-neutral-800 -translate-x-full rounded-l-md shadow-[inset_-5px_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden" 
                        style={{ transform: "rotateY(-90deg) translateX(-50%)", transformOrigin: "left" }}
                        animate={{ opacity: currentPage > 0 ? 1 : 0 }}
                    >
                        <div className="rotate-90 text-[10px] font-mono text-neutral-500 tracking-[1em] whitespace-nowrap opacity-50">CONFIDENTIAL</div>
                    </motion.div>
                )}
            </div>
        </motion.div>

        {/* Navigation Controls */}
        <div className="absolute bottom-12 z-20 flex items-center gap-8 bg-white/50 dark:bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/20 dark:border-white/10 shadow-xl">
            <button 
                onClick={prevPage}
                disabled={currentPage === 0}
                className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-white/20 transition-colors"
                aria-label="Previous Page"
            >
                <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="text-xs font-mono font-bold w-20 text-center">
                SHEET {currentPage} <span className="text-neutral-400">/</span> {totalSheets}
            </div>
            <button 
                onClick={nextPage}
                disabled={currentPage === totalSheets}
                className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                 aria-label="Next Page"
            >
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>

    </div>
  );
}
