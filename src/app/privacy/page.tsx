'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex-1 flex flex-col justify-between p-6 select-none relative h-full bg-[#150933] text-zinc-200">
        
        {/* Header with back navigation */}
        <div className="pt-2 flex items-center justify-between border-b border-white/5 pb-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 rounded-full border border-white/5 bg-white/5 text-zinc-350 hover:text-white transition outline-none focus:ring-2 focus:ring-purple-400"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-[9px] tracking-widest font-bold text-purple-400 uppercase">
            PRIVACY POLICY
          </span>
        </div>

        {/* Scrollable text content */}
        <div className="flex-grow overflow-y-auto py-6 space-y-4 text-xs leading-relaxed max-w-sm mx-auto pr-1">
          <h2 className="font-serif text-lg font-bold text-white">Privacy Statement</h2>
          <p>
            This application is created solely for self-reflection, learning, and psychological approach education. We are fully committed to protecting your privacy.
          </p>
          <h3 className="font-serif font-bold text-white pt-2">1. Anonymous Data Storage</h3>
          <p>
            Your responses are stored anonymously under a randomly generated UUID. We do not link responses to your name, IP address, or email, nor do we request user registration.
          </p>
          <h3 className="font-serif font-bold text-white pt-2">2. Local Browser Caching</h3>
          <p>
            We store session UUIDs in your browser's local storage cache (`localStorage`). This is used solely to let you resume your assessment if you refresh or close the page.
          </p>
          <h3 className="font-serif font-bold text-white pt-2">3. Research Usage</h3>
          <p>
            Aggregated, anonymous metrics (such as the popularity percentages of different approaches) are gathered for study and statistical analytics in our admin dashboard.
          </p>
        </div>

        <div className="pb-8 pt-4">
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-full text-xs font-semibold tracking-wider transition active:scale-[0.99]"
          >
            Return to Home
          </button>
        </div>
      </div>
    </AppShell>
  );
}
