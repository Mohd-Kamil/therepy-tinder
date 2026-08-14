'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import ConfigError from '@/components/ConfigError';
import { isSupabaseConfigured } from '@/lib/supabase';
import { startAssessmentSession, getActiveSessionIds } from '@/lib/session';
import { ArrowLeft, ArrowRight, User, Calendar } from 'lucide-react';

export default function StartPage() {
  const router = useRouter();
  const [subStep, setSubStep] = useState<'profile' | 'instructions'>('profile');
  const [name, setName] = useState('');
  const [ageStr, setAgeStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resume check
  useEffect(() => {
    const { sessionId, participantId } = getActiveSessionIds();
    if (sessionId && participantId) {
      setSubStep('profile');
    }
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <ConfigError message="Supabase configuration is required to save participant records." />
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name to continue.');
      return;
    }

    let parsedAge: number | null = null;
    if (ageStr.trim() !== '') {
      parsedAge = parseInt(ageStr, 10);
      if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
        setError('Please enter a valid age between 1 and 120.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await startAssessmentSession(trimmedName, parsedAge);
      setSubStep('instructions');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Database error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (subStep === 'instructions') {
      setSubStep('profile');
    } else {
      router.push('/');
    }
  };

  return (
    <AppShell>
      {subStep === 'profile' ? (
        /* =====================================================================
           SCREEN 3: PROFILE REGISTRATION (1 / 6) (Light Lavender-Pink theme)
           ===================================================================== */
        <div 
          className="flex-1 flex flex-col justify-between p-6 select-none relative h-full bg-gradient-to-b from-[#faf8fd] via-[#f3ecf9] to-[#faf8fd] animate-fade-in"
          style={{
            backgroundImage: 'url("/assets/Screens/3/3rd.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
          }}
        >
          {/* Top light gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#faf8fd] via-[#faf8fd]/90 to-transparent h-[55%] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 pt-2 flex items-center justify-between">
            <button 
              onClick={handleBack}
              className="p-2 rounded-full border border-purple-100 bg-white text-[#6355d8] hover:bg-purple-50 transition outline-none"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-bold text-[#6355d8] bg-purple-150/40 px-3.5 py-1 rounded-full border border-purple-200/30 font-mono tracking-wide">
              1 / 6
            </span>
          </div>

          {/* Central Form Block */}
          <div className="relative z-10 my-auto space-y-6 max-w-sm w-full mx-auto pt-4">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-bold text-[#1c0e3a] leading-tight">
                Tell us a little about you
              </h2>
              <p className="text-xs text-[#5c4d7c] font-semibold">
                This helps us personalize your experience (optional).
              </p>
            </div>

            {error && (
              <div className="text-xs text-red-650 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Name Input */}
              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="start-name-input" className="text-xs font-bold text-[#1c0e3a] text-left">
                  Your Name
                </label>
                <div className="relative w-full">
                  <User className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6355d8] pointer-events-none" />
                  <input
                    id="start-name-input"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    maxLength={50}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/85 text-[#1c0e3a] placeholder-zinc-400 border border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm text-sm font-semibold transition"
                  />
                </div>
              </div>

              {/* Age Input */}
              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="start-age-input" className="text-xs font-bold text-[#1c0e3a] text-left">
                  Your Age <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <div className="relative w-full">
                  <Calendar className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6355d8] pointer-events-none" />
                  <input
                    id="start-age-input"
                    type="number"
                    placeholder="Enter your age"
                    value={ageStr}
                    onChange={(e) => setAgeStr(e.target.value)}
                    disabled={isLoading}
                    min={1}
                    max={120}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/85 text-[#1c0e3a] placeholder-zinc-400 border border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm text-sm font-semibold transition"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/15 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center space-x-2 outline-none disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Creating profile...</span>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <div className="relative z-10 pb-8 text-center">
            <p className="text-[10px] text-[#5c4d7c] font-semibold">
              You can always change this later.
            </p>
          </div>
        </div>
      ) : (
        /* =====================================================================
           SCREEN 4: HOW THIS WORKS (2 / 6) (Light Lavender-Pink theme)
           ===================================================================== */
        <div 
          className="flex-1 flex flex-col justify-between p-6 select-none relative h-full bg-gradient-to-b from-[#faf8fd] via-[#f3ecf9] to-[#faf8fd] animate-fade-in"
          style={{
            backgroundImage: 'url("/assets/Screens/How it works screen/How it works.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
          }}
        >
          {/* Top light gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#faf8fd] via-[#faf8fd]/90 to-transparent h-[60%] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 pt-2 flex items-center justify-between">
            <button 
              onClick={handleBack}
              className="p-2 rounded-full border border-purple-100 bg-white text-[#6355d8] hover:bg-purple-50 transition outline-none"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-bold text-[#6355d8] bg-purple-150/40 px-3.5 py-1 rounded-full border border-purple-200/30 font-mono tracking-wide">
              2 / 6
            </span>
          </div>

          {/* Central Steps Block */}
          <div className="relative z-10 my-auto space-y-6 max-w-sm w-full mx-auto pt-4">
            <div className="space-y-1">
              <h2 className="font-serif text-3xl font-bold text-[#1c0e3a] leading-tight">
                How this works
              </h2>
            </div>

            {/* List steps */}
            <div className="space-y-4 pt-2">
              {[
                "You'll see a statement that might feel familiar.",
                "Choose the approach that feels most relevant.",
                "Tell us why you chose it (optional but helpful).",
                "Answer all 5 to see your full reflection."
              ].map((stepText, idx) => (
                <div key={idx} className="flex items-start space-x-3.5 text-left">
                  {/* Numbered circle */}
                  <div className="h-6 w-6 rounded-full bg-[#6355d8] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-md shadow-purple-900/15">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-[#2b1d52] leading-relaxed font-semibold pt-0.5">
                    {stepText}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions at bottom */}
          <div className="relative z-10 pb-8 pt-4">
            <button 
              onClick={() => router.push('/assessment')}
              className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/15 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center space-x-2"
            >
              <span>Let's Start</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
