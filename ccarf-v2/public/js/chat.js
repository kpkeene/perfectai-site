// Ask Patch: streams answers from the local model. Commentary quips run in a
// separate bubble and are never part of the answer or presented as reasoning.
import { pickQuip, TOPIC_PATTERNS } from './persona.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Small, safe markdown subset: headings, lists, code, bold, italics.
export function renderMarkdown(src) {
  const blocks = src.split(/```/);
  return blocks.map((part, i) => {
    if (i % 2) { const nl = part.indexOf('\n'); return `<pre><code>${esc(nl >= 0 ? part.slice(nl + 1) : part)}</code></pre>`; }
    const lines = esc(part).split('\n'); let html = ''; let list = null;
    const inline = (t) => t.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|\s)\*([^*]+)\*(?=\s|$|[.,;:])/g, '$1<em>$2</em>');
    const close = () => { if (list) { html += `</${list}>`; list = null; } };
    for (const line of lines) {
      let m;
      if ((m = line.match(/^#{1,4}\s+(.*)/))) { close(); html += `<h4>${inline(m[1])}</h4>`; }
      else if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; }
      else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[1])}</li>`; }
      else if (!line.trim()) close();
      else { close(); html += `<p>${inline(line)}</p>`; }
    }
    close(); return html;
  }).join('');
}

const SUGGESTIONS = [
  'Walk me through the late-valve case as an agent loop.',
  'What exactly goes back to Claude after a tool runs?',
  'When does a write tool need human approval, and where is it enforced?',
  'How should retries work for a flaky API that a write depends on?',
  'Explain context budget management for a 400-page spec library.',
  'How do I defend an agent against instructions hidden in a document?',
];

export function accessHeader() {
  try { const c = localStorage.getItem('ccarf2:accessCode'); return c ? { 'X-Access-Code': c } : {}; } catch { return {}; }
}

export function mountAsk(root, { onPatch, onTopic, onStreamStart, onStreamEnd, getContext, onNeedsCode }) {
  const history = [];
  let controller = null; let quipTimer = null; const recentQuips = [];
  root.innerHTML = `
    <div class="ask">
      <div class="ask-log" aria-live="polite" aria-relevant="additions"></div>
      <div class="ask-suggest">${SUGGESTIONS.map((s) => `<button class="chip-btn">${esc(s)}</button>`).join('')}</div>
      <form class="ask-form">
        <label class="sr-only" for="ask-input">Ask Patch a question</label>
        <textarea id="ask-input" rows="3" maxlength="4000" placeholder="Ask about agents, tools, MCP, context, evaluation…"></textarea>
        <div class="ask-actions">
          <span class="fine">Enter sends · Shift+Enter new line · stays on your machine</span>
          <button type="button" class="btn ghost stop" hidden>Stop</button>
          <button type="submit" class="btn primary send">Ask Patch</button>
        </div>
      </form>
    </div>`;
  const log = root.querySelector('.ask-log'); const input = root.querySelector('textarea');
  const form = root.querySelector('form'); const stopBtn = root.querySelector('.stop'); const sendBtn = root.querySelector('.send');
  root.querySelectorAll('.chip-btn').forEach((b) => b.addEventListener('click', () => { input.value = b.textContent; input.focus(); }));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', (e) => { e.preventDefault(); const t = input.value.trim(); if (t && !controller) { input.value = ''; ask(t); } });
  stopBtn.addEventListener('click', () => controller?.abort());

  function bubble(role, html) {
    const el = document.createElement('div'); el.className = `msg ${role}`; el.innerHTML = html; log.append(el);
    el.scrollIntoView({ block: 'end', behavior: 'smooth' }); return el;
  }

  function startQuips(group) {
    const say = (g) => { const q = pickQuip(g, recentQuips); recentQuips.push(q); if (recentQuips.length > 6) recentQuips.shift(); onPatch?.('busy', q, { commentary: true }); };
    say(group);
    quipTimer = setInterval(() => say('stream'), 4200);
  }
  function stopQuips() { clearInterval(quipTimer); quipTimer = null; }

  async function ask(text, isRetry = false) {
    if (!isRetry) { history.push({ role: 'user', content: text }); bubble('user', `<p>${esc(text)}</p>`); }
    const el = bubble('assistant', '<div class="answer"><p class="fine">Waiting for the model…</p></div><div class="msg-meta fine"></div>');
    const ans = el.querySelector('.answer'); const meta = el.querySelector('.msg-meta');
    controller = new AbortController(); stopBtn.hidden = false; sendBtn.disabled = true;
    let acc = ''; const seenTopics = new Set(); let lastRender = 0; let failed = null; let demo = false;
    onStreamStart?.();
    startQuips('start');
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', ...accessHeader() }, signal: controller.signal,
        body: JSON.stringify({ messages: history.slice(-8), context: getContext?.() || '' }) });
      if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); if (j.needsCode) onNeedsCode?.(); throw new Error(j.error || `HTTP ${res.status}`); }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const raw = buf.slice(0, idx); buf = buf.slice(idx + 2);
          const ev = /event: (\w+)/.exec(raw)?.[1]; const data = JSON.parse(/data: (.*)/s.exec(raw)?.[1] || '{}');
          if (ev === 'status' && data.state === 'queued') { ans.innerHTML = '<p class="fine">Queued behind another answer…</p>'; stopQuips(); startQuips('queued'); }
          if (ev === 'status' && data.state === 'started') { demo = !!data.demo; meta.textContent = data.model; }
          if (ev === 'status' && data.state === 'truncated') meta.textContent += ' · stopped at the length limit';
          if (ev === 'token') {
            acc += data.t;
            for (const [topic, re] of TOPIC_PATTERNS) if (!seenTopics.has(topic) && re.test(acc)) {
              seenTopics.add(topic); onTopic?.(topic);
              const q = pickQuip(topic, recentQuips); recentQuips.push(q); onPatch?.('busy', q, { commentary: true });
            }
            const now = performance.now();
            if (now - lastRender > 80) { ans.innerHTML = renderMarkdown(acc); lastRender = now; }
          }
          if (ev === 'error') failed = data.message;
          if (ev === 'done') meta.textContent = `${meta.textContent} · ${(data.ms / 1000).toFixed(1)} s${data.ttftMs ? ` · first token ${(data.ttftMs / 1000).toFixed(1)} s` : ''}${demo ? ' · scripted demo' : ''}`;
        }
      }
      if (failed) throw new Error(failed);
      ans.innerHTML = renderMarkdown(acc || '_No answer text was returned._');
      history.push({ role: 'assistant', content: acc });
      if (!demo && acc) feedbackRow(el, history.slice(-8));
      stopQuips(); onPatch?.('delighted', pickQuip('done'), { commentary: true });
    } catch (err) {
      stopQuips();
      const cancelled = err.name === 'AbortError' || /cancel/i.test(err.message);
      ans.innerHTML = renderMarkdown(acc) + `<p class="error-line">${cancelled ? 'Stopped. The partial answer above is kept.' : esc(err.message)}</p>`;
      if (!cancelled) {
        const retry = document.createElement('button'); retry.className = 'btn small'; retry.textContent = 'Try again';
        retry.addEventListener('click', () => { el.remove(); ask(text, true); }); ans.append(retry);
      } else if (acc) history.push({ role: 'assistant', content: acc });
      onPatch?.(cancelled ? 'neutral' : 'alarmed', pickQuip(cancelled ? 'cancelled' : 'error'), { commentary: true });
    } finally {
      controller = null; stopBtn.hidden = true; sendBtn.disabled = false; onStreamEnd?.();
    }
  }

  // Rate an answer and keep it as a local training example (data/feedback.jsonl on the server).
  function feedbackRow(msgEl, messages) {
    const row = document.createElement('div'); row.className = 'fb-row';
    row.innerHTML = `<span class="fine">Rate it:</span>
      <button class="tag" data-k="funny" aria-pressed="false">Funny</button>
      <button class="tag" data-k="accurate" aria-pressed="false">Accurate</button>
      <button class="tag" data-k="wrong" aria-pressed="false">Wrong</button>
      <input class="fb-note" maxlength="300" placeholder="What was wrong, or what to keep (optional)">
      <button class="btn small fb-save">Save as training example</button><span class="fine fb-status"></span>`;
    msgEl.append(row);
    row.querySelectorAll('.tag').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));
    row.querySelector('.fb-save').addEventListener('click', async () => {
      const ratings = Object.fromEntries([...row.querySelectorAll('.tag')].map((b) => [b.dataset.k, b.getAttribute('aria-pressed') === 'true']));
      const status = row.querySelector('.fb-status'); status.textContent = 'Saving…';
      try {
        const r = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json', ...accessHeader() }, body: JSON.stringify({ messages, ratings, note: row.querySelector('.fb-note').value.trim(), context: getContext?.() || '' }) });
        const j = await r.json(); status.textContent = r.ok ? `Saved (${j.count} examples on this server).` : j.error || 'Not saved.';
      } catch { status.textContent = 'Not saved: server unreachable.'; }
    });
  }

  return { ask: (t) => { if (controller) { input.value = t; input.focus(); onPatch?.('busy', 'One answer at a time. Yours is queued in the box; send it when this one finishes.'); } else ask(t); }, prefill: (t) => { input.value = t; input.focus(); } };
}
