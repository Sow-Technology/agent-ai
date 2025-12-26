import Link from "next/link";
import { Spotlight } from "@/components/landing/Spotlight";
import { Navbar } from "@/components/landing/Navbar";
import { ArrowLeft, WifiOff, Linkedin } from "lucide-react";
import { AssureQaiLogo } from "@/components/common/AssureQaiLogo";

export default function NotFound() {
  return (
    <Spotlight className="min-h-screen bg-white dark:bg-black flex flex-col relative overflow-hidden selection:bg-emerald-500/20 transition-colors duration-500">
      
      <div className="absolute top-0 w-full z-50">
        <Navbar />
      </div>

      {/* Cinematic Background Lines */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
          <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-neutral-300 dark:via-white/20 to-transparent" />
          <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-neutral-300 dark:via-white/20 to-transparent" />
          <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-300 dark:via-white/10 to-transparent" />
          <div className="absolute bottom-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-300 dark:via-white/10 to-transparent" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-4 max-w-2xl mx-auto mt-20">
        
        {/* Signal Lost Icon */}
        <div className="mb-8 relative">
            <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full animate-pulse" />
            <WifiOff className="w-20 h-20 text-rose-600 dark:text-rose-500 relative z-10 animate-pulse" />
        </div>

        {/* Glitch 404 */}
        <h1 className="text-8xl md:text-9xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tighter relative inline-block">
          <span className="relative z-10">404</span>
          <span className="absolute top-0 left-0 -translate-x-[2px] text-rose-500 mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse">404</span>
          <span className="absolute top-0 left-0 translate-x-[2px] text-cyan-500 mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse delay-75">404</span>
        </h1>

        {/* Status Message */}
        <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono text-sm text-rose-600 dark:text-rose-500/80 tracking-[0.2em] uppercase">
                Signal Lost // Sector Unknown
            </span>
        </div>

        <p className="text-neutral-600 dark:text-neutral-400 text-lg md:text-xl mb-10 max-w-md leading-relaxed">
          The trajectory you are following has led to a void. The dossier or transmission you are looking for does not exist in this quadrant.
        </p>

        {/* Action Button */}
        <Link href="/">
          <button className="group relative inline-flex items-center gap-3 px-8 py-4 bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-900 dark:text-white rounded-full border border-neutral-200 dark:border-white/10 transition-all duration-300 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono text-sm font-bold tracking-wider uppercase">Return to Command</span>
          </button>
        </Link>
        
         <div className="mt-8 text-xs font-mono text-neutral-400 dark:text-neutral-600">
            Error Code: DOES_NOT_EXIST
        </div>

      </div>

      {/* Simplified Footer */}
      <footer className="relative z-10 border-t border-neutral-200 dark:border-white/10 mt-12 bg-neutral-50 dark:bg-black/50 backdrop-blur-sm">
         <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
                <div className="col-span-2 md:col-span-1">
                     <AssureQaiLogo 
                         showIcon={true} 
                         showLogo={true} 
                         width={120} 
                         className="h-8 w-auto mb-4"
                     />
                     <p className="text-xs text-neutral-500 dark:text-neutral-400">
                         Automated QA for high-velocity teams.
                     </p>
                </div>
                <div>
                     <h4 className="font-bold text-neutral-900 dark:text-white mb-4 text-sm">Product</h4>
                     <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                         <li><Link href="/#features" className="hover:text-indigo-600 dark:hover:text-indigo-400">Features</Link></li>
                         <li><Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400">Pricing</Link></li>
                     </ul>
                </div>
                <div>
                     <h4 className="font-bold text-neutral-900 dark:text-white mb-4 text-sm">Company</h4>
                     <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                         <li><Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">About</Link></li>
                         <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</Link></li>
                     </ul>
                </div>
                <div>
                     <h4 className="font-bold text-neutral-900 dark:text-white mb-4 text-sm">Legal</h4>
                     <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                         <li><Link href="/legal/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy</Link></li>
                         <li><Link href="/legal/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms</Link></li>
                     </ul>
                </div>
            </div>
            <div className="border-t border-neutral-200 dark:border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-400 dark:text-neutral-500">
                <div>© 2025 Joaji Inc. All rights reserved.</div>
                <div className="flex gap-4">
                     <Link href="https://www.linkedin.com/company/assureqai/" target="_blank" rel="noopener noreferrer">
                         <Linkedin className="w-4 h-4 hover:text-neutral-900 dark:hover:text-white transition-colors" />
                     </Link>
                </div>
            </div>
         </div>
      </footer>
    </Spotlight>
  );
}
