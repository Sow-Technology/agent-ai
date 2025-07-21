
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { login } from '@/lib/authService';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }

    // Simulate a short delay for UX, then perform login
    setTimeout(() => {
      const success = login(username, password);

      if (success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        router.push('/dashboard');
      } else {
        setError('Invalid username or password.');
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
      // Don't set isLoading to false on success, as the page will redirect
    }, 500); // A 500ms delay for better UX
  };

  return (
    <div className="w-full">
      <div className="mb-10 text-left">
        <h1 className="text-4xl font-semibold text-foreground mb-3">Welcome Back!</h1>
        <p className="text-base text-muted-foreground">Please enter your details to continue.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-foreground/80">Email or Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="text-base bg-input text-foreground placeholder:text-muted-foreground/70 border-border focus:border-accent"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-base bg-input text-foreground placeholder:text-muted-foreground/70 border-border focus:border-accent pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe} 
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-muted-foreground/50"
            />
            <Label htmlFor="rememberMe" className="text-sm font-medium text-muted-foreground cursor-pointer">
              Remember me
            </Label>
          </div>
          <Button
            type="button"
            variant="link"
            className="text-sm text-muted-foreground hover:text-accent transition-colors p-0 h-auto font-normal hover:no-underline"
            onClick={() => {
              toast({
                title: "Feature Not Available",
                description: "Password recovery is not yet implemented.",
              });
            }}
          >
            Forgot password?
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base py-3 h-12 font-semibold" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}
        </Button>
      </form>
    </div>
  );
}
