// Boss rush: practice questions with streaks, mistake review and bookmarks.
import { store } from './store.js';
import { react } from './persona.js';
import { DOMAINS } from './missions.js';
import { mountAsk } from './chat.js';

// Approximate mapping from the bank's ten domains to the five published exam domains.
export const DOMAIN_MAP = {
  'Agent orchestration': 'D1', 'Application design': 'D1', 'Claude Code workflows': 'D2',
  'Prompt and output design': 'D3', Evaluation: 'D3', 'Tool use': 'D4', MCP: 'D4', 'Security and trust': 'D4',
  'Context and retrieval': 'D5', Reliability: 'D5',
};
const WEIGHTED = { D1: 5, D2: 4, D3: 4, D4: 4, D5: 3 }; // 27/20/20/18/15 % of a 20-question run

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\b(stop_reason|tool_use|tool_result|end_turn|tool_use_id|max_tokens|is_error|tool_choice)\b(?![^<]*<\/code>)/g, '<code>$1</code>');
function shuffle(a, rnd = Math.random) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export async function loadBank() {
  const r = await fetch('/api/questions');
  if (!r.ok) throw new Error(`Question bank unavailable (${r.status}).`);
  const data = await r.json();
  return { questions: Array.isArray(data) ? data : data.questions || [], source: r.headers.get('X-Bank-Source') || 'unknown' };
}

export function mountQuiz(root, { bank, onPatch, onXp }) {
  const qs = bank.questions;
  const byId = new Map(qs.map((q) => [q.id, q]));
  let run = null;

  function home() {
    const q = store.quiz;
    const answered = Object.keys(q.answers).length;
    const correct = Object.values(q.answers).filter((a) => a.correct).length;
    const domains = [...new Set(qs.map((x) => x.domain))].sort();
    const mastery = domains.map((d) => {
      const ids = qs.filter((x) => x.domain === d).map((x) => x.id);
      const seen = ids.filter((id) => q.answers[id]); const ok = seen.filter((id) => q.answers[id].correct);
      return { d, total: ids.length, seen: seen.length, ok: ok.length };
    });
    root.innerHTML = `
      <div class="quiz-home">
        <h2>Questions · ${qs.length} original practice items</h2>
        <p class="fine">${qs.length} original practice questions. Not official or leaked exam items. ${bank.source === 'sample' ? '<strong>Sample bank loaded</strong>: connect your full bank (README).' : ''}</p>
        <div class="quiz-stats"><div><b>${answered}</b><span>answered</span></div><div><b>${answered ? Math.round((correct / answered) * 100) : 0}%</b><span>correct</span></div><div><b>${q.mistakes.length}</b><span>to review</span></div><div><b>${q.bookmarks.length}</b><span>bookmarked</span></div></div>
        <div class="quiz-modes">
          <button class="btn primary" data-mode="all">${q.full && q.full.i > 0 && q.full.i < q.full.order.length ? `Resume full test · question ${q.full.i + 1} of ${q.full.order.length}` : `Full test · all ${qs.length} questions`}</button>
          <button class="btn" data-mode="shift">Night shift · 12 questions, 3 pages</button>
          <button class="btn" data-mode="weighted">Exam-weighted run · 20</button>
          <button class="btn" data-mode="mistakes" ${q.mistakes.length ? '' : 'disabled'}>Review mistakes · ${q.mistakes.length}</button>
          <button class="btn" data-mode="bookmarks" ${q.bookmarks.length ? '' : 'disabled'}>Bookmarks · ${q.bookmarks.length}</button>
        </div>
        <h3 class="h-sub">Drill a domain</h3>
        <ul class="mastery">${mastery.map((m) => `<li><button class="mastery-row" data-domain="${esc(m.d)}"><span>${esc(m.d)}</span><span class="bar" aria-hidden="true"><i style="width:${(m.ok / m.total) * 100}%"></i></span><span class="fine">${m.ok}/${m.total}</span></button></li>`).join('')}</ul>
        <p class="fine">Full test: every question in the bank once, shuffled, saved after each answer so you can stop and resume. ${q.full?.done ? `Last full test: <b>${q.full.lastScore}%</b>.` : ''}${q.full && q.full.i > 0 && q.full.i < q.full.order.length ? ` <button class="btn small ghost" data-restart-full>Start the full test over</button>` : ''}</p>
        <p class="fine">Every question has Patch underneath it: ask for a hint before you answer, or keep asking follow-ups after.</p>
        <p class="fine">Night shift: exam-weighted questions, hardest last. Each wrong answer pages you; three pages end the shift. Best shift so far: <b>${q.shiftBest || 0}</b> survived.</p>
        <p class="fine">Weighted runs map the bank's ten topics onto the five published exam domains (${Object.entries(WEIGHTED).map(([k, v]) => `${k} ${v}`).join(', ')} questions). The mapping is ours and approximate.</p>
      </div>`;
    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => start(b.dataset.mode)));
    root.querySelectorAll('[data-domain]').forEach((b) => b.addEventListener('click', () => start('domain', b.dataset.domain)));
    root.querySelector('[data-restart-full]')?.addEventListener('click', () => { const qq = store.quiz; delete qq.full; store.saveQuiz(qq); start('all'); });
  }

  function pick(mode, domain) {
    const q = store.quiz;
    if (mode === 'mistakes') return shuffle(q.mistakes.map((id) => byId.get(id)).filter(Boolean)).slice(0, 20);
    if (mode === 'bookmarks') return q.bookmarks.map((id) => byId.get(id)).filter(Boolean);
    if (mode === 'domain') return shuffle(qs.filter((x) => x.domain === domain)).slice(0, 10);
    if (mode === 'exam') return shuffle(qs.filter((x) => DOMAIN_MAP[x.domain] === domain)).slice(0, 10); // one published exam domain (D1–D5)
    if (mode === 'shift') {
      // 12 questions: weighted by domain, ordered easy → hard, Advanced boss at the end.
      const rankD = { Foundational: 0, Applied: 1, Advanced: 2 };
      const perDom = { D1: 3, D2: 3, D3: 2, D4: 2, D5: 2 }; const out = [];
      for (const [dom, n] of Object.entries(perDom)) out.push(...shuffle(qs.filter((x) => DOMAIN_MAP[x.domain] === dom)).slice(0, n));
      return out.sort((a, b) => rankD[a.difficulty] - rankD[b.difficulty]);
    }
    // weighted: prefer unseen questions, then ones answered wrong
    const out = [];
    for (const [dom, n] of Object.entries(WEIGHTED)) {
      const pool = qs.filter((x) => DOMAIN_MAP[x.domain] === dom);
      const rank = (x) => (!q.answers[x.id] ? 0 : !q.answers[x.id].correct ? 1 : 2);
      out.push(...shuffle(pool).sort((a, b) => rank(a) - rank(b)).slice(0, n));
    }
    return shuffle(out);
  }

  function start(mode, domain) {
    if (mode === 'all') {
      const qq = store.quiz; let f = qq.full;
      const valid = f && Array.isArray(f.order) && f.order.length === qs.length && f.order.every((id) => byId.has(id)) && f.i < f.order.length;
      if (!valid) { f = { order: shuffle(qs).map((x) => x.id), i: 0, right: 0, perDomain: {} }; qq.full = f; store.saveQuiz(qq); }
      run = { mode, list: f.order.map((id) => byId.get(id)), i: f.i, streak: 0, right: f.right, perDomain: { ...f.perDomain }, pages: 0, maxPages: Infinity, over: false };
      onPatch?.('busy', f.i ? `Back at question ${f.i + 1} of ${qs.length}. Your place was kept, unlike most production state.` : `All ${qs.length} questions, once each. Stop whenever; I keep your place.`);
      show(); return;
    }
    const list = pick(mode, domain);
    if (!list.length) return;
    run = { mode, domain, list, i: 0, streak: 0, right: 0, perDomain: {}, pages: 0, maxPages: mode === 'shift' ? 3 : Infinity, over: false };
    if (mode === 'shift') onPatch?.('busy', 'Night shift. Twelve calls, three pages. Coffee is theoretical.');
    show();
  }

  function show() {
    run.lastChoice = null;
    const item = run.list[run.i];
    const q = store.quiz;
    const order = shuffle(Object.keys(item.options));
    run.letter = Object.fromEntries(order.map((k, i) => [k, 'ABCD'[i]])); run.order = order; // what the learner sees
    const marked = q.bookmarks.includes(item.id);
    root.innerHTML = `
      <div class="quiz-card" data-qid="${esc(item.id)}">
        <div class="quiz-top">
          <span class="fine">${run.i + 1} / ${run.list.length}</span>
          <span class="chip">${esc(item.domain)}</span><span class="chip ghost">${esc(item.difficulty)}</span>
          <span class="streak" aria-live="polite">${run.streak > 1 ? `Streak ${run.streak}` : ''}</span>
          ${run.mode === 'shift' ? `<span class="pager" title="Pages left before the shift ends: ${run.maxPages - run.pages} (each wrong answer pages you)" aria-label="${run.maxPages - run.pages} pages left">${'●'.repeat(run.maxPages - run.pages)}${'○'.repeat(run.pages)}</span>` : ''}
          ${run.i === run.list.length - 1 && run.mode === 'shift' ? '<span class="chip boss">Boss call</span>' : ''}
          <button class="btn small ghost bm" aria-pressed="${marked}">${marked ? 'Bookmarked' : 'Bookmark'}</button>
          <button class="btn small ghost end-run" title="Stop this run and see the results so far">End run</button>
        </div>
        <p class="badge-original">Original practice question · not an official or leaked exam item</p>
        <h3 class="quiz-stem">${fmt(item.stem || item.question.split('\n')[0])}</h3>
        <ol class="options" role="list">${order.map((k, i) => `<li><button class="option" data-key="${k}"><span class="opt-key">${'ABCD'[i]}</span><span class="opt-text">${fmt(item.options[k])}</span></button><div class="opt-why" hidden></div></li>`).join('')}</ol>
        <div class="quiz-after" hidden></div>
        <p class="fine kbd-hint">Keys 1–4 choose · Enter continues</p>
        <section class="tutor" aria-label="Ask Patch about this question">
          <h4 class="tutor-h">Ask Patch about this question</h4>
          <form class="tutor-bar" autocomplete="off"><label class="sr-only" for="tutor-input">Your question for Patch</label><textarea id="tutor-input" rows="1" maxlength="2000" placeholder="Stuck? Ask for a hint. Answered? Ask why, or keep asking follow-ups…"></textarea><button type="submit" class="btn primary tutor-send">Ask</button></form>
          <div class="tutor-mount"></div>
        </section>
      </div>`;
    mountTutor(item);
    root.querySelector('.end-run').addEventListener('click', () => { run.i = Math.max(run.i, 0); results(); });
    const bm = root.querySelector('.bm');
    bm.addEventListener('click', () => {
      const qq = store.quiz; const has = qq.bookmarks.includes(item.id);
      qq.bookmarks = has ? qq.bookmarks.filter((x) => x !== item.id) : [...qq.bookmarks, item.id]; store.saveQuiz(qq);
      bm.setAttribute('aria-pressed', String(!has)); bm.textContent = has ? 'Bookmark' : 'Bookmarked';
    });
    const buttons = [...root.querySelectorAll('.option')];
    buttons.forEach((b) => b.addEventListener('click', () => answer(item, b.dataset.key, buttons)));
    buttons[0].focus({ preventScroll: true });
    root.onkeydown = (e) => {
      if (e.target.closest?.('textarea, input')) return; // typing to Patch must not answer the question
      if (/^[1-4]$/.test(e.key) && !root.querySelector('.option[disabled]')) { buttons[+e.key - 1]?.click(); }
      if (e.key === 'Enter' && root.querySelector('.next')) { e.preventDefault(); root.querySelector('.next').click(); }
    };
  }

  function answer(item, key, buttons) {
    run.lastChoice = key;
    const correct = key === item.correct_option;
    const q = store.quiz;
    q.answers[item.id] = { correct, chosen: key, d: DOMAIN_MAP[item.domain] || null, at: Date.now() };
    if (correct) q.mistakes = q.mistakes.filter((x) => x !== item.id); else if (!q.mistakes.includes(item.id)) q.mistakes.push(item.id);
    run.streak = correct ? run.streak + 1 : 0; if (correct) run.right++;
    if (!correct) { run.pages++; if (run.pages >= run.maxPages) run.over = true; }
    const streakEl = root.querySelector('.streak'); if (streakEl) streakEl.textContent = run.streak > 1 ? `Streak ${run.streak}` : '';
    const pagerEl = root.querySelector('.pager'); if (pagerEl) { pagerEl.textContent = '●'.repeat(run.maxPages - run.pages) + '○'.repeat(run.pages); pagerEl.title = `Pages left before the shift ends: ${run.maxPages - run.pages}`; }
    q.streakBest = Math.max(q.streakBest || 0, run.streak);
    store.saveQuiz(q);
    const pd = (run.perDomain[item.domain] ||= { ok: 0, n: 0 }); pd.n++; if (correct) pd.ok++;
    if (run.mode === 'all') { q.full = { ...(q.full || {}), order: run.list.map((x) => x.id), i: run.i + 1, right: run.right, perDomain: run.perDomain }; store.saveQuiz(q); }
    onXp?.(correct ? 10 + Math.min(run.streak, 5) * 2 : 2);
    buttons.forEach((b) => {
      b.disabled = true;
      const k = b.dataset.key; const why = b.parentElement.querySelector('.opt-why');
      b.classList.toggle('is-correct', k === item.correct_option); b.classList.toggle('is-chosen', k === key);
      const r = item.distractor_rationales?.[k];
      if (r) { why.hidden = false; why.innerHTML = fmt(r.replace(/^Correct:\s*/i, '')); }
    });
    const norm = (x) => String(x || '').toLowerCase().replace(/^(correct:|objective:)\s*/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const shownRationale = norm(item.distractor_rationales?.[item.correct_option]);
    const reason = (item.reference_reasoning || '').split(/\n\n/)[0];
    const showReason = reason && !shownRationale.includes(norm(reason)) && !norm(reason).includes(shownRationale);
    const objTail = (item.learning_objective || '').split(':').slice(1).join(':').trim() || item.learning_objective || '';
    const showObjective = objTail && !shownRationale.includes(norm(objTail)) && !norm(reason).includes(norm(objTail));
    const after = root.querySelector('.quiz-after'); after.hidden = false;
    after.innerHTML = `
      <p class="verdict ${correct ? 'ok' : 'bad'}">${correct ? 'Correct.' : `Not this time. The keyed answer is ${run.letter[item.correct_option]}.`}</p>
      ${showReason ? `<p>${fmt(reason)}</p>` : ''}
      ${showObjective ? `<p class="fine"><b>Objective:</b> ${fmt(item.learning_objective)}</p>` : item.learning_objective ? `<p class="fine"><b>Topic:</b> ${esc((item.learning_objective.split(':')[0] || item.topic).trim())}</p>` : ''}
      ${item.sources?.length ? `<p class="fine sources">Check it: ${item.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join(' · ')}</p>` : ''}
      <div class="row"><button class="btn primary next">${run.over ? 'See the shift report' : run.i < run.list.length - 1 ? 'Next question' : 'See results'}</button><button class="btn ghost ask-q">Explain it, Patch</button></div>`;
    after.querySelector('.next').addEventListener('click', () => { run.i++; !run.over && run.i < run.list.length ? show() : results(); });
    after.querySelector('.ask-q').addEventListener('click', () => {
      const k = run.letter[item.correct_option], mine = run.letter[key];
      tutor?.ask(`Explain why ${k} is the best answer and why ${correct ? 'the other options' : mine} fall${correct ? '' : 's'} short, with one concrete example from a real system, and finish with a one-line memory hook for the exam.`);
    });
    tutor?.setSuggestions(correct
      ? ['Walk me through every option', 'Give me a real-world example of this', 'Give me a harder variant to try', 'What would change the answer?']
      : [`Why is ${run.letter[key]} wrong?`, `Why is ${run.letter[item.correct_option]} right?`, 'Give me a real-world example of this', 'Give me a memory hook for this']);
    const r = correct && run.streak >= 3 ? react('streak', run.streak) : react(correct ? 'correct' : 'wrong');
    if (run.mode === 'shift' && !correct) onPatch?.(run.over ? 'facepalm' : 'alarmed', run.over ? 'Third page. The shift is over. Go home; the mistakes pile will still be here.' : `Paged. ${run.maxPages - run.pages} left before the shift ends.`);
    else onPatch?.(r.pose, r.line);
    after.querySelector('.next').focus({ preventScroll: true });
  }

  function results() {
    const answered = Math.min(run.i, run.list.length);
    if (run.mode === 'all') {
      const qq = store.quiz; const finished = answered >= run.list.length; const pctA = answered ? Math.round((run.right / answered) * 100) : 0;
      if (finished) { qq.full = { done: true, lastScore: pctA, order: [], i: 0 }; store.saveQuiz(qq); onXp?.(100); }
      root.innerHTML = `
        <div class="quiz-results">
          <p class="big-grade">${pctA}%</p><p>${run.right} of ${answered} correct${finished ? ` · full test of ${run.list.length} complete` : ` · ${run.list.length - answered} left. Your place is saved.`}</p>
          <ul class="mastery">${Object.entries(run.perDomain).sort().map(([d, v]) => `<li class="mastery-row static"><span>${esc(d)} <span class="fine">(${DOMAINS[DOMAIN_MAP[d]] || ''})</span></span><span class="fine">${v.ok}/${v.n} · ${Math.round((v.ok / v.n) * 100)}%</span></li>`).join('')}</ul>
          <div class="quiz-modes">${finished ? '<button class="btn primary" data-go="mistakes">Review my mistakes</button>' : '<button class="btn primary" data-go="all">Resume the full test</button>'}<button class="btn back">All modes</button></div>
        </div>`;
      root.querySelector('[data-go]')?.addEventListener('click', (e) => start(e.target.dataset.go));
      root.querySelector('.back').addEventListener('click', home);
      onPatch?.(pctA >= 80 ? 'delighted' : 'neutral', finished ? `Full bank done at ${pctA}%. ${pctA >= 80 ? 'That is exam shape.' : 'The mistakes pile is your study plan now.'}` : 'Paused. I wrote your place on the clipboard.');
      return;
    }
    const pct = Math.round((run.right / run.list.length) * 100);
    if (run.mode === 'shift') { const q = store.quiz; q.shiftBest = Math.max(q.shiftBest || 0, answered - run.pages); store.saveQuiz(q); if (!run.over) onXp?.(40); }
    root.innerHTML = `
      <div class="quiz-results">
        ${run.mode === 'shift' ? `<p class="stamp ${run.over ? 'fail' : 'pass'}">${run.over ? 'Paged out' : 'Shift survived'}</p><p>${run.right} right, ${run.pages} page${run.pages === 1 ? '' : 's'}, ${answered} of ${run.list.length} calls taken.</p>` : `<p class="big-grade">${pct}%</p><p>${run.right} of ${run.list.length} correct.</p>`}
        <ul class="mastery">${Object.entries(run.perDomain).map(([d, v]) => `<li class="mastery-row static"><span>${esc(d)} <span class="fine">(${DOMAINS[DOMAIN_MAP[d]] || ''})</span></span><span class="fine">${v.ok}/${v.n}</span></li>`).join('')}</ul>
        <div class="quiz-modes"><button class="btn primary again">Another run</button><button class="btn back">All modes</button></div>
      </div>`;
    root.querySelector('.again').addEventListener('click', () => start(run.mode, run.domain));
    root.querySelector('.back').addEventListener('click', home);
    onPatch?.(pct >= 80 ? 'delighted' : pct >= 60 ? 'smug' : 'neutral', pct >= 80 ? 'That run would pass a code review. Possibly two.' : pct >= 60 ? 'Respectable. The mistakes pile is now your study plan.' : 'Rough night. Review the mistakes; that is what they are for.');
  }

  // One tutor thread per question: follow-ups keep the question and the earlier answers in view.
  let tutor = null;
  function mountTutor(item) {
    const sec = root.querySelector('.tutor');
    tutor = mountAsk(sec.querySelector('.tutor-mount'), {
      input: sec.querySelector('textarea'), sendBtn: sec.querySelector('.tutor-send'),
      onPatch: (p, l, o) => onPatch?.(p, l, o),
      getContext: () => `studio section: Questions. ${current()}`,
    });
    sec.querySelector('form').addEventListener('submit', (e) => e.preventDefault());
    tutor.setSuggestions(['Give me a hint without revealing the answer', 'What concept is this question testing?', 'Explain the key terms in this question']);
  }

  home();
  // What Patch can see when the learner asks from the ask bar mid-question.
  function current() {
    if (!run || run.i >= run.list.length) return '';
    const item = run.list[run.i]; const stem = (item.stem || item.question.split('\n')[0]).slice(0, 260);
    const L = run.letter || {}; const keys = run.order || Object.keys(item.options);
    const opts = keys.map((k) => `${L[k] || k}) ${String(item.options[k]).slice(0, 110)}`).join(' ');
    const answered = run.lastChoice && root.querySelector('.option[disabled]');
    return `practice question ${item.id} (${item.domain}), options as the learner sees them: "${stem}" ${opts}. ${answered ? `Keyed answer ${L[item.correct_option]}; learner chose ${L[run.lastChoice]} (${run.lastChoice === item.correct_option ? 'correct' : 'wrong'}).` : `The learner has NOT answered yet: give hints and teach the concept, but do not reveal or hint at which letter is correct. (Keyed answer for your reference only: ${L[item.correct_option]}.)`}`;
  }
  return { home, start, current, inRun: () => !!run && run.i < run.list.length };
}
