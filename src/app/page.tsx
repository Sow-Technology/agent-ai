
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AssureQaiLogo } from '@/components/common/SakshiQaiLogo';
import { HomePageContent } from '@/components/auth/HomePageContent';
import { ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const navLinks = [
  { name: "Pricing" },
  { name: "Company" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header */}
      <header className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-6">
          <Link href="/" passHref>
            <AssureQaiLogo className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <AlertDialog key={link.name}>
                <AlertDialogTrigger asChild>
                  <Button variant="link" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-0 hover:no-underline cursor-pointer">
                    {link.name}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Under Construction</AlertDialogTitle>
                    <AlertDialogDescription>
                      This page is still under work. Please check back later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction>Home</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
          </nav>
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <HomePageContent />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                 <h4 className="text-sm font-semibold text-foreground">Company</h4>
                 <ul className="space-y-2">
                    <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">About Us</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                     <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">Blog</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                     <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">Contact</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                 </ul>
              </div>
              <div className="space-y-3">
                 <h4 className="text-sm font-semibold text-foreground">Resources</h4>
                 <ul className="space-y-2">
                    <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">Learning Center</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                    <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">Support</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                 </ul>
              </div>
              <div className="space-y-3">
                 <h4 className="text-sm font-semibold text-foreground">Legal</h4>
                 <ul className="space-y-2">
                    <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">Terms of Service</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                    <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">Privacy Policy</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                 </ul>
              </div>
              <div className="space-y-3">
                 <h4 className="text-sm font-semibold text-foreground">Social</h4>
                 <ul className="space-y-2">
                    <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">Twitter / X</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                    <li>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="link" className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal hover:no-underline">LinkedIn</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Under Construction</AlertDialogTitle><AlertDialogDescription>This page is still under work. Please check back later.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction>Home</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </li>
                 </ul>
              </div>
           </div>
           <div className="pt-8 border-t text-center text-sm text-muted-foreground">
             <p>&copy; {new Date().getFullYear()} AssureQAI. All Rights Reserved.</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
