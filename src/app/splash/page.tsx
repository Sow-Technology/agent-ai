'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SakshiQaiLogo } from '@/components/common/SakshiQaiLogo';

export default function SplashScreenPage() {
  const router = useRouter();
  const [animationState, setAnimationState] = useState('start');

  useEffect(() => {
    // Trigger animations sequentially
    const iconTimer = setTimeout(() => setAnimationState('icon'), 100);
    const textTimer = setTimeout(() => setAnimationState('text'), 500);

    // Redirect to home page after animations
    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, 2000); // Total time on splash screen

    return () => {
      clearTimeout(iconTimer);
      clearTimeout(textTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className={`splash-logo-wrapper animate-state-${animationState}`}>
        <SakshiQaiLogo className="h-28 w-auto sm:h-32 md:h-36" />
      </div>
    </main>
  );
}
