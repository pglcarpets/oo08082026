import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

function logSuccess(name: string, info: string) {
  console.log(`✅ ${name}: ${info}`);
}
function logError(name: string, err: unknown) {
  console.error(`❌ ${name} failed:`, err?.message ?? err);
}

// ---------- URL checks ----------
async function checkUrl(name: string, url: string) {
  try {
    const res = await fetch(url);
    // Consider any response (including 4xx/5xx) as reachable; report status code
    logSuccess(name, `reachable, status ${res.status}`);
  } catch (e) {
    // If the URL is localhost and connection refused, treat as optional
    if (url.includes('localhost')) {
      logError(name, new Error('Localhost not reachable (service may be down)'));
    } else {
      logError(name, e);
    }
  }
}

// ---------- Supabase ----------
async function checkPublicSupabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) throw new Error('Missing public Supabase URL or anon key');
  const client = createClient(url, anonKey);
  const { data, error } = await client.from('catalog_products').select('id', { limit: 1 });
  if (error) throw error;
  logSuccess('Public Supabase', `first product ID ${data?.[0]?.id}`);
}

async function checkAdminSupabase() {
  const url = process.env.NEXT_ADMIN_SUPABASE_URL?.trim();
  const adminKey = process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim();
  if (!url || !adminKey) throw new Error('Missing admin Supabase URL or service role key');
  const client = createClient(url, adminKey);
  const { data, error } = await client.from('profiles').select('id', { limit: 1 });
  if (error) throw error;
  logSuccess('Admin Supabase', `first profile ID ${data?.[0]?.id}`);
}

// ---------- OpenRouter ----------
async function checkOpenRouter(keyName: string, apiKey: string) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const count = Array.isArray(json?.data) ? json.data.length : 'unknown';
    logSuccess(`OpenRouter (${keyName})`, `${count} models retrieved`);
  } catch (e) {
    logError(`OpenRouter (${keyName})`, e);
  }
}

// ---------- Resend ----------
async function checkResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');
  const response = await fetch('https://api.resend.com/domains', {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  logSuccess('Resend', 'domains endpoint reachable');
}

// ---------- Cloudflare R2 ----------
async function checkCloudflareR2() {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET?.trim();
  if (!token || !accountId || !bucket) throw new Error('Missing Cloudflare R2 credentials');
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/bucket/${bucket}/objects?list=true&limit=1`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  logSuccess('Cloudflare R2', `objects listed: ${json?.result?.length ?? 0}`);
}



// ---------- Optional / Extra Env Vars ----------
async function checkEmailFrom() {
  const val = process.env.EMAIL_FROM?.trim();
  if (!val) return logError('EMAIL_FROM', new Error('Missing EMAIL_FROM'));
  const emailRegex = /[^<]+<([^>]+)>/;
  const match = val.match(emailRegex);
  const email = match ? match[1] : val;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    logSuccess('EMAIL_FROM', `valid format (${email})`);
  } else {
    logError('EMAIL_FROM', new Error('Invalid email format'));
  }
}

async function checkResendInbox() {
  const inbox = process.env.RESEND_INBOX?.trim();
  if (!inbox) return logError('RESEND_INBOX', new Error('Missing RESEND_INBOX'));
  try {
    const host = inbox.includes('@') ? inbox.split('@').pop() : inbox;
    const res = await fetch(`https://${host}`);
    logSuccess('RESEND_INBOX', `reachable, status ${res.status}`);
  } catch (e) {
    logError('RESEND_INBOX', e);
  }
}

async function checkCloudflareS3Url() {
  const url = process.env.CLOUDFLARE_S3_URL?.trim();
  if (!url) return logError('CLOUDFLARE_S3_URL', new Error('Missing CLOUDFLARE_S3_URL'));
  try {
    const res = await fetch(url);
    logSuccess('CLOUDFLARE_S3_URL', `reachable, status ${res.status}`);
  } catch (e) {
    logError('CLOUDFLARE_S3_URL', e);
  }
}

// ---------- Gemini ----------
async function checkGemini() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  const count = Array.isArray(json?.models) ? json.models.length : 'unknown';
  logSuccess('Gemini', `${count} models listed`);
}

// ---------- Postgres (skip if pg not installed) ----------
async function checkPostgres(name: string, connVar: string) {
  const connStr = process.env[connVar]?.trim();
  if (!connStr) {
    logError(name, new Error(`Missing ${connVar}`));
    return;
  }
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: connStr });
    await client.connect();
    const res = await client.query('SELECT 1');
    await client.end();
    if (res?.rowCount === 1) logSuccess(name, 'connection OK');
  } catch (e) {
    logError(name, e);
  }
}

(async () => {
  try {
    // Simple URL checks
    if (process.env.NEXT_PUBLIC_SITE_URL) await checkUrl('Site URL', process.env.NEXT_PUBLIC_SITE_URL);
    if (process.env.NEXT_PUBLIC_TECH_DOCS_URL) await checkUrl('Tech Docs URL', process.env.NEXT_PUBLIC_TECH_DOCS_URL);
    if (process.env.SUPABASE_AUTH_URL) await checkUrl('Supabase Auth URL', process.env.SUPABASE_AUTH_URL);

    // Service checks
    await Promise.all([
      checkPublicSupabase().catch(e => logError('Public Supabase', e)),
      checkAdminSupabase().catch(e => logError('Admin Supabase', e)),
      checkOpenRouter('primary', process.env.OPENROUTER_API_KEY_PRIMARY ?? ''),
      checkOpenRouter('backup', process.env.OPENROUTER_API_KEY_BACKUP ?? ''),
      checkResend().catch(e => logError('Resend', e)),
      checkCloudflareR2().catch(e => logError('Cloudflare R2', e)),
      checkGemini().catch(e => logError('Gemini', e)),
      checkEmailFrom().catch(e => logError('EMAIL_FROM', e)),
      checkResendInbox().catch(e => logError('RESEND_INBOX', e)),
      checkCloudflareS3Url().catch(e => logError('CLOUDFLARE_S3_URL', e)),
      checkPostgres('Products Postgres', 'PRODUCTS_DATABASE_URL').catch(e => logError('Products Postgres', e)),
      checkPostgres('Auth Postgres', 'SUPABASE_AUTH_DATABASE_URL').catch(e => logError('Auth Postgres', e)),
      checkPostgres('Planner Postgres', 'PLANNER_DATABASE_URL').catch(e => logError('Planner Postgres', e)),
    ]);
    console.log('✅ All environment checks completed');
  } catch (e) {
    console.error('Unexpected error during checks:', e);
    process.exit(1);
  }
})();
