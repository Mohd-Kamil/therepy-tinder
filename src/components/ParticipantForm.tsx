'use client';

import React, { useState } from 'react';
import Button from './Button';

interface ParticipantFormProps {
  onSubmit: (name: string, age: number | null) => void;
  isLoading: boolean;
}

export default function ParticipantForm({ onSubmit, isLoading }: ParticipantFormProps) {
  const [name, setName] = useState('');
  const [ageStr, setAgeStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name to proceed.');
      return;
    }

    let parsedAge: number | null = null;
    if (ageStr.trim() !== '') {
      parsedAge = parseInt(ageStr, 10);
      if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
        setError('Please enter a valid age between 1 and 120, or leave it blank.');
        return;
      }
    }

    onSubmit(trimmedName, parsedAge);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-6">
      {error && (
        <div className="text-xs text-red-500 bg-red-50/80 px-4 py-2.5 rounded-xl border border-red-100 animate-fade-in">
          {error}
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <label htmlFor="name-input" className="text-xs font-semibold uppercase tracking-wider text-purple-750">
          Your Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          disabled={isLoading}
          maxLength={50}
          className="w-full px-5 py-3.5 bg-white border border-purple-100 rounded-2xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-zinc-800 transition duration-200 shadow-sm"
          required
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label htmlFor="age-input" className="text-xs font-semibold uppercase tracking-wider text-purple-750">
          Age <span className="text-zinc-400 font-normal">(Optional)</span>
        </label>
        <input
          id="age-input"
          type="number"
          value={ageStr}
          onChange={(e) => setAgeStr(e.target.value)}
          placeholder="e.g. 28"
          disabled={isLoading}
          min={1}
          max={120}
          className="w-full px-5 py-3.5 bg-white border border-purple-100 rounded-2xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-zinc-800 transition duration-200 shadow-sm"
        />
      </div>

      <div className="pt-4">
        <Button type="submit" isLoading={isLoading}>
          Start
        </Button>
      </div>
    </form>
  );
}
