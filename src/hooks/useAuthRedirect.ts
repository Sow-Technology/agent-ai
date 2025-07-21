
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/authService';

export function useAuthRedirect(redirectTo = '/login') {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      if (!authenticated) {
        router.replace(redirectTo);
      }
      // Set isCheckingAuth to false after the check is complete,
      // regardless of authentication status.
      setIsCheckingAuth(false); 
    }
  }, [router, redirectTo]);

  return { isCheckingAuth, isAuthenticated: isAuth };
}

