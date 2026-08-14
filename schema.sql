-- Database Schema for Psychological Self-Reflection Web App
-- Prepare application for Supabase PostgreSQL

-- Enable UUID extension (usually enabled by default in Supabase)
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. Participants Table
-- =========================================================================
create table public.participants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    age integer check (age > 0 and age < 150),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);

-- Enable RLS for participants
alter table public.participants enable row level security;

-- Policies for participants
create policy "Allow public inserts to participants" on public.participants
    for insert with check (true);

create policy "Allow public updates to participants" on public.participants
    for update using (true);

create policy "Allow public selects from participants" on public.participants
    for select using (true);

-- =========================================================================
-- 2. Sessions Table
-- =========================================================================
create table public.sessions (
    id uuid primary key default gen_random_uuid(),
    participant_id uuid not null references public.participants(id) on delete cascade,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone,
    status text not null check (status in ('started', 'completed', 'abandoned'))
);

-- Enable RLS for sessions
alter table public.sessions enable row level security;

-- Policies for sessions
create policy "Allow public inserts to sessions" on public.sessions
    for insert with check (true);

create policy "Allow public updates to sessions" on public.sessions
    for update using (true);

create policy "Allow public selects from sessions" on public.sessions
    for select using (true);

-- =========================================================================
-- 3. Responses Table
-- =========================================================================
create table public.responses (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    question_number integer not null check (question_number between 1 and 5),
    question_text text not null,
    selected_card text not null check (selected_card in ('cbt', 'behavioural', 'psychodynamic', 'humanistic', 'systemic')),
    reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_session_question unique (session_id, question_number)
);

-- Enable RLS for responses
alter table public.responses enable row level security;

-- Policies for responses
create policy "Allow public inserts to responses" on public.responses
    for insert with check (true);

create policy "Allow public selects from responses" on public.responses
    for select using (true);

-- =========================================================================
-- 4. Final Reflections Table
-- =========================================================================
create table public.final_reflections (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade unique,
    reflection text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for final_reflections
alter table public.final_reflections enable row level security;

-- Policies for final_reflections
create policy "Allow public inserts to final_reflections" on public.final_reflections
    for insert with check (true);

create policy "Allow public selects from final_reflections" on public.final_reflections
    for select using (true);
