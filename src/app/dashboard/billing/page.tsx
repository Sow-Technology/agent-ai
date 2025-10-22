"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, CreditCard, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Suspense } from "react";

interface Plan {
  name: string;
  price: string;
  pricePeriod: string;
  description: string;
  features: string[];
  cta: string;
  isCurrent: boolean;
  isPopular?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: "₹2",
    pricePeriod: "per call",
    description: "Perfect for small teams getting started.",
    features: [
      "AI-Assisted Audits",
      "100% Call Coverage",
      "Real-time Scoring",
      "Basic Dashboard",
      "Up to 500 calls/month",
      "Email Support",
    ],
    cta: "Start Free Trial",
    isCurrent: true,
  },
  {
    name: "Professional",
    price: "₹2",
    pricePeriod: "per call",
    description: "For growing QA teams with advanced needs.",
    features: [
      "AI-Assisted Audits",
      "100% Call Coverage",
      "Real-time Scoring",
      "Advanced Dashboard",
      "Up to 5,000 calls/month",
      "Priority Email Support",
      "Custom Parameters",
      "Team Collaboration",
      "Compliance Reports",
    ],
    cta: "Upgrade to Professional",
    isCurrent: false,
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    pricePeriod: "based on volume",
    description: "For large-scale operations with custom needs.",
    features: [
      "AI-Assisted Audits",
      "100% Call Coverage",
      "Unlimited Calls",
      "24/7 Priority Support",
      "Custom Parameters & Workflows",
      "Advanced Analytics & ML",
      "API Access",
      "Custom Integrations",
      "Dedicated Account Manager",
    ],
    cta: "Contact Sales",
    isCurrent: false,
  },
];

export default function BillingPage() {
  return (
    // Wrap the main content with Suspense
    <Suspense fallback={<div>Loading...</div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const currentUsage = 37; // Example data
  const usageLimit = 150; // Example data
  const usagePercentage = (currentUsage / usageLimit) * 100; // Although useSearchParams is not directly used here, wrapping in Suspense is a good practice
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold">
                Billing & Plans
              </CardTitle>
            </div>
            <CardDescription>
              Manage your subscription, view invoices, and explore upgrade
              options.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Current Usage</h3>
              <p className="text-sm text-muted-foreground">
                You have used {currentUsage} of your {usageLimit} available
                audits this month.
              </p>
              <Progress value={usagePercentage} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{usagePercentage.toFixed(0)}% used</span>
                <span>Resets in 12 days</span>
              </div>
            </div>
            <div className="text-center">
              <Button variant="outline">View Past Invoices</Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <h2 className="text-3xl font-bold">
            Find the plan that&rsquo;s right for you
          </h2>
          <p className="text-muted-foreground mt-2">
            Start with a free trial and scale as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`shadow-lg flex flex-col ${
                plan.isCurrent ? "border-primary" : ""
              } ${
                plan.isPopular
                  ? "border-2 border-primary shadow-2xl relative"
                  : ""
              }`}
            >
              {plan.isPopular && (
                <Badge
                  variant="default"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1"
                >
                  <Star className="mr-2 h-4 w-4" /> Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-baseline pt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">
                    {plan.pricePeriod}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${
                    plan.isCurrent
                      ? ""
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                  variant={plan.isCurrent ? "outline" : "default"}
                  disabled={plan.isCurrent}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
