// Fake OpenAI-compatible streaming server for testing the proxy (think-stripping, cancel, queueing).
import http from 'node:http';
http.createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c; const j = JSON.parse(body);
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  const parts = ['<thi', 'nk>secret plan', ' more</th', 'ink>', '## Short answer\n', 'Use a ', 'permission ', 'hook and human approval', ' before writes.\n', '## How it works\n', 'The agent loop sees `stop_reason: "tool_use"`, retrieves documents, ', 'retries with backoff', ' and stays inside the context budget.'];
  let i = 0; let closed = false; res.on('close', () => { closed = true; });
  const t = setInterval(() => {
    if (closed) { clearInterval(t); return; }
    if (i === 2) res.write(`data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'hidden reasoning' } }] })}\n\n`);
    if (i < parts.length) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: parts[i++] } }] })}\n\n`);
    else { res.write('data: [DONE]\n\n'); res.end(); clearInterval(t); }
  }, Number(process.env.DELAY || 120));
  console.log('sys prompt starts:', j.messages[0].content.slice(0, 40).replace(/\n/g, ' '), '| max_tokens', j.max_tokens);
}).listen(8791, '127.0.0.1');
