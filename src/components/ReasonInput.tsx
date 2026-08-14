'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface ReasonInputProps {
  selectedCardName: string;
  onContinue: (reason: string) => void;
  isLoading: boolean;
  initialReason?: string;
}

export default function ReasonInput({
  selectedCardName,
  onContinue,
  isLoading,
  initialReason = '',
}: ReasonInputProps) {
  const [reason, setReason] = useState(initialReason);

  // Reset or set reason when initialReason or card changes
  useEffect(() => {
    setReason(initialReason);
  }, [initialReason, selectedCardName]);

  const handleContinue = () => {
    onContinue(reason.trim());
  };

  return (
    <div className="w-full bg-purple-50/50 border-t border-purple-100 p-6 flex flex-col space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-zinc-800">
          Match Confirmed: <span className="text-purple-700">{selectedCardName}</span>
        </h4>
        <p className="text-xs text-zinc-500">
          Why did this feel like the best match?
        </p>
      </div>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Type your reflection here (optional)..."
        maxLength={300}
        rows={3}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-white border border-purple-100 rounded-2xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-sm text-zinc-800 transition duration-200 shadow-sm resize-none"
      />

      <div className="flex justify-between items-center text-[10px] text-zinc-450 px-1">
        <span>Optional reflection</span>
        <span>{reason.length}/300 chars</span>
      </div>

      <Button onClick={handleContinue} isLoading={isLoading}>
        Continue
      </Button>
    </div>
  );
}
