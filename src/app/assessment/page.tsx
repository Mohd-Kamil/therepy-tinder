'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import CardCarousel from '@/components/CardCarousel';
import ConfigError from '@/components/ConfigError';
import Button from '@/components/Button';
import { isSupabaseConfigured } from '@/lib/supabase';
import { questions } from '@/lib/questions';
import { cards } from '@/lib/cards';
import { getCardIcon } from '@/components/PsychologyCard';
import {
  getActiveSessionIds,
  fetchAssessmentState,
  saveQuestionResponse,
  saveFinalReflection,
  completeAssessmentSession,
} from '@/lib/session';
import { Response, Participant, Session, FinalReflection } from '@/types/assessment';
import { ArrowLeft, ArrowRight, Heart, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Database entities
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  
  // Wizard state machine
  const [currentIdx, setCurrentIdx] = useState(0); 
  const [qStep, setQStep] = useState<'browse' | 'confirm' | 'reason'>('browse');
  const [summaryStep, setSummaryStep] = useState<'list' | 'reflection'>('list');
  
  // Selection/input bindings
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [finalReflectionText, setFinalReflectionText] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration check
  if (!isSupabaseConfigured) {
    return (
      <ConfigError message="Supabase configuration is required to save response records." />
    );
  }

  // Load and recover session state
  useEffect(() => {
    async function loadSession() {
      const { participantId, sessionId } = getActiveSessionIds();

      if (!participantId || !sessionId) {
        router.push('/start');
        return;
      }

      try {
        const state = await fetchAssessmentState(sessionId, participantId);
        if (!state) {
          router.push('/start');
          return;
        }

        setParticipant(state.participant);
        setSession(state.session);
        setResponses(state.responses);

        const answeredCount = state.responses.length;
        if (answeredCount < 5) {
          setCurrentIdx(answeredCount);
          setQStep('browse');
        } else {
          if (state.session.status === 'completed' && state.finalReflection) {
            router.push('/results');
          } else {
            setCurrentIdx(5);
            setSummaryStep('list');
          }
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch session. Please refresh or restart.');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [router]);

  // Back button routing
  const handleBack = () => {
    setError(null);
    if (currentIdx < 5) {
      if (qStep === 'reason') {
        setQStep('confirm');
      } else if (qStep === 'confirm') {
        setSelectedCardId(null);
        setQStep('browse');
      } else if (qStep === 'browse') {
        if (currentIdx > 0) {
          const prevIdx = currentIdx - 1;
          const prevResp = responses.find((r) => r.question_number === prevIdx + 1);
          setCurrentIdx(prevIdx);
          setSelectedCardId(prevResp?.selected_card || null);
          setReasonText(prevResp?.reason || '');
          setQStep('reason');
        } else {
          router.push('/start');
        }
      }
    } else {
      if (summaryStep === 'reflection') {
        setSummaryStep('list');
      } else {
        const prevIdx = 4;
        const prevResp = responses.find((r) => r.question_number === 5);
        setCurrentIdx(prevIdx);
        setSelectedCardId(prevResp?.selected_card || null);
        setReasonText(prevResp?.reason || '');
        setQStep('reason');
      }
    }
  };

  const handleCardCarouselSelect = (cardId: string) => {
    setSelectedCardId(cardId);
    setQStep('confirm');
  };

  const handleConfirmCard = () => {
    const existingReason = responses.find((r) => r.question_number === currentIdx + 1)?.reason || '';
    setReasonText(existingReason);
    setQStep('reason');
  };

  const handleSaveResponse = async (skipReason = false) => {
    if (!session || !selectedCardId) return;

    setActionLoading(true);
    setError(null);

    const questionText = questions[currentIdx];
    const finalReason = skipReason ? null : reasonText.trim();

    try {
      const savedResponse = await saveQuestionResponse({
        session_id: session.id,
        question_number: currentIdx + 1,
        question_text: questionText,
        selected_card: selectedCardId as any,
        reason: finalReason || null,
      });

      setResponses((prev) => {
        const next = [...prev];
        const existingIdx = next.findIndex((r) => r.question_number === currentIdx + 1);
        if (existingIdx !== -1) {
          next[existingIdx] = savedResponse;
        } else {
          next.push(savedResponse);
        }
        return next;
      });

      setSelectedCardId(null);
      setReasonText('');
      setQStep('browse');
      setCurrentIdx((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setError('Could not save response. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteReflection = async () => {
    if (!session || !participant) return;

    setActionLoading(true);
    setError(null);

    try {
      await saveFinalReflection(session.id, finalReflectionText.trim() || null);
      await completeAssessmentSession(session.id, participant.id);
      router.push('/results');
    } catch (err: any) {
      console.error(err);
      setError('Failed to complete. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-4 bg-gradient-to-b from-[#faf8fd] via-[#f3ecf9] to-[#faf8fd]">
          <RefreshCw className="animate-spin h-7 w-7 text-purple-500" />
          <p className="text-xs text-zinc-500 font-semibold">Resuming your reflection space...</p>
        </div>
      </AppShell>
    );
  }

  const getStepRatioText = () => {
    if (currentIdx < 3) return '3 / 6';
    if (currentIdx < 5) return '4 / 6';
    return '5 / 6';
  };

  const isAssessmentFinished = currentIdx >= 5;
  const currentPrompt = !isAssessmentFinished ? questions[currentIdx] : null;
  const selectedCardInfo = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;

  return (
    <AppShell>
      <div className="flex-1 flex flex-col justify-between select-none relative h-full bg-gradient-to-b from-[#faf8fd] via-[#f3ecf9] to-[#faf8fd]">
        
        {/* Header Bar */}
        <div className="pt-2 flex items-center justify-between px-6 pb-2 border-b border-purple-100 bg-[#faf8fd]/80 backdrop-blur-md sticky top-0 z-30">
          <button 
            onClick={handleBack}
            className="p-2 rounded-full border border-purple-100 bg-white text-[#6355d8] hover:bg-purple-50 transition outline-none"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
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
            {getStepRatioText()}
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-4 text-xs text-red-650 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-y-auto">
          {!isAssessmentFinished ? (
            /* =====================================================================
               QUESTIONS 1 TO 5 (Light Lavender-Pink theme)
               ===================================================================== */
            <div className="flex-1 flex flex-col justify-between h-full">
              
              {qStep === 'browse' && (
                /* -----------------------------------------------------------------
                   SUB-STEP A: CAROUSEL BROWSING (Screen 5)
                   ----------------------------------------------------------------- */
                <div className="flex-1 flex flex-col justify-between h-full animate-fade-in">
                  <div className="p-6 space-y-5">
                    {/* Header Question Tracker & Connected progress dots */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-[#6355d8]">
                        <span>Question {currentIdx + 1} of 5</span>
                      </div>
                      
                      {/* Connected Dot track */}
                      <div className="flex items-center justify-center space-x-2 py-1 select-none">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <React.Fragment key={idx}>
                            <div className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                              idx <= currentIdx
                                ? 'bg-[#9c66e4] border-[#9c66e4]'
                                : 'bg-white border-purple-200 shadow-sm'
                            }`} />
                            {idx < 4 && (
                              <div className={`h-[1.5px] w-5 transition-colors duration-300 ${
                                idx < currentIdx ? 'bg-[#9c66e4]' : 'bg-purple-200/50'
                              }`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Question text block */}
                    <div className="text-center py-2 space-y-3">
                      <h3 className="font-serif text-3xl font-extrabold text-[#1c0e3a] leading-tight italic px-2">
                        &ldquo;{currentPrompt}&rdquo;
                      </h3>
                      <p className="text-[#4a3b68] text-xs font-semibold tracking-wide">
                        Which approach feels most relevant to you right now?
                      </p>
                    </div>
                  </div>

                  {/* Card Deck Carousel */}
                  <div className="py-2">
                    <CardCarousel
                      cards={cards}
                      selectedCardId={selectedCardId}
                      onSelectCard={handleCardCarouselSelect}
                    />
                  </div>

                  {/* Browse hint */}
                  <div className="pb-8 text-center text-xs text-[#5c4d7c] font-semibold italic">
                    Browse or swipe to explore
                  </div>
                </div>
              )}

              {qStep === 'confirm' && selectedCardInfo && (
                /* -----------------------------------------------------------------
                   SUB-STEP B: CARD CONFIRMATION (Screen 6)
                   ----------------------------------------------------------------- */
                <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in h-full">
                  <div className="text-center space-y-2 pt-2">
                    <h3 className="font-serif text-2xl font-bold text-[#1c0e3a]">
                      Choose what resonates
                    </h3>
                    <p className="text-xs text-[#4a3b68] font-semibold">
                      Does this approach match your statement?
                    </p>
                  </div>

                  {/* Card visual preview with checkmark badge */}
                  <div className="my-auto flex justify-center py-6">
                    <div className="relative border-2 border-purple-100 bg-white rounded-[32px] overflow-hidden shadow-xl p-0.5 w-[280px] h-[380px]">
                      {/* Checkmark badge */}
                      <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2 shadow-lg z-30 border-2 border-white">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>

                      {/* Image */}
                      <div className="w-full h-[52%] relative bg-zinc-50">
                        <Image
                          src={selectedCardInfo.image}
                          alt={selectedCardInfo.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Content details */}
                      <div className="p-6 h-[48%] flex flex-col justify-between bg-white">
                        <div className="flex items-start justify-between space-x-2">
                          <div className="space-y-1 text-left">
                            <span className="text-[9px] tracking-[0.2em] font-bold text-purple-650 uppercase">
                              APPROACH
                            </span>
                            <h3 className="font-serif text-2xl font-bold text-zinc-900 leading-none">
                              {selectedCardInfo.name}
                            </h3>
                          </div>
                          <div className="p-1.5 bg-purple-50 rounded-xl border border-purple-100/50">
                            {getCardIcon(selectedCardInfo.id, "h-4 w-4")}
                          </div>
                        </div>

                        <p className="text-zinc-500 text-xs italic leading-relaxed pr-2 text-left">
                          &ldquo;{selectedCardInfo.tagline}&rdquo;
                        </p>

                        <div className="flex items-center space-x-1.5 justify-center py-1">
                          {cards.map((c, i) => (
                            <div 
                              key={c.id} 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                c.id === selectedCardInfo.id ? 'w-3.5 bg-purple-500' : 'w-1.5 bg-zinc-200'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pb-8 space-y-3">
                    <button
                      onClick={handleConfirmCard}
                      className="w-full py-4 bg-[#6355d8] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/15 hover:bg-[#5244c7] transition active:scale-[0.99]"
                    >
                      This Feels Right ✓
                    </button>
                  </div>
                </div>
              )}

              {qStep === 'reason' && selectedCardInfo && (
                /* -----------------------------------------------------------------
                   SUB-STEP C: REFLECTION INPUT (Screen 7)
                   ----------------------------------------------------------------- */
                <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in h-full">
                  <div className="space-y-4 pt-2">
                    <div className="text-center space-y-2">
                      <h3 className="font-serif text-2xl font-bold text-[#1c0e3a]">
                        Why did you choose this?
                      </h3>
                      <p className="text-xs text-[#4a3b68] font-semibold max-w-xs mx-auto">
                        Your perspective helps make this experience better.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3.5 bg-white border border-purple-100 rounded-2xl p-4 shadow-sm max-w-sm mx-auto w-full">
                      <div className="p-2 bg-purple-50 border border-purple-100 rounded-xl">
                        {getCardIcon(selectedCardInfo.id)}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#1c0e3a]">{selectedCardInfo.name}</p>
                        <p className="text-[10px] text-[#5c4d7c] font-semibold leading-normal italic">&ldquo;{selectedCardInfo.tagline}&rdquo;</p>
                      </div>
                    </div>
                  </div>

                  {/* Input Card Container */}
                  <div className="my-auto max-w-sm w-full mx-auto space-y-2">
                    <textarea
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      placeholder="I feel like my thoughts get out of control and I need help understanding them better."
                      maxLength={300}
                      rows={5}
                      disabled={actionLoading}
                      className="w-full px-5 py-4 bg-white border border-purple-100 rounded-3xl focus:border-purple-550 focus:ring-1 focus:ring-purple-400 focus:outline-none text-sm text-[#1c0e3a] placeholder-zinc-400 transition shadow-sm resize-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-[#5c4d7c] font-semibold px-1">
                      <span>Optional reflection</span>
                      <span>{reasonText.length}/300 chars</span>
                    </div>
                  </div>

                  <div className="pb-8 space-y-3">
                    <button
                      onClick={() => handleSaveResponse(false)}
                      disabled={actionLoading}
                      className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/15 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center space-x-2 outline-none disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <span>Continue to Next</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleSaveResponse(true)}
                      disabled={actionLoading}
                      className="w-full text-center text-xs font-bold text-[#5c4d7c] hover:text-[#6355d8] transition py-1 underline"
                    >
                      You can skip this if you prefer
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* =====================================================================
               STEP 5 (5 / 6): REVIEW & FINAL REFLECTION (Light theme)
               ===================================================================== */
            <div className="flex-grow flex flex-col h-full">
              {summaryStep === 'list' ? (
                /* -------------------------------------------------------------
                   SUB-STEP D: ASSESSMENT SUMMARY LIST (Screen 9)
                   ------------------------------------------------------------- */
                <div className="flex-grow flex flex-col justify-between p-6 animate-fade-in h-full">
                  <div className="space-y-4 pt-2">
                    <div className="text-center space-y-2">
                      <span className="text-[9px] font-bold text-[#6355d8] bg-purple-150/40 px-3.5 py-1 rounded-full border border-purple-200/30 inline-block font-mono tracking-wide">
                        SUMMARY REVIEW
                      </span>
                      <h3 className="font-serif text-3xl font-bold text-[#1c0e3a]">
                        Review your picks
                      </h3>
                      <p className="text-xs text-[#5c4d7c] font-semibold max-w-xs mx-auto leading-relaxed">
                        Here are the psychological approaches you selected for each real-life statement.
                      </p>
                    </div>

                    {/* Responses list */}
                    <div className="space-y-3 pt-2 max-w-sm w-full mx-auto">
                      {responses.sort((a,b) => a.question_number - b.question_number).map((res) => {
                        const card = cards.find((c) => c.id === res.selected_card);
                        return (
                          <div 
                            key={res.id}
                            className="flex items-center justify-between p-4 bg-white border border-purple-100 rounded-2xl shadow-sm"
                          >
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="h-6 w-6 rounded-full bg-[#6355d8] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                                {res.question_number}
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-xs text-[#1c0e3a] truncate font-bold pr-2 leading-relaxed">
                                  &ldquo;{res.question_text}&rdquo;
                                </p>
                                <span className="inline-flex items-center space-x-1 mt-0.5 text-[9px] font-bold tracking-wider uppercase text-[#6355d8]">
                                  {getCardIcon(res.selected_card, "h-2.5 w-2.5")}
                                  <span>{card?.name || res.selected_card}</span>
                                </span>
                              </div>
                            </div>

                            {/* Checkmark icon badge */}
                            <div className="h-5 w-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-200 shrink-0 ml-2">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pb-8 pt-4">
                    <button
                      onClick={() => setSummaryStep('reflection')}
                      className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/15 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center space-x-2"
                    >
                      <span>Final Reflection</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* -------------------------------------------------------------
                   SUB-STEP E: FINAL REFLECTION INPUT (Screen 10)
                   ------------------------------------------------------------- */
                <div className="flex-grow flex flex-col justify-between p-6 animate-fade-in h-full">
                  <div className="space-y-4 pt-2">
                    {/* Heart icon */}
                    <div className="flex justify-center">
                      <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-purple-100/70 border border-purple-200/40 text-[#6355d8]">
                        <Heart className="h-6 w-6" fill="currentColor" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="font-serif text-3xl font-bold text-[#1c0e3a]">
                        One last reflection
                      </h3>
                      <p className="text-xs text-[#5c4d7c] font-semibold max-w-xs mx-auto leading-relaxed">
                        Looking back at your choices, why do you think these approaches felt relevant to you?
                      </p>
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="my-auto max-w-sm w-full mx-auto space-y-2">
                    <textarea
                      value={finalReflectionText}
                      onChange={(e) => setFinalReflectionText(e.target.value)}
                      placeholder="I think each of these areas connect to different parts of my life. I want to understand myself better and create real change."
                      maxLength={500}
                      rows={6}
                      disabled={actionLoading}
                      className="w-full px-5 py-4 bg-white border border-purple-100 rounded-3xl focus:border-purple-550 focus:ring-1 focus:ring-purple-400 focus:outline-none text-sm text-[#1c0e3a] placeholder-zinc-400 transition shadow-sm resize-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-[#5c4d7c] font-semibold px-1">
                      <span>Optional reflection</span>
                      <span>{finalReflectionText.length}/500 chars</span>
                    </div>
                  </div>

                  <div className="pb-8 pt-4">
                    <button
                      onClick={handleCompleteReflection}
                      disabled={actionLoading}
                      className="w-full py-4 bg-gradient-to-r from-[#6355d8] to-[#9c66e4] text-white rounded-full text-sm font-semibold shadow-lg shadow-purple-900/15 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center space-x-2"
                    >
                      {actionLoading ? (
                        <span>Completing journey...</span>
                      ) : (
                        <span>Complete &amp; See Results ✨</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
