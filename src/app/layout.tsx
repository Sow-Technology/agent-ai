
import type {Metadata} from 'next';
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/common/ThemeProvider';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  metadataBase: new URL('https://assureqai.com'),
  title: {
    default: 'AssureQAi - AI-Powered Quality Assurance Platform',
    template: '%s | AssureQAi',
  },
  description: 'Transform your QA process with 100% automated conversation auditing. AssureQAi uses advanced AI to analyze every customer interaction, ensuring compliance and quality at scale.',
  keywords: ['QA automation', 'AI quality assurance', 'conversation auditing', 'call center QA', 'customer service analytics', 'compliance monitoring', 'speech analytics'],
  authors: [{ name: 'AssureQAi Team' }],
  creator: 'AssureQAi',
  publisher: 'AssureQAi',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://assureqai.com',
    siteName: 'AssureQAi',
    title: 'AssureQAi - AI-Powered Quality Assurance Platform',
    description: 'Transform your QA process with 100% automated conversation auditing. Advanced AI analyzes every customer interaction for compliance and quality.',
    images: [
      {
        url: '/og/home.png',
        width: 1200,
        height: 630,
        alt: 'AssureQAi - AI-Powered Quality Assurance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AssureQAi - AI-Powered Quality Assurance Platform',
    description: 'Transform your QA process with 100% automated conversation auditing.',
    images: ['/og/home.png'],
    creator: '@assureqai',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://assureqai.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`antialiased bg-background text-foreground ${inter.variable} ${outfit.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-V09H926VWQ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-V09H926VWQ');
          `}
        </Script>
      </body>
    </html>
  );
}
