'use client';

import React from 'react';
import Image from 'next/image';
import { Response, Participant, FinalReflection } from '@/types/assessment';
import { cards } from '@/lib/cards';
import { getCardIcon } from './PsychologyCard';

interface ResultsViewProps {
  participant: Participant;
  responses: Response[];
  finalReflection: FinalReflection | null;
  onRestart: () => void;
}

export default function ResultsView({
  participant,
  responses,
  finalReflection,
  onRestart,
}: ResultsViewProps) {
  // Sort responses by question number
  const sortedResponses = [...responses].sort((a, b) => a.question_number - b.question_number);

  const handleDownload = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="w-full flex flex-col select-none relative bg-gradient-to-b from-[#faf8fd] via-[#f3ecf9] to-[#faf8fd] text-[#1c0e3a] min-h-full">
      
      {/* Printable Area Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            background: white !important;
            color: black !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }
          .print-title {
            color: black !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="pt-2 flex items-center justify-between px-6 pb-2 border-b border-purple-100 bg-[#faf8fd]/80 backdrop-blur-md sticky top-0 z-30 no-print">
        <button 
          onClick={onRestart}
          className="p-2 rounded-full border border-purple-100 bg-white text-[#6355d8] hover:bg-purple-50 transition outline-none"
          aria-label="Go back to home"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-purple-500/10">
            <Image
              src="/assets/logo/Logo.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-serif font-bold text-xs tracking-tight text-[#1c0e3a] block">MindLens</span>
        </div>

        <span className="text-[10px] font-bold text-[#6355d8] bg-purple-150/40 px-3.5 py-1 rounded-full border border-purple-200/30 font-mono tracking-wide">
          6 / 6
        </span>
      </div>

      <div className="p-6 flex flex-col space-y-6">
        {/* Editorial Heading */}
        <div className="text-center space-y-2 py-2">
          <span className="text-[10px] tracking-[0.25em] font-bold text-[#6355d8] bg-purple-150/40 px-3.5 py-1 rounded-full border border-purple-200/30 inline-block no-print">
            YOUR PICKS
          </span>
          <h2 className="font-serif text-3xl font-extrabold text-[#1c0e3a] leading-tight print-title">
            Your Reflections
          </h2>
          <p className="text-xs text-[#5c4d7c] font-semibold max-w-xs mx-auto">
            Here's what you connected with across the five situations, {participant.name}.
          </p>
        </div>

        {/* Selected cards list rows */}
        <div className="space-y-3.5 max-w-sm w-full mx-auto">
          {sortedResponses.map((res, index) => {
            const cardInfo = cards.find((c) => c.id === res.selected_card);
            
            return (
              <div
                key={res.id}
                className="p-3.5 bg-white border border-purple-100 rounded-2xl shadow-sm flex items-center justify-between space-x-3.5 print-card"
              >
                {/* Visual Thumbnail & Details */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  {cardInfo && (
                    <div className="relative w-12 h-16 rounded-xl overflow-hidden shrink-0 border border-purple-100 shadow-sm bg-purple-50">
                      <Image
                        src={cardInfo.image}
                        alt={cardInfo.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <span className="inline-flex items-center space-x-1 text-[9px] font-bold tracking-wider uppercase text-[#6355d8]">
                      {getCardIcon(res.selected_card, "h-2.5 w-2.5")}
                      <span>{cardInfo?.name || res.selected_card}</span>
                    </span>
                    <p className="text-xs text-[#1c0e3a] font-bold truncate leading-snug">
                      &ldquo;{res.question_text}&rdquo;
                    </p>
                    <p className="text-[10px] text-[#5c4d7c] leading-normal truncate italic pr-1 mt-0.5 font-medium">
                      {cardInfo?.tagline}
                    </p>
                  </div>
                </div>

                {/* Index Number Badge */}
                <div className="h-6 w-6 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-xs text-[#6355d8] font-bold shrink-0">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Theme reflection if present */}
        {finalReflection?.reflection && (
          <div className="p-5 bg-white border border-purple-100 rounded-2xl max-w-sm w-full mx-auto space-y-1.5 print-card shadow-sm text-left">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6355d8] flex items-center space-x-1.5">
              <svg className="h-3.5 w-3.5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>Overall Theme Reflection</span>
            </h4>
            <p className="text-xs text-[#2b1d52] italic leading-relaxed font-semibold">
              &ldquo;{finalReflection.reflection}&rdquo;
            </p>
          </div>
        )}

        {/* Disclaimer card */}
        <div className="bg-purple-100/20 border border-purple-100/50 rounded-2xl p-4 text-[10px] text-[#5c4d7c] leading-relaxed max-w-sm w-full mx-auto space-y-2 no-print text-left font-medium">
          <p className="font-bold text-[#1c0e3a]">Self-Reflection Note:</p>
          <p>
            These are the models you resonated with. This application is for educational purposes only. It is not a diagnostic tool or a substitute for therapy.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 max-w-sm w-full mx-auto pt-4 pb-8 no-print">
          <button 
            onClick={handleDownload}
            className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/15 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center space-x-2"
          >
            <span>Download Summary</span>
          </button>
          
          <button 
            onClick={onRestart}
            className="w-full py-3.5 bg-white border border-purple-100 hover:bg-purple-50 text-[#6355d8] rounded-full text-xs font-semibold tracking-wider transition active:scale-[0.99] shadow-sm"
          >
            Start Again
          </button>
        </div>
      </div>
    </div>
  );
}
