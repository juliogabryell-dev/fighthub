import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function checkAuth(request) {
  return !!request.cookies.get('admin_session')?.value;
}

// GET: List pending changes
export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  try {
    const { data } = await supabase
      .from('pending_profile_changes')
      .select('*, user:user_id(full_name, handle, avatar_url, role, is_fighter, is_coach)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return NextResponse.json({ changes: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Approve or reject a pending change
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  try {
    const { id, action } = await request.json();
    if (!id || !action) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const { data: change } = await supabase
      .from('pending_profile_changes')
      .select('*')
      .eq('id', id)
      .single();

    if (!change) {
      return NextResponse.json({ error: 'Alteração não encontrada' }, { status: 404 });
    }

    if (action === 'approve') {
      // Apply the change based on type
      if (change.change_type === 'profile' && change.action === 'update') {
        await supabase.from('profiles').update(change.payload).eq('id', change.user_id);
      }
      else if (change.change_type === 'martial_art') {
        const { martial_art, records } = change.payload;

        if (change.action === 'create') {
          const { data: newArt } = await supabase
            .from('fighter_martial_arts')
            .insert({ ...martial_art, fighter_id: change.user_id })
            .select()
            .single();

          // Insert fight records
          if (records && newArt) {
            for (const cat of ['profissional', 'semi_profissional', 'amador']) {
              const rec = records[cat];
              const hasData = (parseInt(rec?.wins) || 0) + (parseInt(rec?.losses) || 0) + (parseInt(rec?.draws) || 0) + (parseInt(rec?.no_contest) || 0) > 0;
              if (hasData) {
                await supabase.from('fight_records').insert({
                  fighter_id: change.user_id,
                  modality: martial_art.art_name,
                  category: cat,
                  wins: parseInt(rec.wins) || 0,
                  losses: parseInt(rec.losses) || 0,
                  draws: parseInt(rec.draws) || 0,
                  no_contest: parseInt(rec.no_contest) || 0,
                });
              }
            }
          }
        }
        else if (change.action === 'update' && change.target_id) {
          await supabase.from('fighter_martial_arts').update(martial_art).eq('id', change.target_id);

          // Update fight records
          if (records) {
            // Get the art_name to use as modality
            const modality = martial_art.art_name;
            for (const cat of ['profissional', 'semi_profissional', 'amador']) {
              const rec = records[cat];
              const { data: existing } = await supabase
                .from('fight_records')
                .select('id')
                .eq('fighter_id', change.user_id)
                .eq('modality', modality)
                .eq('category', cat)
                .single();

              const hasData = (parseInt(rec?.wins) || 0) + (parseInt(rec?.losses) || 0) + (parseInt(rec?.draws) || 0) + (parseInt(rec?.no_contest) || 0) > 0;

              if (existing) {
                await supabase.from('fight_records').update({
                  wins: parseInt(rec?.wins) || 0,
                  losses: parseInt(rec?.losses) || 0,
                  draws: parseInt(rec?.draws) || 0,
                  no_contest: parseInt(rec?.no_contest) || 0,
                }).eq('id', existing.id);
              } else if (hasData) {
                await supabase.from('fight_records').insert({
                  fighter_id: change.user_id,
                  modality,
                  category: cat,
                  wins: parseInt(rec?.wins) || 0,
                  losses: parseInt(rec?.losses) || 0,
                  draws: parseInt(rec?.draws) || 0,
                  no_contest: parseInt(rec?.no_contest) || 0,
                });
              }
            }
          }
        }
        else if (change.action === 'delete' && change.target_id) {
          await supabase.from('fighter_martial_arts').delete().eq('id', change.target_id);
        }
      }
      else if (change.change_type === 'video') {
        if (change.action === 'create') {
          await supabase.from('fighter_videos').insert({ ...change.payload, fighter_id: change.user_id });
        } else if (change.action === 'update' && change.target_id) {
          await supabase.from('fighter_videos').update(change.payload).eq('id', change.target_id);
        } else if (change.action === 'delete' && change.target_id) {
          await supabase.from('fighter_videos').delete().eq('id', change.target_id);
        }
      }
      else if (change.change_type === 'experience') {
        if (change.action === 'create') {
          await supabase.from('coach_experiences').insert({ ...change.payload, coach_id: change.user_id });
        } else if (change.action === 'update' && change.target_id) {
          await supabase.from('coach_experiences').update(change.payload).eq('id', change.target_id);
        } else if (change.action === 'delete' && change.target_id) {
          await supabase.from('coach_experiences').delete().eq('id', change.target_id);
        }
      }

      // Mark as approved
      await supabase.from('pending_profile_changes').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
    } else {
      // Reject
      await supabase.from('pending_profile_changes').update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
