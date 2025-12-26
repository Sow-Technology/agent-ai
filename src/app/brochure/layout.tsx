
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brochure // AssureQAi',
  description: 'The platform built to audit 100% of your calls. Explore features, pricing, and operational intelligence.',
  keywords: ['automated qa', 'call auditing', '100% coverage', 'AssureQAi features', 'pricing'],
  openGraph: {
    title: 'Brochure // AssureQAi',
    description: 'The platform built to audit 100% of your calls.',
    url: 'https://assureqai.com/brochure',
    images: [
      {
        url: 'https://assureqai.com/og/brochure.png',
        width: 1200,
        height: 630,
        alt: 'AssureQAi Brochure',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brochure // AssureQAi',
    description: 'The platform built to audit 100% of your calls.',
    images: ['https://assureqai.com/og/brochure.png'],
    site: '@assureQAI',
    creator: '@assureQAI',
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
