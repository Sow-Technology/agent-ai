"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { CTASection } from "@/components/landing/CTASection";
import { cn } from "@/lib/utils";
import { BrainCircuit, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";

const VALUES = [
  {
    title: "Accuracy over Assumptions",
    icon: ShieldCheck,
    desc: "We don't guess. We audit 100% of interactions to provide evidentiary truth, not sampled estimates.",
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-emerald-500/0"
  },
  {
    title: "Transparency over Black-box",
    icon: BrainCircuit,
    desc: "Our AI explains its reasoning. Every score comes with a citation, so you can trust the verdict.",
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-indigo-500/0"
  },
  {
    title: "Actionability over Vanity",
    icon: Zap,
    desc: "Data without action is noise. We focus on insights that directly improve agent performance.",
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-rose-500/0"
  }
];

export default function AboutPage() {
  return (
    <Spotlight className="min-h-screen bg-black selection:bg-primary/20">
      <Navbar />
      
      <main className="pt-32 pb-16">
        
        {/* --- Hero Section --- */}
        <section className="relative px-6 py-24 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
                     <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                     <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Our Mission</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8">
                    The Architects of <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">Automated QA.</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    We built AssureQAi because we believe random sampling is a relic of the past. 
                    In a world of infinite data, &ldquo;good enough&rdquo; coverage is no longer acceptable.
                </p>
            </motion.div>
        </section>

        {/* --- The Story / Holographic Visual --- */}
        <section className="py-24 container px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                     {/* Decorative Elements */}
                     <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-[50px] pointer-events-none" />
                     
                     <div className="relative z-10 space-y-6">
                         <h2 className="text-3xl md:text-4xl font-bold text-white">Built by Practitioners.</h2>
                         <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                             <p>
                                 The founding team spent a decade scaling support teams at high-growth startups. 
                                 We saw the same problem everywhere: QA was a bottleneck.
                             </p>
                             <p>
                                 Human auditors could only review 1-2% of calls. This meant 98% of customer interactions—and the risks buried within them—went unheard.
                             </p>
                             <p>
                                 We decided to fix it. Not by hiring more people, but by building an intelligence layer that could listen, understand, and grade every single second of conversation.
                             </p>
                         </div>
                     </div>
                </motion.div>

                <div className="relative w-full aspect-square md:aspect-[4/3] perspective-1000 group">
                    <IntelligenceStack />
                </div>
            </div>
        </section>

        {/* --- Values / Orbital Cards --- */}
        <section className="py-24 container px-4 relative">
             <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-white">Our Core Values</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                 {VALUES.map((val, i) => (
                     <ValueCard key={i} val={val} index={i} />
                 ))}
             </div>
        </section>

        {/* --- Team / Command Crew --- */}
        <section className="py-24 container px-4 relative border-t border-white/5">
             <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-white">The Command Crew</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                 {TEAM.map((member, i) => (
                     <TeamCard key={i} member={member} index={i} />
                 ))}
             </div>
        </section>

      </main>

      <CTASection />
    </Spotlight>
  );
}


const TEAM = [
    {
        name: "Ajith T.",
        role: "Founder & CEO",
        bio: "",
        image: "/team/1.jpeg",
        skills: ["Strategy", "Scale", "Systems"],
        id: "Qai0001"
    },
    {
        name: "Joel J.",
        role: "Head of Operations",
        bio: "",
        image: "/team/2.jpeg",
        skills: ["Ops", "Human-AI", "Process"],
        id: "Qai0002"
    },
    {
        name: "Kanish K.",
        role: "CTO",
        bio: "",
        image: "/team/3.jpeg",
        skills: ["LLMs", "Architecture", "RAG"],
        id: "Qai0003"
    }
];

const TeamCard = ({ member, index }: { member: typeof TEAM[0], index: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 50, damping: 10 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 10 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative h-full perspective-[1000px]"
    >
        <div className="relative h-full overflow-hidden rounded-3xl bg-white/[0.01] border border-white/5 group-hover:border-white/10 transition-all duration-500 shadow-xl"
             style={{ transform: "translateZ(20px)" }}
        >
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.1)_2px)] bg-[size:100%_4px] opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none z-10" />
            
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <Image 
                    src={member.image} 
                    alt={member.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                />
                
                {/* Tech Corners */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/30 z-20" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/30 z-20" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/30 z-20" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/30 z-20" />

                {/* ID Badge Overlay */}
                <div className="absolute top-4 left-4 z-20 flex gap-2" style={{ transform: "translateZ(30px)" }}>
                    <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-mono text-white/70">
                        ID: {member.id}
                    </div>
                </div>

                {/* Social Links Slide-Up */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30 bg-gradient-to-t from-black/90 to-transparent pt-12">
                     <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 transition-all border border-white/10">
                         {/* Placeholder Icon */}
                         <div className="w-4 h-4 bg-white/70 mask-[url(https://unpkg.com/lucide-static@latest/icons/linkedin.svg)_no-repeat_center]" /> 
                         <span className="sr-only">LinkedIn</span>
                     </button>
                     <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 transition-all border border-white/10">
                         <div className="w-4 h-4 bg-white/70 mask-[url(https://unpkg.com/lucide-static@latest/icons/twitter.svg)_no-repeat_center]" />
                         <span className="sr-only">Twitter</span>
                     </button>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-6 relative">
                 <div className="absolute -top-6 right-6 w-12 h-12 bg-[#0A0A0A] rounded-full flex items-center justify-center border border-white/10 z-20 group-hover:scale-110 transition-transform duration-300"
                      style={{ transform: "translateZ(30px)" }} 
                 >
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 </div>
                 
                 <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors" style={{ transform: "translateZ(20px)" }}>{member.name}</h3>
                 <p className="text-xs font-mono text-indigo-400 mb-4 uppercase tracking-wider" style={{ transform: "translateZ(15px)" }}>{member.role}</p>
                 <p className="text-sm text-muted-foreground leading-relaxed mb-6" style={{ transform: "translateZ(10px)" }}>
                     {member.bio}
                 </p>

                 {/* Skills Tags */}
                 <div className="flex flex-wrap gap-2" style={{ transform: "translateZ(25px)" }}>
                     {member.skills.map((skill, i) => (
                         <span key={i} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/50 group-hover:text-white/80 group-hover:border-white/20 transition-colors">
                             {skill}
                         </span>
                     ))}
                 </div>
            </div>
        </div>
    </motion.div>
    );
};

const ValueCard = ({ val, index }: { val: typeof VALUES[0], index: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 50, damping: 10 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 10 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative h-full perspective-[1000px]"
        >
            <div className="relative h-full p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden backdrop-blur-md"
                 style={{ transform: "translateZ(20px)" }}
            >
                {/* Nebula Glow Effect - Subtler */}
                <div className={cn("absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none", val.color.replace("text-", "bg-"))} />
                <div className={cn("absolute -left-20 -bottom-20 w-64 h-64 rounded-full blur-[100px] opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none", val.color.replace("text-", "bg-"))} />
                
                {/* Icon Reactor */}
                <div className={cn("relative w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-500", val.color)}
                     style={{ transform: "translateZ(30px)" }}
                >
                    <div className={cn("absolute inset-0 rounded-2xl opacity-10 blur-md transition-opacity duration-500 group-hover:opacity-30", val.color.replace("text-", "bg-"))} />
                    <val.icon className="w-7 h-7 relative z-10 drop-shadow-md" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-colors"
                    style={{ transform: "translateZ(20px)" }}
                >
                    {val.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-white/70 transition-colors"
                   style={{ transform: "translateZ(10px)" }}
                >
                    {val.desc}
                </p>

                {/* Glass Reflection - Sharper */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl mix-blend-overlay" />
            </div>
        </motion.div>
    );
};

const IntelligenceStack = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    // Default viewing angle
    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["25deg", "-5deg"]); // Tilted up slightly by default
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-25deg", "25deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative w-full h-full bg-[#080808] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center perspective-[1200px] group/container"
        >
             {/* --- HOLOGRAPHIC CHAMBER ENVIRONMENT --- */}
             
             {/* 1. Volumetric Light Beam */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
             
             {/* 2. Perimeter Grid (Walls) */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(circle_at_center,transparent_20%,black_100%)] opacity-20" />

             {/* 3. Tech Corners */}
             <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
             <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
             <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
             <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-lg" />

             {/* 4. Status Indicators */}
             <div className="absolute top-8 left-16 flex gap-2">
                 <div className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400">SYS_ONLINE</div>
                 <div className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400 animate-pulse">MONITORING</div>
             </div>


             {/* --- LAYER 1: AUDIO FOUNDATION (BACK & TOP) --- */}
             <motion.div 
                style={{ translateZ: -60, translateY: -80, rotateX: "10deg" }}
                className="absolute w-64 h-64 border border-white/5 rounded-3xl bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-colors duration-500 hover:border-indigo-500/30 group/l1"
             >
                 {/* Connection Line Down */}
                 <div className="absolute top-full left-1/2 w-[1px] h-24 bg-gradient-to-b from-indigo-500/50 to-transparent -translate-x-1/2 origin-top rotate-x-45" />

                 <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="flex gap-1 items-end h-16">
                          {[...Array(16)].map((_, i) => (
                              <motion.div 
                                key={i}
                                animate={{ height: [10, 50, 15] }}
                                transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                                className="w-2 bg-indigo-500 rounded-full"
                              />
                          ))}
                      </div>
                 </div>
                 <div className="absolute top-3 left-5 text-[10px] font-mono text-white/30 group-hover/l1:text-indigo-400 transition-colors">Input L1 // RAW_AUDIO</div>
             </motion.div>

             {/* --- LAYER 2: INTELLIGENCE ENGINE (MIDDLE) --- */}
             <motion.div 
                style={{ translateZ: 20, translateY: 0 }}
                className="absolute w-56 h-56 border border-indigo-500/30 rounded-3xl bg-indigo-950/10 backdrop-blur-md flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-10"
             >
                  {/* Orbiting Satellites */}
                  <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,1)] -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,1)] -translate-x-1/2 translate-y-1/2" />
                  </div>
                  <div className="absolute inset-0 animate-[spin_12s_linear_infinite_reverse] w-[130%] h-[130%] -left-[15%] -top-[15%] border border-dashed border-white/5 rounded-full" />

                  {/* Neural Grid */}
                  <div className="absolute inset-0 grid grid-cols-4 gap-4 p-8 opacity-50">
                      {[...Array(16)].map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                  </div>
                  {/* Central Processor */}
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] relative backdrop-blur-sm">
                       <BrainCircuit className="w-8 h-8 text-indigo-300" />
                  </div>
                  <div className="absolute bottom-3 right-5 text-[10px] font-mono text-indigo-300">Analysis L2 // NEURAL</div>
             </motion.div>

             {/* --- LAYER 3: VERIFIED ASSURANCE (FRONT & BOTTOM) --- */}
             <motion.div 
                style={{ translateZ: 100, translateY: 80, rotateX: "-10deg" }}
                className="absolute w-48 h-48 border border-emerald-500/30 rounded-3xl bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_20px_80px_rgba(0,0,0,0.8)] z-20"
             >
                  {/* Connection Line Up */}
                  <div className="absolute bottom-full left-1/2 w-[1px] h-24 bg-gradient-to-t from-emerald-500/50 to-transparent -translate-x-1/2 origin-bottom rotate-x-45" />

                  <div className="bg-emerald-500/20 p-4 rounded-full mb-3 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                       <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white tracking-widest uppercase">Verified</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-1">100% COVERAGE</div>
                  
                  <div className="absolute -inset-[1px] border border-emerald-500/20 rounded-3xl" />
                  <div className="absolute bottom-3 left-0 right-0 text-center text-[9px] font-mono text-emerald-500/50">Output L3 // AUDIT_LOG</div>
             </motion.div>
             
        </motion.div>
    );
};
