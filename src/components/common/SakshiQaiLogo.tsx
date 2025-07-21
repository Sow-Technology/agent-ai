'use client';

import type { SVGProps } from 'react';

export function AssureQaiLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 40"
      aria-label="AssureQAI Logo"
      {...props}
    >
      <g className="logo-text-group transition-opacity duration-200 group-data-[state=collapsed]/peer:opacity-0">
        <text
          x="0"
          y="20"
          fontFamily="Calibri, sans-serif"
          fontSize="22"
          fontWeight="600"
          fill="currentColor"
          dominantBaseline="middle"
        >
          AssureQAI
        </text>
      </g>
    </svg>
  );
}
