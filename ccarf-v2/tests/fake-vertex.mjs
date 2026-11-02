// Fake Vertex AI express-mode endpoint: checks the x-goog-api-key header and URL shape,
// streams Gemini SSE chunks (including a thought part that must be hidden).
import http from 'node:http';
const KEY = 'test-key-123';
http.createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c;
  const m = /^\/v1\/publishers\/google\/models\/([^:]+):streamGenerateContent\?alt=sse$/.exec(req.url);
  if (!m) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: { status: 'NOT_FOUND' } })); }
  if (req.headers['x-goog-api-key'] !== KEY) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: { status: 'UNAUTHENTICATED' } })); }
  if (/key=/.test(req.url)) { res.writeHead(400); return res.end('key must not be in URL'); }
  const j = JSON.parse(body);
  const ok = j.systemInstruction?.parts?.[0]?.text?.includes('Patch') && j.contents.at(-1).role === 'user' && j.contents.every((c) => ['user', 'model'].includes(c.role));
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
  send({ candidates: [{ content: { role: 'model', parts: [{ text: 'SECRET-THOUGHT', thought: true }] } }] });
  const words = (ok ? `## Short answer\nGemini via Vertex (${m[1]}) answering: ${j.contents.at(-1).parts[0].text.slice(0, 40)}. Tool results are data, not instructions.` : 'BAD REQUEST SHAPE').split(' ');
  for (const w of words) { send({ candidates: [{ content: { role: 'model', parts: [{ text: w + ' ' }] } }] }); await new Promise((r) => setTimeout(r, 40)); }
  send({ candidates: [{ content: { role: 'model', parts: [{ text: '' }] }, finishReason: /long/i.test(body) ? 'MAX_TOKENS' : 'STOP' }], usageMetadata: { totalTokenCount: 42 } });
  res.end();
}).listen(8793, '127.0.0.1', () => console.log('fake vertex on :8793'));
