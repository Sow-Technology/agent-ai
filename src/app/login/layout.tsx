import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Access',
  description: 'Log in to AssureQAi platform. Secure, AI-powered access to your quality assurance dashboard.',
  keywords: ['login', 'secure access', 'AssureQAi login', 'dashboard access'],
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
