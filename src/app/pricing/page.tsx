"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Users,
} from "lucide-react";

const pricingTier = {
  name: "AssureQAI",
  description: "Simple, Transparent, Pay-Per-Call Pricing",
  price: "₹2",
  period: "per call",
  features: [
    "AI-Assisted Audits",
    "100% Call Coverage",
    "Real-time Scoring",
    "Advanced Dashboard",
    "Unlimited Calls",
    "Priority Support",
    "Custom Parameters",
    "Team Collaboration",
    "Compliance Reports",
    "API Access",
    "Custom Integrations",
    "24/7 Monitoring",
  ],
};

const comparisonData = [
  { metric: "Cost per call (AI)", manual: "₹0.2", assureqai: "₹2" },
  {
    metric: "Calls per month",
    manual: "Manual Audit",
    assureqai: "Unlimited",
  },
  {
    metric: "Consistency",
    manual: "Variable (Human dependent)",
    assureqai: "100% Consistent",
  },
  { metric: "Time to insights", manual: "Days", assureqai: "Minutes" },
  {
    metric: "Scalability",
    manual: "Limited by team size",
    assureqai: "Infinitely scalable",
  },
  { metric: "24/7 Monitoring", manual: "No", assureqai: "Yes" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      {/* Header */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-300/80 mb-8">
            Audit 100% of your calls for just ₹2 per call. No hidden fees. No
            setup costs.
          </p>

          {/* Pricing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-full p-1 mb-12">
            <button className="px-6 py-2 rounded-full text-white bg-primary/20 border border-primary/50 font-semibold">
              Pay Per Call
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-2xl mx-auto mb-20">
          <Card className="relative flex flex-col transition-all duration-300 hover:shadow-2xl border-primary/50 bg-gradient-to-br from-primary/10 via-slate-900 to-slate-900 shadow-2xl shadow-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl text-white text-center">
                {pricingTier.name}
              </CardTitle>
              <CardDescription className="text-gray-300/70 text-center text-base">
                {pricingTier.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-grow">
              <div className="mb-8 text-center">
                <span className="text-6xl font-bold text-white">
                  {pricingTier.price}
                </span>
                <span className="text-gray-300/70 ml-2 text-lg">
                  {pricingTier.period}
                </span>
              </div>

              <Button className="w-full mb-8 bg-primary hover:bg-primary/90 text-white">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="space-y-3">
                {pricingTier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            AssureQAI vs Manual Auditing
          </h2>
          <p className="text-center text-gray-300/70 mb-12">
            See how our AI-powered solution compares to traditional manual
            auditing
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-white/10">
              <div className="text-sm font-semibold text-gray-300">Metric</div>
              <div className="text-sm font-semibold text-gray-300 text-center">
                Manual Audit (₹0.2/call)
              </div>
              <div className="text-sm font-semibold text-primary text-center">
                AssureQAI (₹2/call)
              </div>
            </div>

            {comparisonData.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-3 gap-4 p-6 border-b border-white/10 hover:bg-white/5 transition"
              >
                <div className="text-sm font-medium text-gray-200">
                  {item.metric}
                </div>
                <div className="text-sm text-gray-300 text-center">
                  {item.manual}
                </div>
                <div className="text-sm text-green-400 text-center font-semibold">
                  {item.assureqai}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                How does pay-per-call pricing work?
              </h3>
              <p className="text-gray-300/70">
                You only pay ₹2 for each call we audit. No monthly commitments,
                no setup fees. Scale up or down based on your needs.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Is there a minimum commitment?
              </h3>
              <p className="text-gray-300/70">
                No minimum! Start small with a free trial and only pay for what
                you use. Perfect for testing before scaling.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Are there any hidden fees?
              </h3>
              <p className="text-gray-300/70">
                Absolutely not! ₹2 per call is the only cost. No setup fees, no
                hidden charges, no surprise bills.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-300/70">
                Yes! You can stop using AssureQAI at any time. No penalties, no
                long-term contracts. Just stop and go.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Is my data secure?
              </h3>
              <p className="text-gray-300/70">
                We offer enterprise-grade security with encrypted storage,
                role-based access controls, and full compliance support.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                What about training and support?
              </h3>
              <p className="text-gray-300/70">
                All customers get priority support. We also offer comprehensive
                documentation, training resources, and API access.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-primary/20 via-slate-900 to-primary/20 border border-primary/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to transform your QA process?
            </h2>
            <p className="text-gray-300/80 mb-8 max-w-2xl mx-auto">
              Start your free 7-day trial today. No credit card required. Audit
              100% of your calls for just ₹2 per call.
            </p>
            <Link href="/login" passHref>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
