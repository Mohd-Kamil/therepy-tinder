'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Card } from '@/types/assessment';
import PsychologyCard from './PsychologyCard';

interface CardCarouselProps {
  cards: Card[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
}

export default function CardCarousel({
  cards,
  selectedCardId,
  onSelectCard,
}: CardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Synchronize index if a card was already selected previously (resuming session)
  useEffect(() => {
    if (selectedCardId) {
      const idx = cards.findIndex((c) => c.id === selectedCardId);
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    }
  }, [selectedCardId, cards]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards.length]);

  const nextCard = () => {
    setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1));
  };

  const prevCard = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const cardWidth = 280;
  const cardGap = 16;
  const slideWidth = cardWidth + cardGap;

  // Drag physics tracking
  const dragX = useMotionValue(0);
  const dragThreshold = 50;

  const handleDragEnd = (_event: any, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -dragThreshold || velocity < -300) {
      // Swiped Left -> Next Card
      setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1));
    } else if (offset > dragThreshold || velocity > 300) {
      // Swiped Right -> Prev Card
      setActiveIndex((prev) => Math.max(0, prev - 1));
    }
    // Snap back
    dragX.set(0);
  };

  return (
    <div className="w-full flex flex-col items-center select-none py-4 relative">
      {/* Cards Container with Drag Track */}
      <div className="w-full overflow-hidden flex items-center justify-center h-[410px] relative px-6">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          style={{ x: dragX }}
          onDragEnd={handleDragEnd}
          animate={{ x: -activeIndex * slideWidth }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="flex cursor-grab active:cursor-grabbing absolute left-[calc(50%-140px)]"
        >
          {cards.map((card, i) => {
            const isActive = i === activeIndex;
            const isSelected = selectedCardId === card.id;

            return (
              <motion.div
                key={card.id}
                style={{ width: cardWidth, marginRight: i < cards.length - 1 ? cardGap : 0 }}
                animate={{
                  scale: isActive ? 1.05 : 0.9,
                  opacity: isActive ? 1 : 0.45,
                  y: isActive ? 0 : 15,
                  rotate: isActive ? 0 : (i < activeIndex ? -2 : 2),
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="shrink-0 relative"
              >
                <PsychologyCard
                  card={card}
                  isActive={isActive}
                  isSelected={isSelected}
                  onSelect={() => onSelectCard(card.id)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Manual Arrow Indicators (Accessibility) */}
      <div className="flex items-center space-x-8 pt-4">
        {/* Left Arrow Button */}
        <button
          onClick={prevCard}
          disabled={activeIndex === 0}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-purple-100 text-purple-650 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Previous card approach"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Selected Status Indicator dot labels */}
        <div className="flex items-center space-x-1.5" aria-hidden="true">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'bg-purple-600 w-4' : 'bg-purple-200'
              }`}
            />
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={nextCard}
          disabled={activeIndex === cards.length - 1}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-purple-100 text-purple-650 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Next card approach"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
