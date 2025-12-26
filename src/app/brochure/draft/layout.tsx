
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mission Briefing (Draft) // AssureQAi',
  description: 'Draft version of the brochure flipbook.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BrochureDraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
