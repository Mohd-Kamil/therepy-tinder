'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import Button from '@/components/Button';
import { getActiveSessionIds, clearActiveSession } from '@/lib/session';
import { Shield, BookOpen, User, Edit2, ArrowLeft, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'hero' | 'consent'>('hero');
  const [hasExistingSession, setHasExistingSession] = useState(false);

  useEffect(() => {
    const { sessionId, participantId } = getActiveSessionIds();
    if (sessionId && participantId) {
      setHasExistingSession(true);
    }
  }, []);

  const handleResume = () => {
    router.push('/assessment');
  };

  const handleStartNew = () => {
    clearActiveSession();
    setHasExistingSession(false);
    setStep('consent');
  };

  const handleAgreeAndContinue = () => {
    router.push('/start');
  };

  return (
    <AppShell>
      {step === 'hero' ? (
        /* =====================================================================
           SCREEN 1: LANDING HERO PAGE (Light Lavender-Pink Environment)
           ===================================================================== */
        <div 
          className="flex-1 flex flex-col justify-between select-none relative h-full bg-gradient-to-b from-[#faf8fd] via-[#f3ecf9] to-[#faf8fd]"
          style={{
            backgroundImage: 'url("/assets/Screens/Homescreen/homescreen.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
          }}
        >
          {/* Top light gradient overlay for maximum readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#faf8fd] via-[#faf8fd]/80 to-transparent h-[60%] pointer-events-none" />

          {/* Admin Access Button in Top Left */}
          <button 
            onClick={() => router.push('/admin')}
            className="absolute top-4 left-4 p-2 rounded-full border border-purple-200 bg-white/70 text-[#6355d8] hover:bg-purple-100 hover:text-[#5244c7] transition z-20 outline-none shadow-sm"
            title="Admin Dashboard"
          >
            <Lock className="h-4 w-4" />
          </button>

          {/* Logo & Header content */}
          <div className="relative z-10 p-6 pt-16 flex flex-col space-y-6">
            <div className="flex justify-start">
              {/* Scaled-up Logo (3x larger than screenshot logo) */}
              <div className="relative w-56 h-18">
                <Image
                  src="/assets/logo/Logo.png"
                  alt="MindLens Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </div>

            {/* Headline and tags */}
            <div className="space-y-4 pt-2 text-left">
              <h1 className="font-serif text-3xl font-extrabold text-[#1c0e3a] leading-tight pr-4">
                Which way of thinking feels like you?
              </h1>
              <p className="text-[#4a3b68] text-xs font-semibold leading-relaxed max-w-sm">
                Explore five psychological approaches through five real-life situations.
              </p>
              
              {/* Pill badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {['Self-reflection', 'Private', 'Insightful'].map((tag) => (
                  <span 
                    key={tag}
                    className="px-3.5 py-1 bg-white/60 border border-purple-200/50 rounded-full text-[9px] font-bold text-[#6355d8] tracking-wide shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions & Disclaimers at the bottom */}
          <div className="relative z-10 p-6 pb-8 space-y-4 mt-auto">
            {hasExistingSession ? (
              <div className="space-y-3">
                <button 
                  onClick={handleResume}
                  className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/15 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center space-x-2"
                >
                  <span>Resume Journey</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleStartNew}
                  className="w-full py-3.5 bg-white/70 border border-purple-200/60 text-[#6355d8] rounded-full text-xs font-semibold hover:bg-white/95 transition"
                >
                  Start New Experience
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setStep('consent')}
                className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/20 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center space-x-2 outline-none"
              >
                <span>Start Exploring</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {/* Disclaimer */}
            <p className="text-[9px] text-[#5c4d7c] font-medium text-center leading-relaxed max-w-xs mx-auto">
              For self-reflection and educational purposes only. Not a substitute for professional advice.
            </p>
          </div>
        </div>
      ) : (
        /* =====================================================================
           SCREEN 2: PRIVACY & CONSENT ("Before we begin")
           ===================================================================== */
        <div className="flex-1 flex flex-col justify-between p-6 select-none relative h-full bg-gradient-to-b from-[#faf8fd] via-[#f3ecf9] to-[#faf8fd] animate-fade-in">
          
          {/* Back button header */}
          <div className="pt-2 flex items-center justify-between">
            <button 
              onClick={() => setStep('hero')}
              className="p-2 rounded-full border border-purple-100 bg-white text-[#6355d8] hover:bg-purple-50 transition outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-[9px] tracking-widest font-bold text-[#6355d8] bg-purple-150/40 px-3.5 py-1 rounded-full border border-purple-200/30">
              PRIVACY
            </span>
          </div>

          {/* Central content */}
          <div className="my-auto space-y-6 max-w-sm mx-auto pt-4 w-full">
            {/* Shield checkmark icon */}
            <div className="flex justify-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-purple-100/70 border border-purple-200/40 text-[#6355d8]">
                <Shield className="h-6 w-6" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="font-serif text-2xl font-bold text-[#1c0e3a] leading-tight">
                Before we begin
              </h2>
              <p className="text-xs text-[#5c4d7c] leading-relaxed max-w-xs mx-auto">
                Your responses help you reflect better and help us understand patterns that people experience.
              </p>
            </div>

            {/* Bullets with icons */}
            <div className="space-y-3.5 pt-2 max-h-[320px] overflow-y-auto pr-1">
              {[
                { 
                  icon: <Shield className="h-4 w-4" />, 
                  title: 'Responses Collected', 
                  text: 'Your approach choices and reflection notes are stored securely.' 
                },
                { 
                  icon: <BookOpen className="h-4 w-4" />, 
                  title: 'Research & Analysis', 
                  text: 'Data helps study self-reflection and psychological approach patterns.' 
                },
                { 
                  icon: <User className="h-4 w-4" />, 
                  title: 'Voluntary & Anonymous', 
                  text: 'Participation is fully voluntary. You can stop or skip questions anytime.' 
                },
                { 
                  icon: <Edit2 className="h-4 w-4" />, 
                  title: 'No Clinical Diagnosis', 
                  text: 'This is an educational inquiry tool, not a clinical assessment or therapy.' 
                },
                { 
                  icon: <Shield className="h-4 w-4 text-amber-600" />, 
                  title: 'No Sensitive Personal Info', 
                  text: 'Please do not type highly sensitive personal details in reflection fields.' 
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3.5 bg-white border border-purple-100/50 rounded-2xl p-3.5 shadow-sm text-left">
                  <div className="text-[#6355d8] shrink-0 p-1.5 bg-purple-50 rounded-xl mt-0.5">{item.icon}</div>
                  <div className="leading-snug">
                    <p className="text-xs text-[#1c0e3a] font-bold">{item.title}</p>
                    <p className="text-[10px] text-[#5c4d7c] font-semibold mt-0.5 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-[#5c4d7c] text-center leading-relaxed pt-2">
              We value your privacy and never share personal information.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pb-8 pt-4">
            <button 
              onClick={handleAgreeAndContinue}
              className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/20 hover:opacity-95 active:scale-[0.99] transition outline-none"
            >
              I Understand, Continue
            </button>
            <button 
              onClick={() => router.push('/privacy')}
              className="w-full text-center text-xs font-semibold text-[#5c4d7c] hover:text-[#6355d8] transition py-1 underline"
            >
              View Full Privacy Policy
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
