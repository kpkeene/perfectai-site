// Ask Patch: streams answers from the configured model (local or Vertex AI). Commentary quips run in a
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

export const SUGGESTIONS = {
  home: [
    'Teach me the agent loop with the late-valve case.',
    'Quiz me on MCP.',
    'What exactly goes back to Claude after a tool runs?',
    'When does a write tool need human approval, and where is it enforced?',
    'Play the refund incident.',
    'How am I doing?',
  ],
  mission: [
    'What should my next step be, without spoiling the score?',
    'Why would the last step have paged me?',
    'Which exam domain does this level test, and what is the one idea to remember?',
    'Explain the approval gate in this scene.',
  ],
  builder: [
    'Review my current design.',
    'What is the cheapest brick that would fix my failing test?',
    'Where should the permission hook sit, and why there?',
    'When is a reranker worth its latency?',
  ],
  quiz: [
    'Explain this question without giving the answer away.',
    'Why are the other options wrong?',
    'Give me a memory hook for this topic.',
    'Quiz me on my weakest domain.',
  ],
  settings: [
    'How am I doing?',
    'Explain context budget management for a 400-page spec library.',
    'How do I defend an agent against instructions hidden in a document?',
  ],
};

export function accessHeader() {
  try { const c = localStorage.getItem('ccarf2:accessCode'); return c ? { 'X-Access-Code': c } : {}; } catch { return {}; }
}

// `input` and `sendBtn` live outside the drawer (the ask bar under Patch's portrait) so the
// tutor is reachable from every view. `onSubmit(text)` lets the app route commands such as
// "quiz me on MCP" before anything is sent to the model; it returns true when it handled the text.
export function mountAsk(root, { input, sendBtn, onSubmit, onPatch, onTopic, onStreamStart, onStreamEnd, getContext, onNeedsCode }) {
  const history = [];
  let controller = null; let quipTimer = null; const recentQuips = [];
  root.innerHTML = `
    <div class="ask">
      <div class="ask-log" aria-live="polite" aria-relevant="additions"></div>
      <div class="ask-suggest" aria-label="Suggestions"></div>
      <p class="fine ask-note">Enter sends · Shift+Enter new line · <span class="where-note">answers come from the model named at the top right</span>. Patch's commentary is never the answer.</p>
    </div>`;
  const log = root.querySelector('.ask-log'); const suggest = root.querySelector('.ask-suggest');
  const sendLabel = sendBtn.textContent;
  // Commands ("play level 3") are routed even while an answer streams; a new question waits its turn.
  const submit = () => { const t = input.value.trim(); if (!t) return; if (onSubmit?.(t)) { input.value = ''; autosize(); return; } if (controller) { onPatch?.('busy', 'One answer at a time. Yours stays in the box; press Stop, or send it when this one finishes.'); return; } input.value = ''; autosize(); ask(t); };
  const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(160, input.scrollHeight) + 'px'; };
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } });
  sendBtn.addEventListener('click', (e) => { e.preventDefault(); if (controller) controller.abort(); else submit(); });
  const setBusy = (b) => { sendBtn.textContent = b ? 'Stop' : sendLabel; sendBtn.classList.toggle('stop', b); sendBtn.classList.toggle('ghost', b); sendBtn.classList.toggle('primary', !b); sendBtn.setAttribute('aria-label', b ? 'Stop the answer' : 'Ask Patch'); };

  function setSuggestions(list) {
    suggest.innerHTML = list.map((t) => `<button type="button" class="chip-btn">${esc(t)}</button>`).join('');
    suggest.querySelectorAll('.chip-btn').forEach((b) => b.addEventListener('click', () => { if (controller) { input.value = b.textContent; input.focus(); return; } input.value = b.textContent; submit(); }));
  }
  setSuggestions(SUGGESTIONS.home);

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
    const el = bubble('assistant', '<div class="answer"><p class="fine wait-line">Waiting for the model…</p></div><div class="msg-meta fine"></div>');
    if (isRetry) el.dataset.autoretried = '1';
    const ans = el.querySelector('.answer'); const meta = el.querySelector('.msg-meta');
    const waitStart = performance.now();
    const waitTimer = setInterval(() => {
      const w = ans.querySelector('.wait-line'); if (!w) { clearInterval(waitTimer); return; }
      if (w.classList.contains('queued')) return;
      const s = Math.round((performance.now() - waitStart) / 1000);
      w.textContent = s < 8 ? 'Waiting for the model…' : `Waiting for the model… ${s} s. ${window.__provider === 'vertex' ? 'The cloud model is slower than usual; it usually recovers on its own.' : 'After a quiet spell the first answer can take up to a minute while the model loads into the GPU.'}`;
    }, 1000);
    controller = new AbortController(); setBusy(true);
    let retrying = false; let acc = ''; const seenTopics = new Set(); let lastRender = 0; let failed = null; let demo = false; let truncated = false; let cancelledFlag = false;
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
          if (ev === 'status' && data.state === 'queued') { ans.innerHTML = '<p class="fine wait-line queued">Queued behind another answer…</p>'; stopQuips(); startQuips('queued'); }
          if (ev === 'status' && data.state === 'started') { demo = !!data.demo; meta.textContent = data.model; }
          if (ev === 'status' && data.state === 'truncated') { truncated = true; meta.textContent += ' · stopped at the length limit'; }
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
      if (truncated) {
        const more = document.createElement('button'); more.className = 'btn small continue'; more.textContent = 'Continue the answer';
        more.addEventListener('click', () => { more.remove(); ask('Continue exactly where you stopped, without repeating what you already wrote.'); });
        ans.append(more);
        stopQuips(); onPatch?.('neutral', 'I ran out of room before I ran out of opinions. Press Continue for the rest.', { commentary: true });
      } else { stopQuips(); onPatch?.('delighted', pickQuip('done'), { commentary: true }); }
      if (!demo && acc) feedbackRow(el, history.slice(-8));
    } catch (err) {
      stopQuips();
      const cancelled = err.name === 'AbortError' || /cancel/i.test(err.message);
      // A network-level failure (the request never reached the server, or the connection dropped
      // before any text arrived) is usually transient: retry once by itself before bothering the learner.
      const network = !cancelled && err instanceof TypeError;
      if (network && !acc && !isRetry && !el.dataset.autoretried) {
        clearInterval(waitTimer); controller = null; setBusy(false);
        el.remove(); retrying = true; setTimeout(() => ask(text, true), 1500); return;
      }
      cancelledFlag = cancelled; if (!cancelled) failed = failed || err.message;
      const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      const why = network
        ? `Could not reach the studio server${acc ? ' (the connection dropped mid-answer)' : ''}. Check your connection and try again.${local ? '' : ' On the computer that runs the studio, open <a href="http://localhost:8790/">http://localhost:8790</a> instead: some home routers drop requests that leave and re-enter the same network.'}`
        : esc(err.message);
      ans.innerHTML = renderMarkdown(acc) + `<p class="error-line">${cancelled ? 'Stopped. The partial answer above is kept.' : why}</p>`;
      if (!cancelled) {
        const retry = document.createElement('button'); retry.className = 'btn small'; retry.textContent = 'Try again';
        retry.addEventListener('click', () => { el.remove(); ask(text, true); }); ans.append(retry);
      } else if (acc) history.push({ role: 'assistant', content: acc });
      onPatch?.(cancelled ? 'neutral' : 'alarmed', pickQuip(cancelled ? 'cancelled' : 'error'), { commentary: true });
    } finally {
      clearInterval(waitTimer);
      if (retrying) return;
      controller = null; setBusy(false); onStreamEnd?.({ truncated, cancelled: cancelledFlag, failed: !!failed && !cancelledFlag });
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

  // An answer the studio can give by itself (progress, navigation): no model call, labelled as such.
  function local(question, markdown, note = 'answered by the studio from your saved progress · no model call') {
    if (question) bubble('user', `<p>${esc(question)}</p>`);
    bubble('assistant', `<div class="answer">${renderMarkdown(markdown)}</div><div class="msg-meta fine">${esc(note)}</div>`);
  }

  return {
    ask: (t) => { if (controller) { input.value = t; input.focus(); onPatch?.('busy', 'One answer at a time. Yours is queued in the box; send it when this one finishes.'); } else ask(t); },
    prefill: (t) => { input.value = t; autosize(); input.focus(); },
    local, setSuggestions, busy: () => !!controller, count: () => history.length,
  };
}
