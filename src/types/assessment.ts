// TypeScript Interfaces for the Psychological Self-Reflection Assessment Application

export interface Participant {
  id: string; // UUID
  name: string;
  age: number | null;
  created_at: string; // ISO timestamp
  completed_at: string | null; // ISO timestamp
}

export interface Session {
  id: string; // UUID
  participant_id: string; // UUID
  started_at: string; // ISO timestamp
  completed_at: string | null; // ISO timestamp
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface Response {
  id: string; // UUID
  session_id: string; // UUID
  question_number: number; // 1 to 5
  question_text: string;
  selected_card: 'cbt' | 'behavioural' | 'psychodynamic' | 'humanistic' | 'systemic';
  reason: string | null;
  created_at: string; // ISO timestamp
}

export interface FinalReflection {
  id: string; // UUID
  session_id: string; // UUID
  reflection: string | null;
  created_at: string; // ISO timestamp
}

export interface Card {
  id: 'cbt' | 'behavioural' | 'psychodynamic' | 'humanistic' | 'systemic';
  name: string;
  tagline: string;
  image: string; // Asset path
}

export interface AssessmentState {
  participant: Participant | null;
  session: Session | null;
  responses: Response[];
  finalReflection: FinalReflection | null;
  currentQuestionIndex: number; // 0 to 4
  isSubmitting: boolean;
  error: string | null;
}
