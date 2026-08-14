-- Hardening Migration Schema
-- Revokes public write access, enforces ownership validation, and prevents RLS updates on key tables.

-- =========================================================================
-- 1. Revoke public direct UPDATE and write policies
-- =========================================================================

-- Drop unsafe update policies on participants and sessions
drop policy if exists "Allow anon update to own participant" on public.participants;
drop policy if exists "Allow anon update to own session" on public.sessions;

-- Drop all public direct write access on responses and final_reflections
drop policy if exists "Allow anon insert to responses" on public.responses;
drop policy if exists "Allow anon update to own responses" on public.responses;
drop policy if exists "Allow anon insert to final_reflections" on public.final_reflections;
drop policy if exists "Allow anon update to own final_reflections" on public.final_reflections;

-- Note: The only active public policies left are direct INSERT on participants and sessions.
-- Users can register and start a session, but all updates and response saves must occur
-- strictly through validated RPC functions.


-- =========================================================================
-- 2. Hardened RPC: Save Response (with Ownership Verification)
-- =========================================================================
create or replace function public.save_response_secure(
    p_session_id uuid,
    p_participant_id uuid, -- Required validation parameter
    p_question_number integer,
    p_question_text text,
    p_selected_card text,
    p_reason text
)
returns json
language plpgsql
security definer -- runs as owner
as $$
declare
  v_id uuid;
  v_now timestamp with time zone;
  v_result json;
begin
  -- Validate session ownership
  if not exists (
    select 1 
    from public.sessions 
    where id = p_session_id and participant_id = p_participant_id
  ) then
    raise exception 'Unauthorized: Session and participant token mismatch.';
  end if;

  -- Validate card enumeration type check
  if p_selected_card not in ('cbt', 'behavioural', 'psychodynamic', 'humanistic', 'systemic') then
    raise exception 'Invalid selected card approach: %', p_selected_card;
  end if;

  -- Validate question steps constraint
  if p_question_number not between 1 and 5 then
    raise exception 'Question step must be between 1 and 5. Given: %', p_question_number;
  end if;

  -- Trim whitespace and validate length limits
  if p_reason is not null and char_length(trim(p_reason)) > 300 then
    raise exception 'Reason reflection text exceeds the 300 character limit.';
  end if;

  v_id := gen_random_uuid();
  v_now := timezone('utc'::text, now());
  
  insert into public.responses (id, session_id, question_number, question_text, selected_card, reason, created_at)
  values (v_id, p_session_id, p_question_number, p_question_text, p_selected_card, trim(p_reason), v_now)
  on conflict (session_id, question_number)
  do update set
    selected_card = p_selected_card,
    reason = trim(p_reason),
    created_at = v_now;

  -- Return target row as JSON
  select row_to_json(r) into v_result
  from public.responses r
  where r.session_id = p_session_id and r.question_number = p_question_number;

  return v_result;
end;
$$;


-- =========================================================================
-- 3. Hardened RPC: Save Final Reflection (with Ownership Verification)
-- =========================================================================
create or replace function public.save_final_reflection_secure(
    p_session_id uuid,
    p_participant_id uuid, -- Required validation parameter
    p_reflection text
)
returns json
language plpgsql
security definer -- runs as owner
as $$
declare
  v_id uuid;
  v_now timestamp with time zone;
  v_result json;
begin
  -- Validate session ownership
  if not exists (
    select 1 
    from public.sessions 
    where id = p_session_id and participant_id = p_participant_id
  ) then
    raise exception 'Unauthorized: Session and participant token mismatch.';
  end if;

  -- Trim whitespace and validate length limit
  if p_reflection is not null and char_length(trim(p_reflection)) > 500 then
    raise exception 'Final reflection text exceeds the 500 character limit.';
  end if;

  v_id := gen_random_uuid();
  v_now := timezone('utc'::text, now());

  insert into public.final_reflections (id, session_id, reflection, created_at)
  values (v_id, p_session_id, trim(p_reflection), v_now)
  on conflict (session_id)
  do update set
    reflection = trim(p_reflection),
    created_at = v_now;

  select row_to_json(f) into v_result
  from public.final_reflections f
  where f.session_id = p_session_id;

  return v_result;
end;
$$;


-- =========================================================================
-- 4. Hardened RPC: Complete Session (Server-side timestamps)
-- =========================================================================
create or replace function public.complete_session_secure(
    p_session_id uuid,
    p_participant_id uuid
)
returns boolean
language plpgsql
security definer -- runs as owner to update participants and sessions
as $$
declare
  v_now timestamp with time zone;
begin
  -- Validate session ownership
  if not exists (
    select 1 
    from public.sessions 
    where id = p_session_id and participant_id = p_participant_id
  ) then
    raise exception 'Unauthorized: Session and participant token mismatch.';
  end if;

  v_now := timezone('utc'::text, now());

  -- Update Session completed status and timestamp
  update public.sessions
  set 
    completed_at = v_now,
    status = 'completed'
  where id = p_session_id;

  -- Update Participant completed timestamp
  update public.participants
  set completed_at = v_now
  where id = p_participant_id;

  return true;
end;
$$;
