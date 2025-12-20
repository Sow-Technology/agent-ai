"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { SakshiQaiLogo } from "@/components/common/SakshiQaiLogo";
import Image from "next/image";

export default function ContactPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        message: formData.get("message"),
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setIsLoading(false);
      toast({
        title: "Message Sent!",
        description:
          "Thank you for reaching out. We'll get back to you shortly.",
      });
      // Reset the form
      const form = event.target as HTMLFormElement;
      form.reset();
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col aurora-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" passHref>
            <SakshiQaiLogo className="h-8 w-auto" />
          </Link>
          <Link href="/" passHref>
            <Button
              variant="outline"
              className="bg-white/5 hover:bg-white/10 text-foreground border-white/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 animate-fade-in">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-4 text-center text-foreground">
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
              Get in Touch
            </h1>
            <p className="mt-4 text-lg md:text-xl text-primary-foreground/80">
              We’re here to help and answer any question you might have. We look
              forward to hearing from you.
            </p>
          </div>
        </section>

        {/* Contact Form & Info Section */}
        <section className="py-16 md:py-24 px-4 z-10 relative">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div
              className="space-y-8 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Contact Information
                </h2>
                <p className="text-muted-foreground">
                  Fill up the form and our team will get back to you within 24
                  hours.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <a
                    href="tel:+916363644521"
                    className="text-lg text-muted-foreground hover:text-primary transition-colors"
                  >
                    +91 6363644521
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <a
                    href="mailto:support@assureqai.com"
                    className="text-lg text-muted-foreground hover:text-primary transition-colors"
                  >
                    support@assureqai.com
                  </a>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground">
                    #198, Balaji Street
                    <br />
                    Ramamurthy Nagar, Bangalore
                    <br />
                    Karnataka 560016
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-muted-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="bg-white/5 border-white/20 text-foreground placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-muted-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        required
                        className="bg-white/5 border-white/20 text-foreground placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-muted-foreground">
                      Company Name (Optional)
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Your Company"
                      className="bg-white/5 border-white/20 text-foreground placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-muted-foreground">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="How can we help?"
                      required
                      rows={5}
                      className="bg-white/5 border-white/20 text-foreground placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary/80 hover:bg-primary text-primary-foreground"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-5 w-5" />
                      )}
                      {isLoading ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="z-10 relative mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <p className="text-base text-muted-foreground text-center">
            &copy; 2025 Joaji Innovation. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
