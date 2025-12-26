"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { CTASection } from "@/components/landing/CTASection";
import { cn } from "@/lib/utils";
import { 
  Check, 
  ShieldCheck, 
  TrendingUp, 
  BarChart3,
  Zap,
  Users,
  Search,
  Lock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";

// --- Components ---

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("py-20 px-6 md:px-12 max-w-7xl mx-auto", className)}>
      {children}
    </section>
  );
}

function SectionHeader({ title, subtitle, align = "center" }: { title: string; subtitle?: string; align?: "left" | "center" }) {
  return (
    <div className={cn("mb-16", align === "center" ? "text-center" : "text-left")}>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-neutral-900 dark:text-white"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

const DASHBOARD_IMAGES = [
  "/dashboard/1.png",
  "/dashboard/2.png",
  "/dashboard/3.png",
  "/dashboard/4.png",
  "/dashboard/5.png",
  "/dashboard/6.png",
];

const PRICING_SLABS = [
  { range: "0 – 10K", price: "₹10", desc: "Starter" },
  { range: "10K – 25K", price: "₹8", desc: "Growth" },
  { range: "25K – 50K", price: "₹6", desc: "Scale", recommended: true },
  { range: "50K – 75K", price: "₹4", desc: "Volume" },
  { range: "75K – 100K", price: "₹3", desc: "Enterprise" },
  { range: "100K+", price: "₹2", desc: "Partner" },
];

export default function BrochurePage() {
  const containerRef = useRef(null);
  
  return (
    <div ref={containerRef} className="bg-[#fdfbf7] dark:bg-black font-sans selection:bg-emerald-500/30">
      
      {/* Standard Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent dark:from-emerald-900/20" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-8 border border-emerald-200 dark:border-emerald-800"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Mission Briefing
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 text-neutral-900 dark:text-white"
          >
            Audit <span className="text-emerald-600 dark:text-emerald-500">100%</span> of Your Calls.
            <br />
            <span className="text-3xl md:text-5xl lg:text-6xl text-neutral-400 dark:text-neutral-600 font-medium">No More Blind Spots.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            AssureQAi delivers parameter-level defect detection, automatic TNIs, and leadership-ready dashboards at a fraction of manual QA costs.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/book-demo" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-lg shadow-xl shadow-neutral-900/10 hover:scale-105 transition-transform">
                Start Auditing
              </button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-neutral-300 dark:border-neutral-700 font-bold text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                View Pricing
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The Problem (Blind Spot) */}
      <Section className="mb-12">
        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 md:p-16 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-neutral-900 dark:text-white">The 98% Blind Spot</h2>
                <div className="space-y-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>
                    In traditional QA, only <b className="text-red-500">1–2%</b> of interactions are audited. This leaves 98% of your customer conversations in the dark.
                </p>
                <p>
                    Risks hide in the shadows: DNC violations, missed disclosures, and rude behavior often go unchecked until a escalation happens.
                </p>
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 rounded-r-xl">
                    <p className="text-emerald-900 dark:text-emerald-100 font-medium italic">
                    &quot;AssureQAi eliminates this blind spot by auditing 100% of calls with superhuman precision.&quot;
                    </p>
                </div>
                </div>
            </div>
            <div className="relative h-[400px] bg-neutral-100 dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                {/* Abstract Visualization of 1% vs 100% */}
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-1 p-4 opacity-20">
                    {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className={cn("rounded-sm", i < 3 ? "bg-red-500" : "bg-neutral-400 dark:bg-neutral-600")} />
                    ))}
                </div>
                <div className="relative z-10 text-center p-12 bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl">
                    <div className="text-7xl md:text-8xl font-bold text-emerald-600 mb-2 tracking-tighter">100%</div>
                    <div className="text-sm font-mono uppercase tracking-widest text-neutral-500">Coverage</div>
                </div>
            </div>
            </div>
        </div>
      </Section>

      {/* Platform Platform Tour (Alternating Layout) */}
      <Section id="features" className="space-y-32">
        <SectionHeader 
          title="Inside the Platform" 
          subtitle="A tour of the capabilities that make 100% coverage possible." 
        />
        
        {/* Feature 1: End-to-End Auditing */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
           <motion.div 
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="order-2 md:order-1 relative"
            >
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                  <Image src={DASHBOARD_IMAGES[0]} alt="End-to-End Auditing Dashboard" fill className="object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-800 hidden md:block">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600"><Search className="w-6 h-6" /></div>
                      <div>
                          <div className="text-2xl font-bold">100%</div>
                          <div className="text-xs text-neutral-500 uppercase">Coverage</div>
                      </div>
                  </div>
              </div>
           </motion.div>
           <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold mb-4">End-to-End Auditing</h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                  Audit 100% of calls across inbound, outbound, collections, and sales. Or configure sampling parameters to focus on high-risk interactions.
              </p>
              <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Full coverage of all call types</span>
                  </li>
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Configurable sampling logic</span>
                  </li>
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Inbound, Outbound, & Collections</span>
                  </li>
              </ul>
           </div>
        </div>

        {/* Feature 2: Defect Intelligence */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
           <div>
              <h3 className="text-3xl font-bold mb-4">Defect Intelligence</h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                  Go beyond simple scores. Tag defects parameter-wise across behavioral, process, compliance, system, and product knowledge dimensions.
              </p>
               <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Parameter-level tagging</span>
                  </li>
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Behavioral & Process insights</span>
                  </li>
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Fatal error flagging</span>
                  </li>
              </ul>
           </div>
           <motion.div 
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="relative"
            >
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                  <Image src={DASHBOARD_IMAGES[2]} alt="Defect Intelligence Dashboard" fill className="object-cover" />
              </div>
           </motion.div>
        </div>

         {/* Feature 3: TNIs & Coaching */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
           <motion.div 
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="order-2 md:order-1 relative"
            >
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                  <Image src={DASHBOARD_IMAGES[1]} alt="TNI & Coaching Dashboard" fill className="object-cover" />
              </div>
           </motion.div>
           <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold mb-4">Smart Coaching</h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                 Automatically generate Training Needs Identification (TNIs) from defect patterns. Link them directly to coaching plans and track closure.
              </p>
              <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Auto-generated TNIs</span>
                  </li>
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Coaching closure tracking</span>
                  </li>
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>L&D Module linkage</span>
                  </li>
              </ul>
           </div>
        </div>

         {/* Feature 4: Auto-Scoring & Reporting */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
           <div>
              <h3 className="text-3xl font-bold mb-4">Leadership Reporting</h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                  Real-time drilldowns from agent to site level. Export one-click Excel reports with pivots, PDF summaries, and PPT packs for MBRs.
              </p>
               <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>Real-time Drilldowns</span>
                  </li>
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>GAR (Green/Amber/Red) scoring</span>
                  </li>
                  <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span>One-click PPT/Excel exports</span>
                  </li>
              </ul>
           </div>
           <motion.div 
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="relative"
            >
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                  <Image src={DASHBOARD_IMAGES[3]} alt="Reporting Dashboard" fill className="object-cover" />
              </div>
           </motion.div>
        </div>

      </Section>

      {/* Comparison Table */}
      <Section className="p-0">
        <div className="bg-neutral-900 text-white rounded-[2.5rem] overflow-hidden p-8 md:p-20 relative">
             <div className="absolute top-0 right-0 p-32 bg-emerald-600/20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="md:flex justify-between items-end mb-16">
                <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Manual vs AssureQAi</h2>
                <p className="text-neutral-400 max-w-lg text-lg">See the difference in cost, speed, and intelligence.</p>
                </div>
                <div className="hidden md:block text-right">
                <div className="text-sm text-neutral-500 uppercase font-mono mb-1">Savings up to</div>
                <div className="text-5xl font-bold text-emerald-400 tracking-tighter">92%</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/10 text-sm font-mono text-neutral-500 uppercase">
                    <th className="py-6 px-4">Dimension</th>
                    <th className="py-6 px-4">Manual QA</th>
                    <th className="py-6 px-4 text-emerald-400">AssureQAi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-lg">
                    <tr>
                    <td className="py-6 px-4 font-medium text-neutral-300">Coverage</td>
                    <td className="py-6 px-4 text-neutral-500">1-2% (Costly)</td>
                    <td className="py-6 px-4 font-bold text-white">100% Audits</td>
                    </tr>
                    <tr>
                    <td className="py-6 px-4 font-medium text-neutral-300">Turnaround</td>
                    <td className="py-6 px-4 text-neutral-500">Daily/Weekly Batches</td>
                    <td className="py-6 px-4 font-bold text-white">Near Real-time</td>
                    </tr>
                    <tr>
                    <td className="py-6 px-4 font-medium text-neutral-300">Insights</td>
                    <td className="py-6 px-4 text-neutral-500">Manual Consolidation</td>
                    <td className="py-6 px-4 font-bold text-white">Parameter-level + Fatal Classification</td>
                    </tr>
                    <tr>
                    <td className="py-6 px-4 font-medium text-neutral-300">Scalability</td>
                    <td className="py-6 px-4 text-neutral-500">Linear (Hire more people)</td>
                    <td className="py-6 px-4 font-bold text-white">Elastic (Infinite Scale)</td>
                    </tr>
                </tbody>
                </table>
            </div>
          </div>
        </div>
      </Section>

      {/* Pricing Slabs */}
      <Section id="pricing">
         <SectionHeader 
          title="Transparent Pricing" 
          subtitle="Volume-based slabs. No hidden fees. Pay for what you audit." 
        />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PRICING_SLABS.map((slab, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-6 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[180px] transition-all duration-300",
                slab.recommended 
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/20 scale-110 z-10" 
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/30"
              )}
            >
              <div className={cn("text-xs font-mono uppercase mb-3", slab.recommended ? "text-emerald-100" : "text-neutral-500" )}>
                {slab.range} calls
              </div>
              <div className="text-4xl font-bold mb-3 tracking-tight">{slab.price}</div>
              <div className={cn("text-xs font-medium", slab.recommended ? "text-emerald-200" : "text-neutral-400")}>
                per audit
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center text-sm text-neutral-500 bg-neutral-100 dark:bg-neutral-900/50 py-4 px-8 rounded-full inline-block mx-auto">
           Enterprise commitments and multi-campaign deployments available.
        </div>
      </Section>

      {/* Case Studies / Testimonials */}
      <Section>
         <SectionHeader title="Field Reports" />
         
         <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-6 text-emerald-600">
                 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                 <span className="font-bold text-sm uppercase tracking-wide">Collections</span>
              </div>
              <p className="text-5xl font-bold mb-4 tracking-tighter">42%</p>
              <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">Reduction in fatal error rates.</p>
              <div className="h-px bg-neutral-100 dark:bg-white/5 mb-6" />
              <p className="text-xs font-mono text-neutral-500">75K calls / month</p>
            </div>

             <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-6 text-emerald-600">
                 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                 <span className="font-bold text-sm uppercase tracking-wide">Support</span>
              </div>
              <p className="text-5xl font-bold mb-4 tracking-tighter">51/29/20</p>
              <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">GAR distribution Improvement.</p>
              <div className="h-px bg-neutral-100 dark:bg-white/5 mb-6" />
              <p className="text-xs font-mono text-neutral-500">100K calls / month</p>
            </div>

             <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-6 text-emerald-600">
                 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><Zap className="w-5 h-5" /></div>
                 <span className="font-bold text-sm uppercase tracking-wide">Sales</span>
              </div>
              <p className="text-5xl font-bold mb-4 tracking-tighter">27%</p>
              <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">Increase in parameter compliance.</p>
              <div className="h-px bg-neutral-100 dark:bg-white/5 mb-6" />
              <p className="text-xs font-mono text-neutral-500">40K calls / month</p>
            </div>
         </div>
      </Section>

      {/* Standard CTA & Footer */}
      <CTASection />
      
    </div>
  );
}
