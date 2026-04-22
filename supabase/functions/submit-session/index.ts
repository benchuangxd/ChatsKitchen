import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface PlayerPayload {
  username: string
  cooked: number
  served: number
  money_earned: number
  extinguished: number
  fires_caused: number
}

interface SessionPayload {
  channel_name: string
  money_earned: number
  served: number
  lost: number
  players: PlayerPayload[]
}

function isNonNegativeInteger(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val >= 0
}

function validatePayload(
  body: unknown,
): { ok: true; data: SessionPayload } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }

  const b = body as Record<string, unknown>

  // channel_name: required, non-empty string
  if (typeof b.channel_name !== 'string' || b.channel_name.trim() === '') {
    return { ok: false, error: 'channel_name must be a non-empty string' }
  }

  // money_earned: 0..99_999
  if (!isNonNegativeInteger(b.money_earned) || (b.money_earned as number) > 99_999) {
    return { ok: false, error: 'money_earned must be an integer between 0 and 99999' }
  }

  // served: 0..200
  if (!isNonNegativeInteger(b.served) || (b.served as number) > 200) {
    return { ok: false, error: 'served must be an integer between 0 and 200' }
  }

  // lost: >= 0
  if (!isNonNegativeInteger(b.lost)) {
    return { ok: false, error: 'lost must be a non-negative integer' }
  }

  // players: array, length <= 500
  if (!Array.isArray(b.players)) {
    return { ok: false, error: 'players must be an array' }
  }
  if ((b.players as unknown[]).length > 500) {
    return { ok: false, error: 'players array must have at most 500 entries' }
  }

  for (let i = 0; i < (b.players as unknown[]).length; i++) {
    const p = (b.players as unknown[])[i]
    if (typeof p !== 'object' || p === null) {
      return { ok: false, error: `players[${i}] must be an object` }
    }
    const player = p as Record<string, unknown>

    if (typeof player.username !== 'string' || player.username.trim() === '') {
      return { ok: false, error: `players[${i}].username must be a non-empty string` }
    }
    for (const field of ['cooked', 'served', 'money_earned', 'extinguished', 'fires_caused'] as const) {
      if (!isNonNegativeInteger(player[field])) {
        return { ok: false, error: `players[${i}].${field} must be a non-negative integer` }
      }
    }
  }

  return {
    ok: true,
    data: {
      channel_name: b.channel_name.trim().toLowerCase(),
      money_earned: b.money_earned as number,
      served: b.served as number,
      lost: b.lost as number,
      players: (b.players as Record<string, unknown>[]).map((p) => ({
        username: (p.username as string).trim().toLowerCase(),
        cooked: p.cooked as number,
        served: p.served as number,
        money_earned: p.money_earned as number,
        extinguished: p.extinguished as number,
        fires_caused: p.fires_caused as number,
      })),
    },
  }
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const RATE_LIMIT_WINDOW_MS = 3 * 60 * 1000 // 3 minutes in ms

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Parse body
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  // Validate payload
  const validation = validatePayload(rawBody)
  if (!validation.ok) {
    return json({ error: validation.error }, 400)
  }

  const { channel_name, money_earned, served, lost, players } = validation.data

  // -------------------------------------------------------------------------
  // Rate limit check
  // -------------------------------------------------------------------------
  const { data: rateRow, error: rateErr } = await supabase
    .from('rate_limits')
    .select('last_submission')
    .eq('channel_name', channel_name)
    .maybeSingle()

  if (rateErr) {
    console.error('rate_limits select error:', rateErr)
    return json({ error: 'Internal error' }, 500)
  }

  if (rateRow?.last_submission) {
    const lastMs = new Date(rateRow.last_submission).getTime()
    if (Date.now() - lastMs < RATE_LIMIT_WINDOW_MS) {
      return json({ error: 'Rate limit: 1 submission per channel per 3 minutes' }, 429)
    }
  }

  // -------------------------------------------------------------------------
  // Get active season (include `number` so rollover can compute next number)
  // -------------------------------------------------------------------------
  const { data: season, error: seasonErr } = await supabase
    .from('seasons')
    .select('id, number, money_goal, total_money_earned')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (seasonErr) {
    console.error('seasons select error:', seasonErr)
    return json({ error: 'Internal error' }, 500)
  }

  if (!season) {
    return json({ error: 'Internal error' }, 500)
  }

  // -------------------------------------------------------------------------
  // Insert session
  // -------------------------------------------------------------------------
  const { data: sessionRow, error: sessionInsertErr } = await supabase
    .from('sessions')
    .insert({
      channel_name,
      money_earned,
      served,
      lost,
      season_id: season.id,
    })
    .select('id')
    .single()

  if (sessionInsertErr) {
    console.error('sessions insert error:', sessionInsertErr)
    return json({ error: 'Internal error' }, 500)
  }

  // -------------------------------------------------------------------------
  // Bulk insert player contributions (skip if empty)
  // -------------------------------------------------------------------------
  if (players.length > 0) {
    const contributions = players.map((p) => ({
      session_id: sessionRow.id,
      season_id: season.id,
      channel_name,
      twitch_username: p.username,
      cooked: p.cooked,
      served: p.served,
      money_earned: p.money_earned,
      extinguished: p.extinguished,
      fires_caused: p.fires_caused,
    }))

    const { error: contribErr } = await supabase
      .from('player_contributions')
      .insert(contributions)

    if (contribErr) {
      console.error('player_contributions insert error:', contribErr)
      return json({ error: 'Internal error' }, 500)
    }
  }

  // -------------------------------------------------------------------------
  // Update season total_money_earned atomically (SQL-side addition)
  // Using a raw SQL UPDATE via PostgREST's rpc approach keeps it race-safe.
  // The function `increment_season_money(p_season_id, p_amount)` must exist;
  // see the migration that created it. It returns the new total_money_earned.
  // -------------------------------------------------------------------------
  const { data: newTotal, error: incrementErr } = await supabase
    .rpc('increment_season_money', {
      p_season_id: season.id,
      p_amount: money_earned,
    })

  if (incrementErr || newTotal === null || newTotal === undefined) {
    console.error('increment_season_money error:', incrementErr)
    return json({ error: 'Internal error' }, 500)
  }

  const updatedTotal: number = newTotal as number

  // -------------------------------------------------------------------------
  // Season rollover: if goal reached, end current season and start next
  // -------------------------------------------------------------------------
  let seasonEnded = false

  if (updatedTotal >= season.money_goal) {
    seasonEnded = true

    // Mark current season as ended
    const { error: endErr } = await supabase
      .from('seasons')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', season.id)

    if (endErr) {
      console.error('seasons end error:', endErr)
      return json({ error: 'Internal error' }, 500)
    }

    // Create next season (number + 1, same money_goal, total reset to 0)
    const { error: newSeasonErr } = await supabase
      .from('seasons')
      .insert({
        number: season.number + 1,
        status: 'active',
        money_goal: season.money_goal,
        total_money_earned: 0,
        started_at: new Date().toISOString(),
      })

    if (newSeasonErr) {
      console.error('new season insert error:', newSeasonErr)
      return json({ error: 'Internal error' }, 500)
    }
  }

  // -------------------------------------------------------------------------
  // Update rate limit (upsert — non-fatal if it errors)
  // -------------------------------------------------------------------------
  const { error: rlUpsertErr } = await supabase
    .from('rate_limits')
    .upsert({ channel_name, last_submission: new Date().toISOString() })

  if (rlUpsertErr) {
    // The session is already committed — log but don't fail the request
    console.error('rate_limits upsert error:', rlUpsertErr)
  }

  return json({ ok: true, season_ended: seasonEnded })
})
