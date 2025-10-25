"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AssureQaiLogo } from "@/components/common/SakshiQaiLogo";
import { HomePageContent } from "@/components/auth/HomePageContent";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header */}
      <header className="z-10 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" passHref>
              <Button variant="ghost">About</Button>
            </Link>
            <Link href="/pricing" passHref>
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/contact" passHref>
              <Button variant="ghost">Contact</Button>
            </Link>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/" passHref>
              <AssureQaiLogo className="h-8 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" passHref>
              <Button variant="ghost" className="hidden sm:inline-block">
                Log in
              </Button>
            </Link>
            <Link href="/login" passHref>
              <Button>Try for free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <HomePageContent />
      </main>
    </div>
  );
}
