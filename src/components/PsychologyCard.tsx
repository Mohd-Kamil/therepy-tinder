'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/types/assessment';
import { Brain, Compass, Heart, Smile, Network } from 'lucide-react';

interface PsychologyCardProps {
  card: Card;
  isSelected?: boolean;
  onSelect?: () => void;
  isActive?: boolean; // True if it's the center card in the carousel
}

export function getCardIcon(id: string, className = "h-5 w-5") {
  switch (id) {
    case 'cbt':
      return <Brain className={`${className} text-purple-600`} />;
    case 'behavioural':
      return <Compass className={`${className} text-indigo-500`} />;
    case 'psychodynamic':
      return <Heart className={`${className} text-rose-500`} />;
    case 'humanistic':
      return <Smile className={`${className} text-amber-500`} />;
    case 'systemic':
      return <Network className={`${className} text-emerald-500`} />;
    default:
      return null;
  }
}

export default function PsychologyCard({
  card,
  isSelected = false,
  onSelect,
  isActive = true,
}: PsychologyCardProps) {
  return (
    <div
      onClick={() => isActive && onSelect?.()}
      className={`w-full max-w-[280px] h-[380px] bg-white rounded-3xl overflow-hidden shadow-lg border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer select-none relative group ${
        isSelected
          ? 'border-purple-600 shadow-purple-600/10 active-glow'
          : 'border-zinc-150 hover:border-purple-200'
      } ${!isActive ? 'pointer-events-none opacity-40 scale-95' : ''}`}
      role="button"
      aria-selected={isSelected}
      aria-label={`Psychological approach: ${card.name}. Tagline: ${card.tagline}`}
    >
      {/* Background/Atmospheric Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/50 to-transparent pointer-events-none" />

      {/* Selected Indicator Badge */}
      {isSelected && (
        <div className="absolute top-4 right-4 bg-purple-650 text-white rounded-full p-1.5 shadow-md z-30 border border-white">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Visual Image Section */}
      <div className="w-full h-[52%] relative overflow-hidden bg-zinc-50">
        <Image
          src={card.image}
          alt={`Visual representation of ${card.name}`}
          fill
          sizes="(max-w-768px) 280px, 280px"
          priority={isActive}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Editorial Content Section */}
      <div className="p-6 flex-1 flex flex-col justify-between bg-white z-10">
        <div className="flex items-start justify-between space-x-2">
          <div className="space-y-1">
            {/* Approach Label */}
            <span className="text-[9px] tracking-[0.2em] font-bold text-purple-600 uppercase">
              APPROACH
            </span>
            {/* Headline Name */}
            <h3 className="font-serif text-2xl font-bold text-zinc-900 leading-tight">
              {card.name}
            </h3>
          </div>
          {/* Custom Styled Icon Circle */}
          <div className="p-2 bg-purple-50/70 border border-purple-100/50 rounded-2xl flex items-center justify-center shrink-0">
            {getCardIcon(card.id)}
          </div>
        </div>

        {/* Tagline sentence */}
        <p className="text-zinc-500 text-xs leading-relaxed italic pr-2">
          &ldquo;{card.tagline}&rdquo;
        </p>

        {/* CTA label */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-655 group-hover:text-purple-650 transition-colors">
            {isSelected ? 'Selected Match' : 'Tap to Select'}
          </span>
          <svg
            className={`h-4 w-4 transition-transform duration-300 ${
              isSelected ? 'text-purple-600' : 'text-zinc-300 group-hover:translate-x-0.5'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
