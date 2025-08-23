
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AssureQaiLogo } from '@/components/common/SakshiQaiLogo';
import { HomePageContent } from '@/components/auth/HomePageContent';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header */}
      <header className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-6">
          <Link href="/" passHref>
            <AssureQaiLogo className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/login" className="hidden sm:inline-block">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/login">
            <Button>
              Try AssureQAI <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <HomePageContent />
      </main>
    </div>
  );
}
