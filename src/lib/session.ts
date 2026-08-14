import { supabase, isSupabaseConfigured } from './supabase';
import { Participant, Session, Response, FinalReflection } from '@/types/assessment';

const PARTICIPANT_KEY = 'psych_app_participant_id';
const SESSION_KEY = 'psych_app_session_id';

/**
 * Custom UUID generator fallback if crypto.randomUUID is not available (e.g. non-secure contexts)
 */
function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Standard RFC4122 version 4 UUID generator fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets the active participant and session IDs from localStorage
 */
export function getActiveSessionIds() {
  if (typeof window === 'undefined') {
    return { participantId: null, sessionId: null };
  }
  return {
    participantId: localStorage.getItem(PARTICIPANT_KEY),
    sessionId: localStorage.getItem(SESSION_KEY),
  };
}

/**
 * Clears the active session and participant IDs from localStorage
 */
export function clearActiveSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PARTICIPANT_KEY);
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Creates a new participant record in Supabase.
 */
export async function createParticipant(name: string, age: number | null): Promise<Participant> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Validate name (required, trim whitespace, max length 50)
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Participant name is required.');
  }
  if (trimmedName.length > 50) {
    throw new Error('Participant name must be 50 characters or less.');
  }

  // 2. Validate age (optional, numeric range 1-120)
  if (age !== null && (age < 1 || age > 120)) {
    throw new Error('Age must be between 1 and 120.');
  }

  const id = generateUUID();
  const now = new Date().toISOString();
  const participantData: Participant = {
    id,
    name: trimmedName,
    age,
    created_at: now,
    completed_at: null,
  };

  const { error } = await supabase
    .from('participants')
    .insert([participantData]);

  if (error) {
    console.error('Error in createParticipant:', error);
    throw new Error(`Failed to save participant: ${error.message}`);
  }

  return participantData;
}

/**
 * Creates a new session record in Supabase with status 'in_progress'.
 */
export async function createSession(participantId: string): Promise<Session> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const id = generateUUID();
  const now = new Date().toISOString();
  const sessionData: Session = {
    id,
    participant_id: participantId,
    started_at: now,
    completed_at: null,
    status: 'in_progress',
  };

  const { error } = await supabase
    .from('sessions')
    .insert([sessionData]);

  if (error) {
    console.error('Error in createSession:', error);
    throw new Error(`Failed to start session: ${error.message}`);
  }

  return sessionData;
}

/**
 * Saves a response in Supabase. Uses upsert to handle duplicate prevention.
 */
export async function saveResponse(
  responseData: Omit<Response, 'id' | 'created_at'>
): Promise<Response> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Validate session and participant tokens
  const { participantId } = getActiveSessionIds();
  if (!participantId) {
    throw new Error('Unauthorized: Active participant session not located.');
  }

  // 2. Validate question step number
  if (responseData.question_number < 1 || responseData.question_number > 5) {
    throw new Error('Question index must be between 1 and 5.');
  }

  // 3. Validate selected card approach type
  const allowedCards = ['cbt', 'behavioural', 'psychodynamic', 'humanistic', 'systemic'];
  if (!allowedCards.includes(responseData.selected_card.toLowerCase())) {
    throw new Error('Invalid psychological approach selection.');
  }

  // 4. Validate reason text character bounds (max 300)
  const trimmedReason = responseData.reason?.trim() || null;
  if (trimmedReason && trimmedReason.length > 300) {
    throw new Error('Reason reflection must not exceed 300 characters.');
  }

  // Call secure RPC that bypasses public select check and verifies participant ownership
  const { data, error } = await supabase.rpc('save_response_secure', {
    p_session_id: responseData.session_id,
    p_participant_id: participantId,
    p_question_number: responseData.question_number,
    p_question_text: responseData.question_text,
    p_selected_card: responseData.selected_card,
    p_reason: trimmedReason,
  });

  if (error) {
    console.error('Error in saveResponse RPC:', error);
    throw new Error(`Failed to save response: ${error.message}`);
  }

  return data as Response;
}

/**
 * Saves or updates the final reflection.
 */
export async function saveFinalReflection(
  sessionId: string,
  reflection: string | null
): Promise<FinalReflection> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Validate session and participant tokens
  const { participantId } = getActiveSessionIds();
  if (!participantId) {
    throw new Error('Unauthorized: Active participant session not located.');
  }

  // 2. Validate reflection character length bounds (max 500)
  const trimmedReflection = reflection?.trim() || null;
  if (trimmedReflection && trimmedReflection.length > 500) {
    throw new Error('Final reflection must not exceed 500 characters.');
  }

  // Call secure RPC that bypasses public select check and verifies participant ownership
  const { data, error } = await supabase.rpc('save_final_reflection_secure', {
    p_session_id: sessionId,
    p_participant_id: participantId,
    p_reflection: trimmedReflection,
  });

  if (error) {
    console.error('Error in saveFinalReflection RPC:', error);
    throw new Error(`Failed to save final reflection: ${error.message}`);
  }

  return data as FinalReflection;
}

/**
 * Completes both participant and session records with timestamp.
 */
export async function completeSession(sessionId: string, participantId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // Call server-side secure transaction function to close the session
  const { error } = await supabase.rpc('complete_session_secure', {
    p_session_id: sessionId,
    p_participant_id: participantId,
  });

  if (error) {
    console.error('Error in completeSession RPC:', error);
    throw new Error(`Failed to complete session: ${error.message}`);
  }
}

/**
 * Recovers session state from Supabase using the SECURE RPC database owner function.
 * Fulfills recovery, security, and RLS requirements.
 */
export async function recoverSession(
  sessionId: string,
  participantId: string
): Promise<{
  participant: Participant;
  session: Session;
  responses: Response[];
  finalReflection: FinalReflection | null;
} | null> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.rpc('get_assessment_state', {
    p_session_id: sessionId,
    p_participant_id: participantId,
  });

  if (error) {
    console.error('Error recovering session:', error);
    throw new Error(`Session recovery failed: ${error.message}`);
  }

  if (!data || !data.participant || !data.session) {
    return null;
  }

  return {
    participant: data.participant as Participant,
    session: data.session as Session,
    responses: (data.responses || []) as Response[],
    finalReflection: data.finalReflection as FinalReflection | null,
  };
}

/**
 * Returns session results. Reuses recoverSession.
 */
export async function getSessionResults(
  sessionId: string,
  participantId: string
): Promise<{
  participant: Participant;
  responses: Response[];
  finalReflection: FinalReflection | null;
}> {
  const state = await recoverSession(sessionId, participantId);
  if (!state) {
    throw new Error('Assessment results could not be located.');
  }
  return {
    participant: state.participant,
    responses: state.responses,
    finalReflection: state.finalReflection,
  };
}

/* =========================================================================
   HIGH-LEVEL API ADAPTERS FOR COMPATIBLE VIEW COMPONENTS
   ========================================================================= */

export async function startAssessmentSession(
  name: string,
  age: number | null
): Promise<{ participant: Participant; session: Session }> {
  // 1. Create Participant
  const participant = await createParticipant(name, age);
  // 2. Create Session
  const session = await createSession(participant.id);

  // 3. Cache IDs in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(PARTICIPANT_KEY, participant.id);
    localStorage.setItem(SESSION_KEY, session.id);
  }

  return { participant, session };
}

export async function fetchAssessmentState(
  sessionId: string,
  participantId: string
) {
  return recoverSession(sessionId, participantId);
}

export async function saveQuestionResponse(
  responseData: Omit<Response, 'id' | 'created_at'>
): Promise<Response> {
  return saveResponse(responseData);
}

export async function completeAssessmentSession(
  sessionId: string,
  participantId: string
): Promise<void> {
  return completeSession(sessionId, participantId);
}
