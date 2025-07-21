
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const DynamicAddUserContent = dynamic(() => import('./add-user-content'), {
  loading: () => (
    <div className="space-y-8 p-6 animate-pulse">
      <div className="h-24 bg-muted rounded w-full mb-6"></div>
      <div className="h-64 bg-muted rounded w-full mb-6"></div>
      <div className="h-48 bg-muted rounded w-full"></div>
    </div>
  ),
});

export default function AddUserPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicAddUserContent />{' '}
    </Suspense>
  );
}
    
