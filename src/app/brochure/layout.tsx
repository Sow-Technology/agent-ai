import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mission Briefing // AssureQAi',
  description: 'Confidential Dossier: The platform built to audit 100% of your calls. Explore features, pricing, and operational intelligence.',
  keywords: ['brochure', 'mission briefing', 'AssureQAi features', 'pricing', 'case studies'],
  openGraph: {
    title: 'Mission Briefing // AssureQAi',
    description: 'Explore the capabilities of the AssureQAi platform.',
    url: 'https://assureqai.com/brochure',
    images: [
      {
        url: 'https://assureqai.com/og/brochure.png',
        width: 1200,
        height: 630,
        alt: 'AssureQAi Mission Briefing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mission Briefing // AssureQAi',
    description: 'Confidential Dossier: The platform built to audit 100% of your calls.',
    images: ['https://assureqai.com/og/brochure.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BrochureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
