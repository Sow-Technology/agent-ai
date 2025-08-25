
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, clientLogout } from '@/lib/clientAuthService';
import { getAuthHeaders } from '@/lib/authUtils';

export function useAuthRedirect(redirectTo = '/login') {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const checkAuth = async () => {
        try {
          const token = getAuthToken();
          
          if (!token) {
            setIsAuth(false);
            router.replace(redirectTo);
            setIsCheckingAuth(false);
            return;
          }

          const response = await fetch('/api/auth/status', {
            method: 'GET',
            headers: getAuthHeaders(),
          });
          const data = await response.json();
          
          console.log('Auth status response:', { status: response.status, data });
          
          const authenticated = response.ok && data.success && data.isAuthenticated;
          setIsAuth(authenticated);
          if (!authenticated) {
            console.log('Authentication failed, redirecting to login');
            // Clear invalid token data
            clientLogout();
            router.replace(redirectTo);
          } else {
            console.log('Authentication successful');
          }
        } catch (error) {
          console.error('Authentication check failed:', error);
          setIsAuth(false);
          clientLogout();
          router.replace(redirectTo);
        } finally {
          setIsCheckingAuth(false);
        }
      };
      checkAuth();
    }
  }, [router, redirectTo]);

  return { isCheckingAuth, isAuthenticated: isAuth };
}

