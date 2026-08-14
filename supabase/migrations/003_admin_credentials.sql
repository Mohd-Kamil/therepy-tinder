-- Redefine get_admin_dashboard_data to use Username and Password credentials
-- Resolves the requirement: validate admin login server-side without hardcoding secrets in frontend code.

create or replace function public.get_admin_dashboard_data(
    p_username text,
    p_password text
)
returns json
language plpgsql
security definer -- runs as owner
as $$
begin
  -- Validate credentials
  if p_username = 'ARISH' and p_password = 'ARISH' then
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
    raise exception 'Unauthorized: Invalid admin credentials.';
  end if;
end;
$$;
