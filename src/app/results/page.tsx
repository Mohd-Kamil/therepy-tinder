'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ResultsView from '@/components/ResultsView';
import ConfigError from '@/components/ConfigError';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getActiveSessionIds, fetchAssessmentState, clearActiveSession } from '@/lib/session';
import { Response, Participant, FinalReflection } from '@/types/assessment';

export default function ResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [finalReflection, setFinalReflection] = useState<FinalReflection | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Configuration check guard
  if (!isSupabaseConfigured) {
    return (
      <ConfigError message="Supabase configuration is required to retrieve and display results." />
    );
  }

  useEffect(() => {
    async function loadResults() {
      const { participantId, sessionId } = getActiveSessionIds();

      if (!participantId || !sessionId) {
        // No session found, send to landing
        router.push('/');
        return;
      }

      try {
        const state = await fetchAssessmentState(sessionId, participantId);
        if (!state) {
          router.push('/');
          return;
        }

        // Verify if session is fully complete (all 5 prompts answered)
        if (state.responses.length < 5) {
          router.push('/assessment');
          return;
        }

        setParticipant(state.participant);
        setResponses(state.responses);
        setFinalReflection(state.finalReflection);
      } catch (err) {
        console.error(err);
        setError('Failed to load results. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [router]);

  const handleRestart = () => {
    clearActiveSession();
    router.push('/');
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-4">
          <div className="animate-spin h-8 w-8 text-purple-600 rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="text-xs text-zinc-550 font-medium">Generating your reflection overview...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !participant) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-6 text-center">
          <div className="text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 text-xs">
            {error || 'Session results not found.'}
          </div>
          <button
            onClick={handleRestart}
            className="text-xs font-semibold text-purple-600 hover:text-purple-750 underline"
          >
            Restart Experience
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-grow flex flex-col overflow-y-auto">
        <ResultsView
          participant={participant}
          responses={responses}
          finalReflection={finalReflection}
          onRestart={handleRestart}
        />
      </div>
    </AppShell>
  );
}
