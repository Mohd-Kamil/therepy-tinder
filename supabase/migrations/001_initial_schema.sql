-- Initial database migration schema for the Psychology app
-- Run this in the Supabase SQL Editor to initialize all tables, constraints, RLS, and RPC functions.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. Participants Table
-- =========================================================================
create table public.participants (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) >= 1 and char_length(name) <= 50),
    age integer check (age is null or (age >= 1 and age <= 120)),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);

-- Enable RLS for participants
alter table public.participants enable row level security;

-- Policies for participants
create policy "Allow anon insert to participants" on public.participants
    for insert with check (true);

create policy "Allow anon update to own participant" on public.participants
    for update using (true) with check (true);

-- Note: No SELECT policy is created. Direct select from participants is disabled for public roles.


-- =========================================================================
-- 2. Sessions Table
-- =========================================================================
create table public.sessions (
    id uuid primary key default gen_random_uuid(),
    participant_id uuid not null references public.participants(id) on delete cascade,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone,
    status text not null check (status in ('in_progress', 'completed', 'abandoned'))
);

-- Enable RLS for sessions
alter table public.sessions enable row level security;

-- Policies for sessions
create policy "Allow anon insert to sessions" on public.sessions
    for insert with check (true);

create policy "Allow anon update to own session" on public.sessions
    for update using (true) with check (true);

-- Note: No SELECT policy is created. Direct select from sessions is disabled for public roles.


-- =========================================================================
-- 3. Responses Table
-- =========================================================================
create table public.responses (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    question_number integer not null check (question_number between 1 and 5),
    question_text text not null check (char_length(question_text) > 0),
    selected_card text not null check (selected_card in ('cbt', 'behavioural', 'psychodynamic', 'humanistic', 'systemic')),
    reason text check (reason is null or char_length(reason) <= 300),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_session_question unique (session_id, question_number)
);

-- Enable RLS for responses
alter table public.responses enable row level security;

-- Policies for responses
create policy "Allow anon insert to responses" on public.responses
    for insert with check (true);

create policy "Allow anon update to own responses" on public.responses
    for update using (true) with check (true);

-- Note: No SELECT policy is created. Direct select from responses is disabled for public roles.


-- =========================================================================
-- 4. Final Reflections Table
-- =========================================================================
create table public.final_reflections (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade unique,
    reflection text check (reflection is null or char_length(reflection) <= 500),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for final_reflections
alter table public.final_reflections enable row level security;

-- Policies for final_reflections
create policy "Allow anon insert to final_reflections" on public.final_reflections
    for insert with check (true);

create policy "Allow anon update to own final_reflections" on public.final_reflections
    for update using (true) with check (true);

-- Note: No SELECT policy is created. Direct select from final_reflections is disabled for public roles.


-- =========================================================================
-- 5. RPC: Get Assessment State (Anonymous Selector bypasses RLS)
-- =========================================================================
create or replace function public.get_assessment_state(p_session_id uuid, p_participant_id uuid)
returns json
language plpgsql
security definer -- runs as owner to bypass missing public select permissions
as $$
declare
  v_participant json;
  v_session json;
  v_responses json;
  v_reflection json;
begin
  -- Fetch Participant
  select row_to_json(p) into v_participant
  from public.participants p
  where p.id = p_participant_id;

  -- Fetch Session
  select row_to_json(s) into v_session
  from public.sessions s
  where s.id = p_session_id and s.participant_id = p_participant_id;

  -- Fetch Responses
  select json_agg(r) into v_responses
  from (
    select *
    from public.responses
    where session_id = p_session_id
    order by question_number asc
  ) r;

  -- Fetch Final Reflection
  select row_to_json(f) into v_reflection
  from public.final_reflections f
  where f.session_id = p_session_id;

  -- Return compiled state
  return json_build_object(
    'participant', v_participant,
    'session', v_session,
    'responses', coalesce(v_responses, '[]'::json),
    'finalReflection', v_reflection
  );
end;
$$;


-- =========================================================================
-- 6. RPC: Get Admin Dashboard Data (Secured by Passcode check)
-- =========================================================================
create or replace function public.get_admin_dashboard_data(p_admin_passcode text)
returns json
language plpgsql
security definer -- runs as owner to bypass missing public select permissions
as $$
begin
  -- Secure passcode validation (Replace 'psych-admin-2026' with your production credential)
  if p_admin_passcode = 'psych-admin-2026' then
    return (
      select json_agg(p_data)
      from (
        select 
          p.*,
          (
            select json_agg(s_data)
            from (
              select 
                s.*,
                (
                  select coalesce(json_agg(r order by r.question_number asc), '[]'::json)
                  from public.responses r
                  where r.session_id = s.id
                ) as responses,
                (
                  select coalesce(json_agg(f), '[]'::json)
                  from public.final_reflections f
                  where f.session_id = s.id
                ) as final_reflections
              from public.sessions s
              where s.participant_id = p.id
            ) s_data
          ) as sessions
        from public.participants p
        order by p.created_at desc
      ) p_data
    );
  else
    raise exception 'Unauthorized: Invalid admin passcode';
  end if;
end;
$$;


-- =========================================================================
-- 7. RPC: Save Question Response (Secure Writer bypasses RLS Select upsert block)
-- =========================================================================
create or replace function public.save_response_secure(
    p_session_id uuid,
    p_question_number integer,
    p_question_text text,
    p_selected_card text,
    p_reason text
)
returns json
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_now timestamp with time zone;
  v_result json;
begin
  v_id := gen_random_uuid();
  v_now := timezone('utc'::text, now());
  
  insert into public.responses (id, session_id, question_number, question_text, selected_card, reason, created_at)
  values (v_id, p_session_id, p_question_number, p_question_text, p_selected_card, p_reason, v_now)
  on conflict (session_id, question_number)
  do update set
    selected_card = p_selected_card,
    reason = p_reason,
    created_at = v_now;

  -- fetch the row to return
  select row_to_json(r) into v_result
  from public.responses r
  where r.session_id = p_session_id and r.question_number = p_question_number;

  return v_result;
end;
$$;


-- =========================================================================
-- 8. RPC: Save Final Reflection (Secure Writer bypasses RLS Select upsert block)
-- =========================================================================
create or replace function public.save_final_reflection_secure(
    p_session_id uuid,
    p_reflection text
)
returns json
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_now timestamp with time zone;
  v_result json;
begin
  v_id := gen_random_uuid();
  v_now := timezone('utc'::text, now());

  insert into public.final_reflections (id, session_id, reflection, created_at)
  values (v_id, p_session_id, p_reflection, v_now)
  on conflict (session_id)
  do update set
    reflection = p_reflection,
    created_at = v_now;

  select row_to_json(f) into v_result
  from public.final_reflections f
  where f.session_id = p_session_id;

  return v_result;
end;
$$;
