'use client';

import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b041a] py-0 sm:py-8 overflow-x-hidden relative">
      {/* Atmospheric blurred ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-20 w-96 h-96 bg-purple-900/10 rounded-full filter blur-3xl opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-indigo-900/20 rounded-full filter blur-3xl opacity-45 animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* Centered Device mockup container on desktop, full screen on mobile */}
      <div className="w-full sm:max-w-[480px] md:max-w-[500px] min-h-[100dvh] sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[44px] sm:border-[12px] sm:border-zinc-950 bg-[#faf8fd] sm:shadow-[0_30px_70px_-10px_rgba(76,29,149,0.35)] relative overflow-hidden flex flex-col z-10 transition-all duration-300 sm:border-zinc-100">
        {/* iPhone-style Notch for premium mobile-first desktop look */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-zinc-950 rounded-b-2xl z-50 pointer-events-none" />
        
        {/* Viewport content area */}
        <div className="flex-1 flex flex-col overflow-y-auto sm:pt-6 pt-0 bg-gradient-to-b from-[#faf8fd] via-[#f3ecf9] to-[#faf8fd]">
          {children}
        </div>
      </div>
    </div>
  );
}
