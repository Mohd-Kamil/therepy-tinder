'use client';

import React from 'react';
import AppShell from './AppShell';

interface ConfigErrorProps {
  message?: string;
}

export default function ConfigError({
  message = 'Supabase environment variables are not configured.',
}: ConfigErrorProps) {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col justify-center p-6 text-center select-none space-y-6">
        {/* Warning Icon */}
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="space-y-3">
          <h3 className="font-serif text-2xl font-bold text-zinc-900 leading-tight">
            Database Offline
          </h3>
          <p className="text-xs text-zinc-550 max-w-sm mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actionable instructions code panel */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-left font-mono text-[10px] text-zinc-600 space-y-2 select-text">
          <p className="font-semibold text-zinc-700">Setup Instructions:</p>
          <p>1. Create a <code className="bg-zinc-200 px-1 rounded">.env.local</code> file in your project root.</p>
          <p>2. Add the following lines:</p>
          <pre className="bg-zinc-900 text-purple-200 p-3 rounded-lg overflow-x-auto select-all">
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}
          </pre>
          <p>3. Restart your Next.js development server.</p>
        </div>

        <p className="text-[10px] text-zinc-400">
          Please check the application environment variable settings before running the assessment.
        </p>
      </div>
    </AppShell>
  );
}
