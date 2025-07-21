'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, BarChart2, Layers, UserCog, BookOpen, TrendingUp, Brain, CheckCircle2, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Call Audits',
    description: 'Auto-transcribe, translate, and score calls against your custom parameters, eliminating manual errors.',
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-primary" />,
    title: 'Smart QA Dashboard',
    description: 'Get a live QA performance overview with agent-wise metrics, leaderboards, and issue trend alerts.',
  },
  {
    icon: <Layers className="h-8 w-8 text-primary" />,
    title: 'Bulk Call Processing',
    description: 'Save time for large teams by batch uploading and auditing multiple calls with parallel processing.',
  },
  {
    icon: <UserCog className="h-8 w-8 text-primary" />,
    title: 'User & Role Management',
    description: 'Create custom user roles with granular, role-based access controls and easily assign QA campaigns.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'SOP & Template Management',
    description: 'Upload and link Standard Operating Procedures directly to campaigns to monitor compliance effectively.',
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    title: 'Advanced Analytics',
    description: 'Drill-down on any metric, perform root cause identification, and export comprehensive reports (CSV, PDF).',
  },
  {
    icon: <Brain className="h-8 w-8 text-primary" />,
    title: 'Actionable Insights',
    description: 'Receive AI-generated suggestions for improvement, see issue clustering, and maintain compliance tracking.',
  }
];

const benefits = [
    { text: "Reduce QA time by up to 60%" },
    { text: "Improve audit accuracy and consistency" },
    { text: "Scalable for small teams to enterprises" },
];

export function HomePageContent() {
  return (
    <div className="w-full h-full space-y-20 md:space-y-28">
      {/* Hero Section */}
      <section className="text-center pt-12 pb-8">
        <h1 className="text-4xl md:text-6xl font-semibold text-foreground mb-4 tracking-tight">
          Revolutionize Your Call Quality Audits with AI
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Automatically transcribe, evaluate, and analyze your calls with generative AI — faster, smarter, and error-free.
        </p>
        <div className="mt-8 flex justify-center items-center gap-4">
          <Link href="/login" passHref>
            <Button size="lg" className="text-lg h-12 px-8 w-full sm:w-auto">
                Try AssureQAI
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="mt-12 mx-auto max-w-5xl">
           <div className="overflow-hidden rounded-lg border bg-background p-1 shadow-2xl">
                <Image
                    src="https://placehold.co/1200x675.png"
                    alt="Dashboard Screenshot"
                    width={1200}
                    height={675}
                    className="w-full h-auto rounded-md object-cover"
                    data-ai-hint="dashboard analytics"
                />
            </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section>
          <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-semibold">Everything you need for Quality Assurance</h2>
             <p className="text-lg text-muted-foreground mt-2">A comprehensive suite of tools powered by AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-start">
                <div className="p-3 bg-primary/10 rounded-lg">
                    {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
      </section>

      {/* Why Choose Us / Benefits Section */}
      <section className="bg-muted py-16 rounded-lg">
        <div className="max-w-4xl mx-auto text-center px-4">
             <h2 className="text-3xl md:text-4xl font-semibold">Why Choose AssureQAI?</h2>
             <p className="text-lg text-muted-foreground mt-2 mb-8">Unlock unparalleled efficiency and accuracy in your QA process.</p>
             <div className="flex flex-col md:flex-row justify-center gap-8">
                {benefits.map(benefit => (
                    <div key={benefit.text} className="flex items-center gap-3 text-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0"/>
                        <span>{benefit.text}</span>
                    </div>
                ))}
             </div>
        </div>
      </section>

      {/* Live Demo or Dashboard Preview Section */}
      <section>
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold">See AssureQAI in Action</h2>
            <p className="text-lg text-muted-foreground mt-2">Watch a live demo of our dashboard and its powerful features.</p>
        </div>
        <div className="overflow-hidden rounded-lg border bg-background p-1 shadow-2xl">
            <Image
                src="https://placehold.co/1200x675.png"
                alt="Live Demo Preview"
                width={1200}
                height={675}
                className="w-full h-auto rounded-md object-cover"
                data-ai-hint="dashboard video"
            />
        </div>
      </section>
      
      {/* Client Testimonials Section */}
      <section className="text-center">
        <h2 className="text-3xl md:text-4xl font-semibold">Trusted by Leading Companies</h2>
        <p className="text-lg text-muted-foreground mt-2 mb-8">Coming Soon: Hear from our satisfied customers.</p>
        {/* Placeholder for logos and testimonials */}
        <div className="h-40 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Logos and testimonials will be displayed here.</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="text-center">
        <h2 className="text-3xl md:text-4xl font-semibold">Flexible Plans for Teams of All Sizes</h2>
        <p className="text-lg text-muted-foreground mt-2 mb-8">Coming Soon: A look at our pricing tiers.</p>
        {/* Placeholder for pricing cards */}
        <div className="h-60 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Free Trial, Pro, and Enterprise plan details will be here.</p>
        </div>
      </section>

    </div>
  );
}
