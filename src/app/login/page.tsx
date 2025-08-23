import { LoginForm } from '@/components/auth/LoginForm';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background p-4 lg:p-0 relative">
      <div className="absolute top-6 right-6 z-10">
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="flex w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl h-auto lg:min-h-[80vh] xl:min-h-[700px] bg-card shadow-2xl rounded-lg overflow-hidden">
        {/* Content Section (Login) */}
        <div className="w-full lg:w-1/2 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
           <LoginForm />
        </div>

        {/* Image Section */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative bg-secondary">
          <Image
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=1200&q=80"
            alt="Welcome Background"
            fill
            style={{objectFit: 'cover'}}
            data-ai-hint="office abstract"
            priority
          />
           <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-6">
              <div className="text-center">
                 <h2 className="text-3xl md:text-4xl font-bold text-white shadow-lg leading-tight">
                   AssureQAI
                </h2>
                <p className="text-xl text-gray-300 mt-2 shadow-lg">
                  AI-Powered Quality Assurance
                </p>
              </div>
            </div>
        </div>
      </div>
    </main>
  );
}
