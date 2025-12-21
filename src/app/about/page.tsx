"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AssureQaiLogo } from "@/components/common/AssureQaiLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ArrowLeft, Building, Rocket, Users } from "lucide-react";
import { useLocationPricing } from "@/hooks/useLocationPricing";

const leadershipTeam = [
  {
    name: "Ajith T",
    role: "Chief Executive Officer (CEO)",
    description:
      "A visionary entrepreneur with a deep understanding of technology, business strategy, and product innovation. Ajith founded AssureQAI with a mission to revolutionize the way organizations manage Quality Assurance using AI. His forward-thinking leadership and customer-first mindset continue to drive the company’s growth and purpose.",
    avatar: "https://picsum.photos/seed/ajith/100/100",
    initials: "AT",
  },
  {
    name: "Joel J.",
    role: "Chief Operating Officer (COO)",
    description:
      "The operational backbone of AssureQAI, Joel ensures seamless alignment between teams, processes, and performance. With a strong background in operations and project delivery, he focuses on optimizing workflows, fostering collaboration, and ensuring every client engagement delivers measurable success.",
    avatar: "https://picsum.photos/seed/joel/100/100",
    initials: "JJ",
  },
  {
    name: "Kanish K.",
    role: "Chief Technology Officer (CTO)",
    description:
      "Leading the technology vision, Kanish oversees the research, development, and implementation of cutting-edge AI frameworks within the platform. His expertise in data science, automation, and scalable architecture ensures AssureQAI remains at the forefront of QA innovation.",
    avatar: "https://picsum.photos/seed/kanish/100/100",
    initials: "KK",
  },
];

const missionPoints = [
  "Eliminate manual bottlenecks in QA.",
  "Detect issues earlier, with fewer false-positives or blind spots.",
  "Provide actionable insights, not just reports.",
  "Make quality assurance an enabler of innovation instead of a blocker.",
];

export default function AboutPage() {
  const { pricing } = useLocationPricing();
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-6">
          <Link href="/" passHref>
            <AssureQaiLogo className="h-8 w-auto" />
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 animate-fade-in">
        {/* Hero */}
        <section className="relative py-24 px-4 text-center text-foreground">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-purple-700 to-indigo-800 opacity-90"></div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Built for QA teams that need scale, accuracy and speed
            </h1>
            <p className="mt-4 text-lg md:text-xl text-primary-foreground/95 max-w-2xl mx-auto">
              AssureQAI brings AI-powered auditing to every interaction so you
              can measure, coach and improve at enterprise scale. Faster
              insights, predictable outcomes.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/pricing" passHref>
                <Button className="bg-primary">
                  See Pricing — {pricing.currencySymbol}
                  {pricing.aiAuditPrice} / call
                </Button>
              </Link>
              <Link href="/contact" passHref>
                <Button variant="outline">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Who we are */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold">Who We Are</h2>
              <p className="mt-4 text-muted-foreground text-lg">
                A small team of engineers, QA specialists and data scientists
                building practical AI tools that reduce manual work and surface
                explainable, actionable insights. We ship fast, iterate with
                customers, and measure everything.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white/3 rounded-lg">
                <h3 className="text-lg font-semibold">100% Coverage</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Audit every call — not a sample.
                </p>
              </div>
              <div className="p-4 bg-white/3 rounded-lg">
                <h3 className="text-lg font-semibold">Faster Insights</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Minutes instead of days for coaching-ready data.
                </p>
              </div>
              <div className="p-4 bg-white/3 rounded-lg">
                <h3 className="text-lg font-semibold">Enterprise Ready</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Secure, auditable, and integrable with your stack.
                </p>
              </div>
              <div className="p-4 bg-white/3 rounded-lg">
                <h3 className="text-lg font-semibold">Explainable</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Transparent scoring and human-friendly explanations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent border-l-4 border-primary">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Our Mission</h2>
            <ul className="space-y-4">
              {missionPoints.map((point, i) => (
                <li key={i} className="flex items-start">
                  <Check className="h-6 w-6 text-primary mr-4 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-lg">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Our Core Values
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="p-8 rounded-lg text-center bg-white/3 border border-white/20 hover:border-primary/50 hover:bg-white/5 transition">
                <div className="text-5xl mb-4">👥</div>
                <h4 className="text-xl font-semibold mb-3">Customer-First</h4>
                <p className="text-sm text-muted-foreground">
                  We prioritize outcomes that matter to operators and customers.
                  Every decision driven by real use cases.
                </p>
              </div>
              <div className="p-8 rounded-lg text-center bg-white/3 border border-white/20 hover:border-primary/50 hover:bg-white/5 transition">
                <div className="text-5xl mb-4">⚡</div>
                <h4 className="text-xl font-semibold mb-3">Pragmatic AI</h4>
                <p className="text-sm text-muted-foreground">
                  Solve real problems with transparent, reliable models.
                  Explainability over black boxes.
                </p>
              </div>
              <div className="p-8 rounded-lg text-center bg-white/3 border border-white/20 hover:border-primary/50 hover:bg-white/5 transition">
                <div className="text-5xl mb-4">🤝</div>
                <h4 className="text-xl font-semibold mb-3">Collaborative</h4>
                <p className="text-sm text-muted-foreground">
                  We build with partners, not for them. Constant feedback loops
                  and iterative improvement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">
              Meet Our Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {leadershipTeam.map((leader) => (
                <Card
                  key={leader.name}
                  className="shadow-lg hover:shadow-2xl transition-shadow bg-white/3 border-white/10"
                >
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="h-24 w-24 mb-4 border-2 border-primary/30">
                        <AvatarImage src={leader.avatar} alt={leader.name} />
                        <AvatarFallback className="text-xl">
                          {leader.initials}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-semibold">{leader.name}</h3>
                      <p className="text-sm text-primary font-medium">
                        {leader.role}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {leader.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold">Ready to try AssureQAI?</h3>
            <p className="text-muted-foreground mt-2">
              Start a free trial or talk to sales to see how we can help your
              team.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link href="/pricing" passHref>
                <Button className="bg-primary">Start Free Trial</Button>
              </Link>
              <Link href="/contact" passHref>
                <Button variant="outline">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} AssureQAI. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
