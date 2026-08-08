// deno-lint-ignore-file no-console
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4.1-mini'
const MAX_CONTEXT_BYTES = 16 * 1024

const DEFAULT_ALLOWED_ORIGINS = ['https://oando.co.in']

type RequestBody = {
  officeId?: string
  threadId?: string
  message?: string
  context?: Record<string, unknown>
}

type ThreadRow = {
  id: string
  office_id: string
  created_by: string
}

type MessageRow = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function getAllowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? Deno.env.get('SITE_URL') ?? ''
  const fromEnv = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOWED_ORIGINS
}

function resolveCorsOrigin(req: Request): string | null {
  const origin = req.headers.get('Origin')?.trim()
  if (!origin) return null
  return getAllowedOrigins().includes(origin) ? origin : null
}

function buildCorsHeaders(req: Request): Record<string, string> | null {
  const origin = resolveCorsOrigin(req)
  if (!origin) {
    if (req.headers.get('Origin')) return null
    return {}
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function text(body: string, status: number, cors: Record<string, string>): Response {
  return new Response(body, { status, headers: cors })
}

function json(body: unknown, cors: Record<string, string>, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...cors,
      ...(init?.headers),
    },
  })
}

function extractAssistantText(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'output_text' in payload) {
    const out = (payload as { output_text?: unknown }).output_text
    if (typeof out === 'string' && out.trim()) return out.trim()
  }
  const outputs = (payload as { output?: unknown[] })?.output
  if (!Array.isArray(outputs)) return ''
  const parts: string[] = []
  for (const item of outputs) {
    const content = (item as { content?: unknown[] })?.content
    if (!Array.isArray(content)) continue
    for (const block of content) {
      const textValue = (block as { text?: unknown }).text
      if (typeof textValue === 'string' && textValue.trim()) {
        parts.push(textValue.trim())
      }
    }
  }
  return parts.join('\n\n').trim()
}

serve(async (req) => {
  const cors = buildCorsHeaders(req)
  if (cors === null) {
    return new Response('Forbidden origin', { status: 403 })
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }
  if (req.method !== 'POST') return text('Method not allowed', 405, cors)
  if (!OPENAI_API_KEY) return text('OPENAI_API_KEY is not configured', 500, cors)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return text('Missing auth', 401, cors)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: authData, error: authErr } = await userClient.auth.getUser()
  const caller = authData?.user
  if (authErr || !caller) return text('Not authenticated', 401, cors)

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return text('Invalid JSON', 400, cors)
  }

  const officeId = body.officeId?.trim()
  const message = body.message?.trim()
  if (!officeId) return text('officeId is required', 400, cors)
  if (!message) return text('message is required', 400, cors)
  if (message.length > 4000) return text('message too long', 400, cors)

  const { data: office } = await userClient
    .from('offices')
    .select('id')
    .eq('id', officeId)
    .single()
  if (!office) return text('Office not found or forbidden', 403, cors)

  const { data: canUseAi, error: canUseAiErr } = await userClient.rpc(
    'can_use_ai_for_office',
    { oid: officeId },
  )
  if (canUseAiErr) {
    console.error('ai_access_check_failed', canUseAiErr)
    return text('Failed to verify AI access', 500, cors)
  }
  if (!canUseAi) return text('Office not found or forbidden', 403, cors)

  let thread: ThreadRow | null = null
  const threadId = body.threadId?.trim()
  if (threadId) {
    const { data: existingThread } = await admin
      .from('ai_threads')
      .select('id, office_id, created_by')
      .eq('id', threadId)
      .single()
    if (!existingThread || existingThread.office_id !== officeId) {
      return text('Thread not found', 404, cors)
    }
    thread = existingThread as ThreadRow
  } else {
    const { data: createdThread, error: createErr } = await admin
      .from('ai_threads')
      .insert({
        office_id: officeId,
        created_by: caller.id,
        title: 'One&Only assistant chat',
      })
      .select('id, office_id, created_by')
      .single()
    if (createErr || !createdThread) {
      console.error('create_thread_failed', createErr)
      return text('Failed to create thread', 500, cors)
    }
    thread = createdThread as ThreadRow
  }

  const nowIso = new Date().toISOString()

  const { error: userInsertErr } = await admin
    .from('ai_messages')
    .insert({
      thread_id: thread.id,
      role: 'user',
      content: message,
      created_by: caller.id,
      metadata: {
        source: 'buddycraft-web',
        captured_at: nowIso,
      },
    })
  if (userInsertErr) {
    console.error('insert_user_message_failed', userInsertErr)
    return text('Failed to persist user message', 500, cors)
  }

  const { data: historyRows } = await admin
    .from('ai_messages')
    .select('role, content')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: false })
    .limit(14)
  const history = ((historyRows ?? []) as MessageRow[]).reverse()

  const systemPrompt = [
    'You are the One&Only assistant for office furniture planning and layout guidance.',
    'Your job is to give concise, practical office-layout and workplace-operations guidance.',
    'Prioritize safe, reversible, step-by-step suggestions and call out assumptions explicitly.',
    'When giving layout advice, mention concrete element moves (desks, rooms, circulation, meeting spaces).',
    'If context is partial, ask at most one clarifying question at the end.',
  ].join(' ')

  const contextJson = (() => {
    if (!body.context || typeof body.context !== 'object') return '{}'
    const json = JSON.stringify(body.context)
    if (!json) return '{}'
    if (new TextEncoder().encode(json).length > MAX_CONTEXT_BYTES) {
      return null
    }
    return json
  })()
  if (contextJson === null) return text('context too large', 400, cors)

  const input = [
    {
      role: 'system',
      content: [
        { type: 'text', text: systemPrompt },
      ],
    },
    {
      role: 'system',
      content: [
        { type: 'text', text: `Office context snapshot (JSON): ${contextJson}` },
      ],
    },
    ...history.map((row) => ({
      role: row.role === 'assistant' ? 'assistant' : 'user',
      content: [{ type: 'text', text: row.content }],
    })),
  ]

  const openaiResp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input,
      temperature: 0.4,
      max_output_tokens: 600,
    }),
  })

  if (!openaiResp.ok) {
    const errText = await openaiResp.text()
    console.error('openai_failed', openaiResp.status, errText)
    return text('AI provider error', 502, cors)
  }

  const responseBody = await openaiResp.json()
  const assistantText = extractAssistantText(responseBody)
  if (!assistantText) {
    return text('AI returned an empty response', 502, cors)
  }

  const { data: assistantMessage, error: assistantInsertErr } = await admin
    .from('ai_messages')
    .insert({
      thread_id: thread.id,
      role: 'assistant',
      content: assistantText,
      created_by: null,
      metadata: {
        model: OPENAI_MODEL,
        generated_at: new Date().toISOString(),
      },
    })
    .select('id, role, content, created_at')
    .single()

  if (assistantInsertErr || !assistantMessage) {
    console.error('insert_assistant_message_failed', assistantInsertErr)
    return text('Failed to persist assistant response', 500, cors)
  }

  await admin
    .from('ai_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', thread.id)

  return json(
    {
      threadId: thread.id,
      assistantMessage,
    },
    cors,
  )
})
