"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
  BarChart2,
  Layers,
  UserCog,
  BookOpen,
  TrendingUp,
  Brain,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  FileText,
  Bot,
  Users,
  Shield,
  Cpu,
  Gauge,
  UploadCloud,
  FileScan,
  PenSquare,
  ShieldCheck,
  UsersRound,
  ListChecks,
  Briefcase,
  Star,
  Twitter,
  Linkedin,
  Facebook,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AssureQaiLogo } from "@/components/common/SakshiQaiLogo";
import { cn } from "@/lib/utils";
import { useEffect, useRef, type MouseEvent } from "react";

const comparisonData = [
  { metric: "Cost per audit", manual: "₹25", assureqai: "₹2" },
  {
    metric: "Audits per day (per resource)",
    manual: "up to 1,000 (human constraint)",
    assureqai: "thousands / hour (automated)",
  },
  {
    metric: "Consistency",
    manual: "Variable",
    assureqai: "Consistent, repeatable",
  },
  { metric: "Time to insights", manual: "Days", assureqai: "Minutes" },
  { metric: "Scalability", manual: "Expensive", assureqai: "Cheap, elastic" },
];

const faqs = [
  {
    question: "Is the ₹2 price guaranteed?",
    answer:
      "₹2 is our standard AI-assisted audit price for baseline models and volumes shown. Final pricing may vary with custom requirements, very small volumes, or additional human review packages.",
  },
  {
    question: "How accurate is AI vs human QA?",
    answer:
      "The AI handles routine checks and scoring consistently; edge cases and complex judgement calls are routed for human review. We track precision/recall and provide explainability for each audit so you can calibrate confidence levels.",
  },
  {
    question: "What about data security?",
    answer:
      "We support encrypted storage, role-based access, and enterprise compliance controls. Keep sensitive audio on-prem if required — we support hybrid deployments.",
  },
  {
    question: "Can I keep my existing QA team?",
    answer:
      "Yes — most clients keep a small human QA team for calibration, exception review, and continuous improvement while AI handles the bulk.",
  },
];

const useCases = [
  {
    icon: Layers,
    title: "Automated QA Scoring",
    description:
      "Eliminate manual scoring. Get consistent, unbiased evaluations for every single call.",
  },
  {
    icon: TrendingUp,
    title: "Performance Trending",
    description:
      "Track agent and team performance over time to see the real impact of your coaching.",
  },
  {
    icon: UserCog,
    title: "Targeted Agent Coaching",
    description:
      "Identify specific agent mistakes and successes with AI-powered root cause analysis.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Monitoring",
    description:
      "Automatically flag calls with compliance breaches for script adherence, and more.",
  },
];

const moreFeatures = [
  {
    icon: BookOpen,
    title: "SOP Management",
    description:
      "Create, manage, and version control your Standard Operating Procedures directly within the platform.",
  },
  {
    icon: ListChecks,
    title: "Parameter Campaign Management",
    description:
      "Design and deploy detailed QA campaigns with hierarchical, weighted parameters for targeted audits.",
  },
  {
    icon: UsersRound,
    title: "Bulk QA Audits",
    description:
      "Upload and process thousands of call recordings in a single batch for large-scale analysis.",
  },
  {
    icon: Briefcase,
    title: "User & Role Management",
    description:
      "Control access and permissions with a flexible user and role management system for Agents, QA Analysts, and Managers.",
  },
];

const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Head of Quality, TechNova Solutions",
    avatar: "https://picsum.photos/seed/testimonial1/100/100",
    initials: "AS",
    rating: 5,
    quote:
      "AssureQAI has completely transformed our QA process. We're now auditing 100% of our calls with more accuracy than ever before, and our agent coaching is far more effective. It's an indispensable tool.",
  },
  {
    name: "Priya Singh",
    role: "Operations Manager, Global Connect BPO",
    avatar: "https://picsum.photos/seed/testimonial2/100/100",
    initials: "PS",
    rating: 5,
    quote:
      "The cost savings are undeniable, but the real value is in the consistency and speed of insights. We can identify and address customer service issues in hours, not weeks. Our CSAT scores have improved by 15%.",
  },
  {
    name: "Rohan Mehta",
    role: "Director of Customer Support, Innovate Fintech",
    avatar: "https://picsum.photos/seed/testimonial3/100/100",
    initials: "RM",
    rating: 5,
    quote:
      "Our team loves the platform. The dashboard is intuitive, and the AI-generated comments make providing feedback to agents incredibly efficient. It's a game-changer for maintaining high standards.",
  },
  {
    name: "Anika Gupta",
    role: "Compliance Officer, SecureBank",
    avatar: "https://picsum.photos/seed/testimonial4/100/100",
    initials: "AG",
    rating: 5,
    quote:
      "For regulatory compliance, AssureQAI is unmatched. It automatically flags every deviation from our scripts, giving us a complete audit trail and peace of mind. Manual checks would never catch this much.",
  },
];

const logos = [
  { name: "Company A", hint: "company logo" },
  { name: "Enterprise Co", hint: "company logo" },
  { name: "Startup Inc", hint: "company logo" },
  { name: "Your Next Client", hint: "company logo" },
  { name: "Business LLC", hint: "company logo" },
  { name: "Innovate Corp", hint: "company logo" },
  { name: "Global Solutions", hint: "company logo" },
];

const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-2xl",
      className
    )}
  >
    {children}
  </div>
);

const BentoCard = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top, width, height } =
      cardRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    cardRef.current.style.setProperty("--mouse-x", `${x * 100}%`);
    cardRef.current.style.setProperty("--mouse-y", `${y * 100}%`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      className={cn(
        "group relative p-6 flex flex-col items-start gap-4 transition-all duration-300 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-lg hover:shadow-primary/20",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-radial from-primary/10 via-transparent to-transparent before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100",
        className
      )}
      style={{ "--mouse-x": "50%", "--mouse-y": "50%" } as React.CSSProperties}
      {...props}
    >
      <div className="relative z-10 w-full h-full flex flex-col items-start gap-4">
        {children}
      </div>
    </div>
  );
};

export function HomePageContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top } = containerRef.current.getBoundingClientRect();
      containerRef.current.style.setProperty(
        "--cursor-x",
        `${e.clientX - left}px`
      );
      containerRef.current.style.setProperty(
        "--cursor-y",
        `${e.clientY - top}px`
      );
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full space-y-20 md:space-y-32 animate-fade-in overflow-x-hidden aurora-background follow-cursor-glow"
    >
      {/* 1. Hero Section */}
      <section className="pt-16 pb-12 px-4 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center z-10 relative">
          <div
            className="text-left animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter animate-text-gradient">
              Audit each agent call for just ₹2.
            </h1>
            <p className="text-lg md:text-xl text-gray-300/80 max-w-2xl">
              Save up to 92% vs manual auditing. Fast, consistent, and scalable
              call audits powered by AssureQAI.
            </p>
            <div className="mt-8 flex items-center flex-wrap gap-4">
              <Link href="/login" passHref>
                <Button
                  size="lg"
                  className="text-lg h-12 px-8 w-full sm:w-auto shadow-lg bg-primary/80 hover:bg-primary text-primary-foreground transition-all hover:scale-105 border border-primary/50 cta-pulse"
                >
                  Start 7-day trial — ₹0 setup
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact" passHref>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg h-12 px-8 w-full sm:w-auto transition-all hover:scale-105 bg-white/5 hover:bg-white/10 text-white border-white/20"
                >
                  Book a demo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          <div
            className="w-full animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <GlassCard className="p-1.5 transform transition-transform hover:scale-105 duration-500">
              <Image
                src="/dashboard.png"
                alt="Dashboard Screenshot"
                width={1200}
                height={675}
                className="w-full h-auto rounded-lg object-cover"
                data-ai-hint="dashboard analytics"
                priority
              />
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 2. Companies Section (Social Proof) */}
      <section
        className="py-8 animate-fade-in-up"
        style={{ animationDelay: "0.6s" }}
      >
        <div className="max-w-7xl mx-auto text-center z-10 relative">
          <p className="text-center text-sm font-semibold text-gray-400/80 tracking-wider uppercase mb-8">
            Trusted by leading companies
          </p>
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
            <div className="flex w-max animate-marquee">
              {[...logos, ...logos].map((logo, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-48 flex flex-col items-center justify-center gap-2"
                >
                  <div className="h-12 w-12 bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg flex items-center justify-center border border-primary/30 hover:border-primary/60 transition-colors">
                    <span className="text-2xl font-bold text-primary">🔷</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-300/60 uppercase tracking-wide">
                    Logo
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Problem/Agitation Section */}
      <section
        className="px-4 animate-fade-in-up z-10 relative"
        style={{ animationDelay: "0.8s" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-text-gradient">
            Manual QA is slow, inconsistent, and doesn&apos;t scale.
          </h2>
          <p className="text-lg text-gray-300/80 mt-4">
            Traditional auditing costs around ₹25 per interaction, relies on
            tiny sample sizes, and delivers insights days later. This leaves you
            blind to widespread issues and unable to coach agents effectively.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="p-6 transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-red-400">
                  <Sparkles /> High Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-300/70">
                  Expensive manual labor for every single audit.
                </p>
              </CardContent>
            </GlassCard>
            <GlassCard className="p-6 transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-red-400">
                  <Gauge /> Slow Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-300/70">
                  Takes days to get feedback, making real-time coaching
                  impossible.
                </p>
              </CardContent>
            </GlassCard>
            <GlassCard className="p-6 transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-red-400">
                  <CheckCircle2 /> Inconsistent
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-300/70">
                  Subjective scoring varies between auditors and over time.
                </p>
              </CardContent>
            </GlassCard>
            <GlassCard className="p-6 transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-red-400">
                  <Cpu /> Unscalable
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-300/70">
                  Impossible to audit 100% of calls without a massive team.
                </p>
              </CardContent>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 4. Solution Section */}
      <section
        className="px-4 py-20 z-10 relative animate-fade-in-up"
        style={{ animationDelay: "1s" }}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-text-gradient">
              The Solution: AI-Assisted Audits at Scale
            </h2>
            <p className="text-lg text-gray-300/80 mt-4">
              AssureQAI combines speech analysis and powerful AI to
              automatically evaluate 100% of your calls against your QA
              parameters. It reduces cost and time dramatically while boosting
              consistency and providing instant insights.
            </p>
            <p className="text-lg text-gray-300/80 mt-4">
              This frees your human QA team to focus on high-value tasks like
              coaching and handling complex edge cases, not tedious manual
              scoring.
            </p>
          </div>
          <GlassCard className="transform transition-transform hover:scale-105">
            <CardHeader>
              <CardTitle className="text-white">
                The AssureQAI Difference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-300">Metric</TableHead>
                    <TableHead className="text-primary font-bold">
                      AssureQAI
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-white/10">
                    <TableCell className="font-medium text-gray-200">
                      Cost per audit
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      ₹2
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-white/10">
                    <TableCell className="font-medium text-gray-200">
                      Consistency
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      Consistent, repeatable
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-white/10">
                    <TableCell className="font-medium text-gray-200">
                      Time to insights
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      Minutes
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-white/10">
                    <TableCell className="font-medium text-gray-200">
                      Scalability
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      Cheap, elastic
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </GlassCard>
        </div>
      </section>

      {/* 5. Features/Benefits Section (Bento Grid) */}
      <section
        className="px-4 animate-fade-in-up z-10 relative"
        style={{ animationDelay: "1.2s" }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-text-gradient">
            Everything You Need for Modern QA
          </h2>
          <p className="text-lg text-gray-300/80 mt-2 max-w-2xl mx-auto">
            A complete toolkit for quality assurance and performance management.
          </p>
        </div>

        {/* Professional Bento Grid: 2.5-1.5 (hero) + 4 (medium) + 1.5-2.5 (hero) layout */}
        <div className="max-w-7xl mx-auto flex flex-col gap-6 auto-rows-max">
          {/* Row 1: 2.5x and 1.5x */}
          <div className="flex gap-6">
            <div style={{ flex: "2.5" }}>
              <BentoCard className="h-full">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 w-fit">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-semibold text-white">
                    {useCases[0]?.title}
                  </h3>
                  <p className="text-sm text-gray-300/70 mt-1">
                    {useCases[0]?.description}
                  </p>
                </div>
              </BentoCard>
            </div>
            <div style={{ flex: "1.5" }}>
              <BentoCard className="h-full">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 w-fit">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-semibold text-white">
                    {useCases[1]?.title}
                  </h3>
                  <p className="text-sm text-gray-300/70 mt-1">
                    {useCases[1]?.description}
                  </p>
                </div>
              </BentoCard>
            </div>
          </div>

          {/* Row 2: 4 equal cards */}
          <div className="grid grid-cols-4 gap-6">
            {useCases.slice(2).map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <BentoCard key={idx + 2} className="h-full">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 w-fit">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-300/70 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </BentoCard>
              );
            })}
            {moreFeatures.slice(0, 2).map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <BentoCard key={idx + 6} className="h-full">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 w-fit">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-300/70 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </BentoCard>
              );
            })}
          </div>

          {/* Row 3: 1.5x and 2.5x (reversed) */}
          <div className="flex gap-6">
            <div style={{ flex: "1.5" }}>
              <BentoCard className="h-full">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 w-fit">
                  <UsersRound className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-semibold text-white">
                    {moreFeatures[2]?.title}
                  </h3>
                  <p className="text-sm text-gray-300/70 mt-1">
                    {moreFeatures[2]?.description}
                  </p>
                </div>
              </BentoCard>
            </div>
            <div style={{ flex: "2.5" }}>
              <BentoCard className="h-full">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 w-fit">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-semibold text-white">
                    {moreFeatures[3]?.title}
                  </h3>
                  <p className="text-sm text-gray-300/70 mt-1">
                    {moreFeatures[3]?.description}
                  </p>
                </div>
              </BentoCard>
            </div>
          </div>
        </div>
      </section>

      {/* 6. How It Works Section */}
      <section
        className="px-4 animate-fade-in-up z-10 relative"
        style={{ animationDelay: "1.4s" }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-text-gradient">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-lg text-gray-300/80 mt-2 max-w-2xl mx-auto">
            Our workflow is designed to be powerful yet effortless.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-4">
            <div className="relative p-4 bg-primary/10 rounded-full mb-4 border border-primary/20">
              <UploadCloud className="relative h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              1. Upload Calls
            </h3>
            <p className="text-gray-300/70">
              Connect your call center software or bulk upload recordings for
              automated processing.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="relative p-4 bg-primary/10 rounded-full mb-4 border border-primary/20">
              <FileScan className="relative h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              2. AI Analyzes & Scores
            </h3>
            <p className="text-gray-300/70">
              AssureQAI transcribes, scores, and surfaces key insights against
              your QA parameters.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="relative p-4 bg-primary/10 rounded-full mb-4 border border-primary/20">
              <PenSquare className="relative h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              3. Review & Coach
            </h3>
            <p className="text-gray-300/70">
              Use the dashboard and AI chatbot to review results and provide
              targeted feedback to agents.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Testimonial Section */}
      <section
        className="py-20 px-4 animate-fade-in-up z-10 relative"
        style={{ animationDelay: "1.6s" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-text-gradient">
              What Our Customers Are Saying
            </h2>
            <p className="text-lg text-gray-300/80 mt-2">
              Real testimonials from teams who transformed their QA process.
            </p>
          </div>
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
            <div
              className="flex w-max animate-marquee"
              style={{ animationDuration: "60s" }}
            >
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div key={index} className="flex-shrink-0 w-[380px] mx-4">
                  <GlassCard className="flex flex-col h-full">
                    <CardContent className="pt-6 flex-1 flex flex-col">
                      <div className="flex mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < testimonial.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-300/80 italic mb-4 flex-grow">
                        &quot;{testimonial.quote}&quot;
                      </p>
                      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                        <Avatar>
                          <AvatarImage
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            data-ai-hint="person portrait"
                          />
                          <AvatarFallback>
                            {testimonial.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Objection Handling (FAQ) Section */}
      <section
        className="max-w-3xl mx-auto px-4 animate-fade-in-up z-10 relative"
        style={{ animationDelay: "1.8s" }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-text-gradient">
            Frequently Asked Questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              value={`item-${index}`}
              key={index}
              className="border-b-white/10"
            >
              <AccordionTrigger className="text-lg font-medium text-left text-white hover:text-primary transition-colors hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-300/80 text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 9. Final CTA Section */}
      <section
        className="py-20 px-4 text-white animate-fade-in-up z-10 relative"
        style={{ animationDelay: "2s" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 blur-2xl opacity-30"></div>
            <div className="relative p-8 border border-primary/20 rounded-2xl bg-black/30">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight animate-text-gradient">
                From ₹25 → ₹2 per audit.
              </h2>
              <p className="text-lg text-gray-300/70 mt-2 mb-8">
                Audit 10× more calls for 1/10th the cost. See your ROI in 24
                hours.
              </p>
              <Link href="/login" passHref>
                <Button
                  size="lg"
                  className="text-lg h-12 px-8 w-full sm:w-auto shadow-2xl bg-primary/80 hover:bg-primary text-primary-foreground transition-transform hover:scale-105 border border-primary/50 cta-pulse"
                >
                  Calculate my savings
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="z-10 relative">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 128 40"
                aria-label="Joaji Logo"
                className="h-10 text-primary"
              >
                <g className="logo-text-group transition-opacity duration-200 group-data-[state=collapsed]/peer:opacity-0">
                  <text
                    x="0"
                    y="20"
                    fontFamily="Calibri, sans-serif"
                    fontSize="22"
                    fontWeight="600"
                    fill="currentColor"
                    dominantBaseline="middle"
                  >
                    Joaji
                  </text>
                </g>
              </svg>
              <p className="text-gray-400/80 text-base">
                Product by Joaji Innovation
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400/80 hover:text-primary">
                  <span className="sr-only">Facebook</span>
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400/80 hover:text-primary">
                  <span className="sr-only">LinkedIn</span>
                  <Linkedin className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400/80 hover:text-primary">
                  <span className="sr-only">Twitter</span>
                  <Twitter className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                    Product
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <Link
                        href="/dashboard/billing"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Features
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Integrations
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                    Company
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <Link
                        href="/about"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        About
                      </Link>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Careers
                      </a>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Contact Us
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                    Resources
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Blog
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Case Studies
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                    Legal
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Privacy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-400/80 hover:text-primary"
                      >
                        Terms
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-8">
            <p className="text-base text-gray-400/80 text-center">
              &copy; 2025 Joaji Innovation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
