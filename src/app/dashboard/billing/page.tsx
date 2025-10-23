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
}

const plans: Plan[] = [
  {
    name: "AssureQAI Pay-Per-Call",
    price: "₹2",
    pricePeriod: "per AI audit",
    description: "Simple, transparent pricing. Pay only for what you use.",
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
    cta: "View Details",
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
          <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground mt-2">
            Pay only ₹2 per AI audit. No hidden fees, no setup costs.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className="shadow-lg flex flex-col border-2 border-primary"
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-baseline pt-4">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">
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
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Pricing Comparison */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>AssureQAI vs Manual Auditing</CardTitle>
            <CardDescription>
              See how our AI-powered pricing compares to traditional manual
              auditing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">
                      Metric
                    </th>
                    <th className="text-center py-2 px-4 font-semibold">
                      Manual Audit
                    </th>
                    <th className="text-center py-2 px-4 font-semibold text-primary">
                      AssureQAI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">Cost per call</td>
                    <td className="text-center py-3 px-4">₹0.2</td>
                    <td className="text-center py-3 px-4 font-semibold text-primary">
                      ₹2
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">Calls per month</td>
                    <td className="text-center py-3 px-4">Limited</td>
                    <td className="text-center py-3 px-4 font-semibold text-green-500">
                      Unlimited
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">Consistency</td>
                    <td className="text-center py-3 px-4">Variable</td>
                    <td className="text-center py-3 px-4 font-semibold text-green-500">
                      100%
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">Time to insights</td>
                    <td className="text-center py-3 px-4">Days</td>
                    <td className="text-center py-3 px-4 font-semibold text-green-500">
                      Minutes
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="py-3 px-4">24/7 Monitoring</td>
                    <td className="text-center py-3 px-4">No</td>
                    <td className="text-center py-3 px-4 font-semibold text-green-500">
                      Yes
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
