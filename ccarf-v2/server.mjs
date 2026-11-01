// Architect Studio v2 — local preview server (no dependencies).
// Serves the static app, a question bank, and a streaming chat proxy to a LOCAL
// OpenAI-compatible model server (llama.cpp server, LM Studio, Ollama /v1, vLLM).
// Binds to 127.0.0.1 by default. Nothing here touches Caddy, DNS or the live app.
//
//   MODEL_BASE=http://127.0.0.1:8080/v1 MODEL_NAME=qwen3-4b node server.mjs
//
// Without MODEL_BASE the chat runs in clearly labelled DEMO mode (scripted text).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSystemPrompt } from './public/js/persona.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8790);
const MODEL_BASE = (process.env.MODEL_BASE || '').replace(/\/$/, '');
const MODEL_NAME = process.env.MODEL_NAME || 'local-model';
const MODEL_LABEL = process.env.MODEL_LABEL || (MODEL_BASE ? `Local ${MODEL_NAME}` : 'Demo mode · no model connected');
const MODEL_KEY = process.env.MODEL_KEY || ''; // only if your local server requires one
const NO_THINK = process.env.NO_THINK !== '0'; // Qwen3: suppress thinking blocks by default
const MAX_TOKENS = Math.min(Number(process.env.MAX_TOKENS || 1400), 2400);
const MAX_INPUT = 4000;
const MAX_HISTORY = 8;
const QUESTIONS_FILE = process.env.QUESTIONS_FILE || path.join(__dirname, 'data', 'questions.json');
const QUESTIONS_URL = process.env.QUESTIONS_URL || '';
const VERSION = '2.1.0';
const TRUST_PROXY = process.env.TRUST_PROXY === '1';           // set when behind Caddy so rate limits see the real client IP
const ACCESS_CODE = process.env.ACCESS_CODE || '';             // optional: chat requires this code (entered once in the UI)
const DAILY_CHAR_BUDGET = Number(process.env.DAILY_CHAR_BUDGET || 1_500_000); // generated characters per UTC day across all users
const RATE_PER_MIN = Number(process.env.RATE_PER_MIN || 8);
const FEEDBACK_FILE = process.env.FEEDBACK_FILE || path.join(__dirname, 'data', 'feedback.jsonl');
const FEEDBACK_MAX_PER_DAY = 400;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

// ---- single-flight queue: one model response at a time (protects a 24 GB GPU) ----
let busy = false;
const waiters = [];
function acquire() {
  if (!busy) { busy = true; return Promise.resolve(); }
  return new Promise((res) => waiters.push(res));
}
function release() { const next = waiters.shift(); if (next) next(); else busy = false; }

// ---- simple per-IP rate limit + global daily budget ----
const hits = new Map();
function clientIp(req) {
  if (TRUST_PROXY) { const xf = req.headers['x-forwarded-for']; if (xf) return String(xf).split(',')[0].trim(); }
  return req.socket.remoteAddress || 'local';
}
function rateLimited(ip, limit = RATE_PER_MIN) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > limit;
}
const daily = { day: '', chars: 0, feedback: 0 };
function todayKey() { return new Date().toISOString().slice(0, 10); }
function rollDay() { const k = todayKey(); if (daily.day !== k) { daily.day = k; daily.chars = 0; daily.feedback = 0; } }
function accessOk(req) {
  if (!ACCESS_CODE) return true;
  const h = req.headers['x-access-code'];
  return typeof h === 'string' && h.length === ACCESS_CODE.length && h === ACCESS_CODE;
}

function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', ...securityHeaders() });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}
function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; script-src 'self'",
  };
}

async function readBody(req, limit = 64_000) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw new Error('too-large'); chunks.push(c); }
  return Buffer.concat(chunks).toString('utf8');
}

// ---- questions ----
async function loadQuestions() {
  if (fs.existsSync(QUESTIONS_FILE)) return { source: 'file', data: JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8')) };
  if (QUESTIONS_URL) {
    const r = await fetch(QUESTIONS_URL);
    if (r.ok) return { source: 'url', data: await r.json() };
  }
  return { source: 'sample', data: JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'sample-questions.json'), 'utf8')) };
}

// ---- chat ----
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw.slice(-MAX_HISTORY).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_INPUT) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return null;
  return msgs;
}

// Removes <think>…</think> spans from a growing stream without ever showing them.
function makeThinkFilter() {
  let buf = ''; let inThink = false;
  return (chunk, flush = false) => {
    buf += chunk; let out = '';
    for (;;) {
      if (inThink) {
        const end = buf.indexOf('</think>');
        if (end === -1) { buf = buf.slice(-8); return out; }
        buf = buf.slice(end + 8); inThink = false;
      } else {
        const start = buf.indexOf('<think>');
        if (start === -1) {
          const keep = flush ? 0 : 7; // hold a possible partial tag
          out += buf.slice(0, Math.max(0, buf.length - keep)); buf = buf.slice(Math.max(0, buf.length - keep));
          return out;
        }
        out += buf.slice(0, start); buf = buf.slice(start + 7); inThink = true;
      }
    }
  };
}

async function handleChat(req, res) {
  const ip = clientIp(req);
  if (!accessOk(req)) return send(res, 401, { error: 'This server asks for an access code. Enter it in Settings.', needsCode: true });
  if (rateLimited(ip)) return send(res, 429, { error: `Slow down: ${RATE_PER_MIN} requests per minute.` });
  rollDay();
  if (daily.chars >= DAILY_CHAR_BUDGET) return send(res, 503, { error: 'The shared daily generation budget is used up. Patch is back after midnight UTC. Missions, builder and quiz still work.' });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'Bad request body.' }); }
  const messages = sanitizeMessages(body.messages);
  if (!messages) return send(res, 400, { error: 'Send messages ending with a user turn.' });
  const context = typeof body.context === 'string' ? body.context.slice(0, 600) : '';

  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', ...securityHeaders() });
  const emit = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  const ac = new AbortController();
  let closed = false;
  res.on('close', () => { closed = true; ac.abort(); });

  const queued = busy;
  if (queued) emit('status', { state: 'queued' });
  await acquire();
  if (closed) { release(); return; }
  emit('status', { state: 'started', model: MODEL_LABEL, demo: !MODEL_BASE });
  const started = Date.now(); let firstTokenAt = 0; let chars = 0;

  try {
    if (!MODEL_BASE) {
      for await (const piece of demoStream(messages[messages.length - 1].content, ac.signal)) {
        if (!firstTokenAt) firstTokenAt = Date.now();
        chars += piece.length; emit('token', { t: piece });
      }
    } else {
      const sys = buildSystemPrompt({ context, noThink: NO_THINK });
      const upstream = await fetch(`${MODEL_BASE}/chat/completions`, {
        method: 'POST', signal: ac.signal,
        headers: { 'Content-Type': 'application/json', ...(MODEL_KEY ? { Authorization: `Bearer ${MODEL_KEY}` } : {}) },
        body: JSON.stringify({ model: MODEL_NAME, stream: true, max_tokens: MAX_TOKENS, temperature: 0.6, top_p: 0.9,
          messages: [{ role: 'system', content: sys }, ...messages] }),
      });
      if (!upstream.ok || !upstream.body) throw new Error(`Model server answered ${upstream.status}.`);
      const filter = makeThinkFilter();
      const decoder = new TextDecoder(); let pending = '';
      for await (const chunk of upstream.body) {
        pending += decoder.decode(chunk, { stream: true });
        let nl;
        while ((nl = pending.indexOf('\n')) !== -1) {
          const line = pending.slice(0, nl).trim(); pending = pending.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;
          let j; try { j = JSON.parse(payload); } catch { continue; }
          const delta = j.choices?.[0]?.delta || {};
          // reasoning_content (if the server separates it) is deliberately dropped: never shown as an answer or as "reasoning".
          const text = filter(delta.content || '');
          if (text) { if (!firstTokenAt) firstTokenAt = Date.now(); chars += text.length; emit('token', { t: text }); }
          if (j.choices?.[0]?.finish_reason === 'length') emit('status', { state: 'truncated' });
        }
      }
      const tail = filter('', true); if (tail) emit('token', { t: tail });
    }
    daily.chars += chars;
    emit('done', { ms: Date.now() - started, ttftMs: firstTokenAt ? firstTokenAt - started : null, chars });
  } catch (err) {
    if (!closed) emit('error', { message: err.name === 'AbortError' ? 'Cancelled.' : `Model unavailable: ${err.message}` });
  } finally {
    release();
    if (!closed) res.end();
  }
}

async function* demoStream(prompt, signal) {
  const { demoAnswer } = await import('./public/js/demo-answers.js');
  const text = demoAnswer(prompt);
  const words = text.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 3) {
    if (signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    yield words.slice(i, i + 3).join('');
    await new Promise((r) => setTimeout(r, 35));
  }
}

// ---- feedback: rated chat exchanges kept locally as candidate training data ----
let feedbackCount = null;
function countFeedback() {
  if (feedbackCount !== null) return feedbackCount;
  try { feedbackCount = fs.readFileSync(FEEDBACK_FILE, 'utf8').split('\n').filter(Boolean).length; } catch { feedbackCount = 0; }
  return feedbackCount;
}
async function handleFeedback(req, res) {
  const ip = clientIp(req);
  if (!accessOk(req)) return send(res, 401, { error: 'Access code required.' });
  if (rateLimited(`fb:${ip}`, 10)) return send(res, 429, { error: 'Too many ratings per minute.' });
  rollDay();
  if (daily.feedback >= FEEDBACK_MAX_PER_DAY) return send(res, 503, { error: 'Feedback is full for today.' });
  let body;
  try { body = JSON.parse(await readBody(req, 48_000)); } catch { return send(res, 400, { error: 'Bad request body.' }); }
  const last = Array.isArray(body.messages) ? body.messages[body.messages.length - 1] : null;
  if (!Array.isArray(body.messages) || !last || last.role !== 'assistant' || typeof last.content !== 'string') return send(res, 400, { error: 'Send the exchange ending with the assistant answer.' });
  const rec = {
    ts: new Date().toISOString(), model: MODEL_LABEL, version: VERSION,
    ratings: { funny: !!body.ratings?.funny, accurate: !!body.ratings?.accurate, wrong: !!body.ratings?.wrong },
    note: typeof body.note === 'string' ? body.note.slice(0, 300) : '',
    context: typeof body.context === 'string' ? body.context.slice(0, 200) : '',
    messages: body.messages.slice(-8).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').map((m) => ({ role: m.role, content: m.content.slice(0, 8000) })),
    license_note: 'User-submitted rating of a locally generated answer. Review before any training use.',
  };
  try {
    fs.mkdirSync(path.dirname(FEEDBACK_FILE), { recursive: true });
    fs.appendFileSync(FEEDBACK_FILE, JSON.stringify(rec) + '\n');
    feedbackCount = countFeedback() + 1; daily.feedback++;
    return send(res, 200, { ok: true, count: feedbackCount });
  } catch (e) { return send(res, 500, { error: 'Could not write feedback file.' }); }
}

// ---- static ----
function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) return send(res, 403, { error: 'Forbidden' });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { error: 'Not found' });
    const cache = file.includes(`${path.sep}vendor${path.sep}`) ? 'public, max-age=604800' : 'no-cache';
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': cache, ...securityHeaders() });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/health') { rollDay(); return send(res, 200, { ok: true, version: VERSION, model: MODEL_LABEL, demo: !MODEL_BASE, busy, queued: waiters.length, maxTokens: MAX_TOKENS, needsCode: !!ACCESS_CODE, budgetLeft: Math.max(0, DAILY_CHAR_BUDGET - daily.chars), feedbackCount: countFeedback() }); }
    if (url.pathname === '/api/feedback' && req.method === 'POST') return handleFeedback(req, res);
    if (url.pathname === '/api/questions' && req.method === 'GET') {
      const q = await loadQuestions();
      res.setHeader('X-Bank-Source', q.source);
      return send(res, 200, q.data);
    }
    if (url.pathname === '/api/chat' && req.method === 'POST') return handleChat(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    return serveStatic(req, res);
  } catch (e) {
    if (!res.headersSent) send(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Architect Studio v2 preview → http://${HOST}:${PORT}  (${MODEL_LABEL})`);
});
