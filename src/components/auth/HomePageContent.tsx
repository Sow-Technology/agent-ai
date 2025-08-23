
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, BarChart2, Layers, UserCog, BookOpen, TrendingUp, Brain, CheckCircle2, ArrowRight, ChevronRight, FileText, Bot, Users } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const howItWorksSteps = [
  {
    icon: <FileText className="h-8 w-8" />,
    title: 'Upload Your SOPs & Calls',
    description: 'Provide your Standard Operating Procedures and call recordings. The AI learns your unique quality standards.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80',
    dataAiHint: 'document upload',
  },
  {
    icon: <Brain className="h-8 w-8" />,
    title: 'AI Audits in Seconds',
    description: 'AssureQAI transcribes, analyzes, and scores each call against your custom parameters automatically.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80',
    dataAiHint: 'data processing',
  },
  {
    icon: <BarChart2 className="h-8 w-8" />,
    title: 'Get Actionable Insights',
    description: 'Review dashboards with agent scorecards, trend analysis, and pinpointed areas for coaching.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80',
    dataAiHint: 'analytics dashboard',
  }
];

const growthStackItems = [
  {
    title: 'Define Your Quality Standards',
    description: 'Easily create custom QA campaigns and link them directly to your Standard Operating Procedures.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80',
    dataAiHint: 'quality standards',
  },
  {
    title: 'Automate Audits and Scoring',
    description: 'Let our AI handle the heavy lifting. Get consistent, unbiased scoring for 100% of your calls.',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80',
    dataAiHint: 'AI analysis',
  },
  {
    title: 'Drive Agent Performance',
    description: 'Use data-driven insights to provide targeted coaching and watch your team\'s performance soar.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80',
    dataAiHint: 'performance chart',
  }
];

const useCases = [
    {
        icon: <Layers className="h-8 w-8 text-primary" />,
        title: 'Automated QA Scoring',
        description: 'Eliminate manual scoring. Get consistent, unbiased evaluations for every single call.',
    },
    {
        icon: <TrendingUp className="h-8 w-8 text-primary" />,
        title: 'Performance Trending',
        description: 'Track agent and team performance over time to see the real impact of your coaching.',
    },
    {
        icon: <UserCog className="h-8 w-8 text-primary" />,
        title: 'Targeted Agent Coaching',
        description: 'Identify specific agent mistakes and successes with AI-powered root cause analysis.',
    },
    {
        icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
        title: 'Compliance Monitoring',
        description: 'Automatically flag calls with compliance breaches for script adherence, and more.',
    },
    {
        icon: <Users className="h-8 w-8 text-primary" />,
        title: 'Team-wide Insights',
        description: 'Understand team-level strengths and weaknesses to inform broader training initiatives.',
    },
    {
        icon: <Bot className="h-8 w-8 text-primary" />,
        title: 'Always-On Auditing',
        description: 'Audit 100% of your calls, not just a small sample, ensuring total quality coverage.',
    },
];

const faqs = [
    {
        question: "How does AssureQAI work?",
        answer: "AssureQAI uses advanced AI to analyze call recordings. You provide your quality assurance guidelines (SOPs), and our AI transcribes the calls, evaluates the agent's performance against your criteria, and provides a detailed score and analysis. This automates the manual, time-consuming process of call auditing."
    },
    {
        question: "What languages do you support?",
        answer: "Our platform supports a wide range of languages for both transcription and analysis, including English, Spanish, Hindi, and many more. This makes it ideal for global call center operations."
    },
    {
        question: "Is my data secure?",
        answer: "Yes, data security is our top priority. We employ industry-standard encryption and security protocols to ensure your call recordings and performance data are kept confidential and secure."
    },
    {
        question: "Can I customize the scoring parameters?",
        answer: "Absolutely. AssureQAI is built to adapt to your specific business needs. You can create and manage detailed QA parameter campaigns, link them to SOPs, and ensure the AI is evaluating calls based on what matters most to your organization."
    },
]

export function HomePageContent() {
  return (
    <div className="w-full h-full space-y-20 md:space-y-32 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center pt-16 pb-12 px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tighter">
          The AI Agent that Audits Calls For You
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          AssureQAI is an AI agent that listens to your support calls, evaluates them against your quality standards, and provides instant, actionable insights.
        </p>
        <div className="mt-8 flex justify-center items-center flex-wrap gap-4">
          <Link href="/login" passHref>
            <Button size="lg" className="text-lg h-12 px-8 w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login" passHref>
            <Button size="lg" variant="outline" className="text-lg h-12 px-8 w-full sm:w-auto">
                Book a demo
                <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
         <div className="mt-12 mx-auto max-w-5xl">
             <div className="overflow-hidden rounded-lg border bg-background p-1 shadow-2xl">
                  <Image
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=675&q=80"
                      alt="Dashboard Screenshot"
                      width={1200}
                      height={675}
                      className="w-full h-auto rounded-md object-cover"
                      data-ai-hint="dashboard analytics"
                  />
              </div>
          </div>
      </section>

      {/* Growth Stack Section */}
      <section className="px-4">
          <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">A Unified Platform for <span className="text-primary">Quality Assurance</span></h2>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">A flexible suite of tools that helps you go from manual auditing to automated excellence.</p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              {growthStackItems.map((item, index) => (
                  <div key={item.title} className="text-left flex flex-col items-start p-6 border rounded-lg bg-card/50 shadow-lg">
                      <div className="mb-6 w-full">
                          <Image
                              src={item.image}
                              alt={item.title}
                              width={600}
                              height={400}
                              className="w-full h-auto rounded-md object-cover border"
                              data-ai-hint={item.dataAiHint}
                          />
                      </div>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground mt-2 flex-grow">{item.description}</p>
                  </div>
              ))}
          </div>
      </section>

       {/* How It Works Section */}
      <section className="px-4">
         <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
             <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">In just three simple steps, you can automate your entire call quality assurance process.</p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={step.title} className="text-center flex flex-col items-center p-6 border rounded-lg bg-card/50">
                 <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                    {step.icon}
                 </div>
                 <h3 className="text-xl font-semibold">{step.title}</h3>
                 <p className="text-muted-foreground mt-2 flex-grow">{step.description}</p>
                 <div className="mt-6 w-full">
                    <Image
                        src={step.image}
                        alt={step.title}
                        width={600}
                        height={400}
                        className="w-full h-auto rounded-md object-cover border shadow-md"
                        data-ai-hint={step.dataAiHint}
                    />
                 </div>
              </div>
            ))}
          </div>
      </section>

      {/* Use Cases Section */}
      <section className="px-4">
          <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One agent, multiple use cases</h2>
             <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">From individual performance tracking to team-wide compliance monitoring.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="p-6 rounded-lg border bg-card/50">
                <div className="mb-4">
                    {useCase.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground">{useCase.description}</p>
              </div>
            ))}
          </div>
      </section>
      
      {/* Testimonial Section */}
      <section className="bg-muted py-20 px-4">
         <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-semibold mb-4">"AssureQAI has transformed our QA process. We're now auditing 100% of our calls with more accuracy than ever before, and our agent coaching is far more effective."</h3>
            <div className="flex items-center justify-center gap-4 mt-6">
                <Avatar>
                    <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80" alt="Testimonial avatar" data-ai-hint="smiling person" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">Jane Doe</p>
                    <p className="text-muted-foreground">Head of Quality, Acme Inc.</p>
                </div>
            </div>
         </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg font-medium text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base">
                        {faq.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary/10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to get started?</h2>
             <p className="text-lg text-muted-foreground mt-2 mb-8">Automate your call audits and unlock performance insights today.</p>
             <Link href="/login" passHref>
                <Button size="lg" className="text-lg h-12 px-8 w-full sm:w-auto">
                    Try AssureQAI Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>
        </div>
      </section>

      <footer className="border-t">
          <div className="max-w-7xl mx-auto py-8 px-4 text-center text-sm text-muted-foreground">
             <p>&copy; {new Date().getFullYear()} AssureQAI. All Rights Reserved.</p>
          </div>
      </footer>

    </div>
  );
}
