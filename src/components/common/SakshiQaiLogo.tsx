'use client';

import Image from 'next/image';

interface AssureQaiLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function AssureQaiLogo({ className = '', width = 130, height = 40 }: AssureQaiLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="AssureQAI Logo"
      width={width}
      height={height}
      className={`transition-opacity duration-200 w-[130px]  !h-auto group-data-[state=collapsed]/peer:opacity-0 dark:invert invert-0 ${className}`}
      priority
    />
  );
}
