'use client';

import React from 'react';

interface QuestionProgressProps {
  current: number; // 1 to 5
  total: number;
}

export default function QuestionProgress({ current, total }: QuestionProgressProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full flex flex-col space-y-2 select-none">
      <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-purple-400">
        <span>Question {current} of {total}</span>
        <span>{Math.round(percentage)}% Complete</span>
      </div>
      
      {/* Progress Bar Container */}
      <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
        {/* Animated Bar */}
        <div
          className="h-full bg-purple-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
