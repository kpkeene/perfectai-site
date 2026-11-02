import { Schematic } from './schematic.js';
import { Player } from './player.js';
import { MISSIONS, DOMAINS, resetToolIds } from './missions.js';
import { COMPONENTS, SCENARIOS, byId, evaluate, designGraph, EXAMPLE_DESIGNS } from './builder-rules.js';
import { store } from './store.js';
import { portraitSVG, markerSVG, pagerSVG } from './portrait.js';
import { loadBank, mountQuiz } from './quiz.js';
import { mountAsk, SUGGESTIONS } from './chat.js';
import { react } from './persona.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const settings = store.settings;
document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);

// ---------------- Patch ----------------
const patch = {
  el: $('#patch-portrait'), line: $('#patch-line'), tag: $('#patch-tag'),
  say(pose, text, { commentary = false } = {}) {
    this.el.innerHTML = portraitSVG(pose, 78);
    this.line.textContent = text;
    this.tag.textContent = commentary ? 'Commentary while the answer streams · not the answer, not reasoning' : '';
  },
};
patch.say('neutral', 'Night shift. Everything is quiet. That is what worries me.');

// ---------------- Stage ----------------
const stageHost = $('#stage-3d'); const schemHost = $('#stage-2d');
// The 3D stage (three.js, ~185 KB) loads after the first paint; until then calls are queued and replayed in order.
function makeLateStage() {
  const queue = []; let real = null;
  const api = {
    get ready() { return !!real; }, get failed() { return real ? real.failed : false; }, get nodes() { return real ? real.nodes : new Map(); },
    stats() { return real ? real.stats() : null; }, bench(ms) { return real ? real.bench(ms) : Promise.resolve(null); },
    flow(...a) { return real ? real.flow(...a) : Promise.resolve(); },
    attach(s) { real = s; queue.splice(0).forEach((fn) => fn(s)); },
  };
  for (const m of ['setGraph', 'resize', 'orbit', 'zoom', 'fit', 'on', 'setStatus', 'resetStatuses', 'setGate', 'setContext', 'select', 'kick']) {
    api[m] = (...a) => { if (real) return real[m](...a); queue.push((st) => st[m](...a)); };
  }
  return api;
}
const stage = makeLateStage();
const schematic = new Schematic(schemHost);
let webglOk = true;
let view2d = settings.view2d;
function loadStage() {
  import('./stage.js').then(({ Stage }) => {
    const real = new Stage(stageHost, { lowGpu: settings.lowGpu, reducedMotion: settings.reducedMotion });
    webglOk = !real.failed;
    stage.attach(real);
  }).catch((e) => { console.warn('3D stage unavailable', e); webglOk = false; })
    .finally(() => { $('#stage-loading').hidden = true; if (!webglOk) { view2d = true; $('#webgl-note').hidden = false; } apply2d(); });
}
const player = new Player([stage, schematic], { reducedMotion: settings.reducedMotion });
let currentGraph = null; let currentReset = null;

function setGraph(graph, title, resetFn, hint = '') {
  currentGraph = graph; currentReset = resetFn;
  stage.setGraph(graph); schematic.setGraph(graph);
  $('#stage-title').textContent = title;
  $('#inspector').hidden = true;
  player.clear(resetFn);
  $('#steps-list').innerHTML = '';
  $('#caption').textContent = hint;
}
function apply2d() {
  stageHost.hidden = view2d; schemHost.hidden = !view2d;
  $('#btn-2d').setAttribute('aria-pressed', String(view2d)); $('#btn-2d').textContent = view2d ? '3D view' : '2D view';
  ['#btn-rot-l', '#btn-rot-r', '#btn-zoom-in', '#btn-zoom-out', '#btn-reset-view'].forEach((s) => { $(s).disabled = view2d; });
  if (!view2d) stage.resize();
}
apply2d();

function inspect(node) {
  if (!node) return;
  const box = $('#inspector'); box.hidden = false;
  const status = stage.nodes.get(node.id)?.status || 'idle';
  box.innerHTML = `<div class="insp-head"><b>${esc(node.label)}</b><span class="status-chip" data-status="${status}">${status}</span><button class="btn small ghost" id="insp-close" aria-label="Close details">Close</button></div>
    <p>${esc(node.role)}</p>
    <dl class="contract"><dt>Input</dt><dd><code>${esc(node.input)}</code></dd><dt>Output</dt><dd><code>${esc(node.output)}</code></dd></dl>`;
  $('#insp-close').addEventListener('click', () => { box.hidden = true; });
}
stage.on('select', inspect); schematic.on('select', inspect);

player.on('beat', ({ index, beat }) => {
  $('#caption').innerHTML = `<span class="step-n">Step ${index + 1}</span> ${esc(beat.caption)}`;
  const list = $('#steps-list');
  while (list.children.length > index) list.lastChild.remove();
  const li = document.createElement('li'); li.textContent = beat.caption; list.append(li);
});
player.on('change', (s) => {
  $('#btn-pause').textContent = s.paused ? 'Play' : 'Pause';
  $('#btn-pause').setAttribute('aria-pressed', String(s.paused));
  $('#btn-pause').disabled = !s.paused && s.pending <= 0 && !player.busy;
  $('#btn-prev').disabled = s.index <= 0; $('#btn-next').disabled = s.pending <= 0;
  $('#step-count').textContent = s.total ? `${Math.max(0, s.index + 1)} / ${s.total}` : '';
  document.dispatchEvent(new CustomEvent('player-change', { detail: s }));
});

$('#btn-pause').addEventListener('click', () => player.toggle());
$('#btn-prev').addEventListener('click', () => player.prev());
$('#btn-next').addEventListener('click', () => player.next());
$('#btn-replay').addEventListener('click', () => player.replay());
$('#btn-rot-l').addEventListener('click', () => stage.orbit(-0.35, 0));
$('#btn-rot-r').addEventListener('click', () => stage.orbit(0.35, 0));
$('#btn-zoom-in').addEventListener('click', () => stage.zoom(0.82));
$('#btn-zoom-out').addEventListener('click', () => stage.zoom(1.2));
$('#btn-reset-view').addEventListener('click', () => stage.fit());
$('#btn-2d').addEventListener('click', () => { view2d = !view2d; apply2d(); });
$('#btn-expand').addEventListener('click', () => {
  const on = !$('#workspace').classList.contains('expanded');
  $('#workspace').classList.toggle('expanded', on);
  $('#btn-expand').setAttribute('aria-pressed', String(on)); $('#btn-expand').textContent = on ? 'Exit wide view' : 'Wide view';
  requestAnimationFrame(() => stage.resize());
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#workspace').classList.contains('expanded')) $('#btn-expand').click();
});

// ---------------- XP ----------------
const RANKS = [[0, 'Intern'], [250, 'Architect'], [700, 'Senior'], [1500, 'Principal'], [3000, 'Warden']];
function renderXp() {
  const xp = store.progress.xp || 0;
  let i = RANKS.findIndex(([min]) => xp < min); if (i === -1) i = RANKS.length; const cur = RANKS[i - 1], next = RANKS[i];
  const pct = next ? Math.round(((xp - cur[0]) / (next[0] - cur[0])) * 100) : 100;
  $('#xp').innerHTML = `<span>${xp} XP · ${cur[1]}</span><span class="xp-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>`;
  $('#xp').title = next ? `${next[0] - xp} XP to ${next[1]}` : 'Top rank';
}
const addXp = (n) => { store.addXp(n); renderXp(); };
renderXp();

// ---------------- Views ----------------
const views = ['missions', 'builder', 'quiz', 'settings'];
const VIEW_NAMES = { missions: 'Missions', builder: 'Builder', quiz: 'Questions', settings: 'Settings' };
let currentView = null;
function show(viewName, { rehome = false } = {}) {
  if (viewName === 'ask') { openAsk(); return; } // the tutor is a layer over every view, not a view
  if (!views.includes(viewName)) viewName = 'missions';
  if (asking) closeAsk({ silent: true });
  if (viewName === currentView) {
    if (rehome) { if (viewName === 'missions') missionsHome(); if (viewName === 'quiz') quizApi?.home(); if (viewName === 'builder') builderOpen(); }
    syncHash(); return;
  }
  currentView = viewName;
  $('#workspace').dataset.view = viewName;
  views.forEach((v) => { $(`#view-${v}`).hidden = v !== viewName; });
  $$('.nav button').forEach((b) => b.setAttribute('aria-current', b.dataset.view === viewName ? 'page' : 'false'));
  if (viewName === 'missions') missionsHome();
  if (viewName === 'builder') builderOpen();
  if (viewName === 'quiz') quizOpen();
  if (viewName === 'settings') settingsOpen();
  syncHash(); refreshAskBar();
  requestAnimationFrame(() => stage.resize());
}
function syncHash() { const h = `#${currentView}${asking ? '/ask' : ''}`; if (location.hash !== h) history.replaceState(null, '', h); }
$$('.nav button').forEach((b) => b.addEventListener('click', () => (b.dataset.view === 'ask' ? toggleAsk() : show(b.dataset.view, { rehome: true }))));
window.addEventListener('hashchange', () => { const [v, sub] = location.hash.slice(1).split('/'); show(v); if (sub === 'ask') openAsk(); });

// ---------------- Missions ----------------
let run = null;
function missionsHome() {
  run = null;
  const prog = store.progress.missions;
  const m1 = MISSIONS[0];
  setGraph(m1.graph, 'Level 1 diorama · North Basin Pump Station (synthetic)', () => { stage.setContext?.('ctx', 2400, 12000); schematic.setContext('ctx', 2400, 12000); });
  player.load(m1.startBeats(), currentReset);
  $('#view-missions').innerHTML = `
    <div class="intro">
      <h1>Night shift at the architecture office</h1>
      <p class="lede">Play the agent loop through five synthetic incidents: valves, specs, refunds, a Friday deploy and three MCP servers. Choose every tool call, watch it run on the brick table, and find out what a production system would have done to you.</p>
      <p><button class="btn primary" id="start-l1">Start Level 1</button> <span class="fine">or pick a level, or just tell Patch:</span></p>
      <div class="try-row">${['Teach me the agent loop', 'Quiz me on MCP', 'Play the refund incident', 'Help me design a refund agent', 'How am I doing?'].map((t) => `<button type="button" class="chip-btn" data-say="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </div>
    <ol class="levels">${MISSIONS.map((m) => {
      const p = prog[m.id];
      return `<li><button class="level" data-mission="${m.id}">
        <span class="marker">${markerSVG(m.marker, p ? (p.grade === 'S' ? 'best' : 'done') : 'open')}</span>
        <span class="level-body"><span class="level-title">${esc(m.title)}</span><span class="level-obj">${esc(m.objective)}</span>
        <span class="chips">${m.domains.map((d) => `<span class="chip" title="${esc(DOMAINS[d])}">${d}</span>`).join('')}${p ? `<span class="chip grade">Best ${p.grade} · ${p.best}</span>` : ''}</span></span><span class="play-cue" aria-hidden="true">Play ▸</span></button></li>`;
    }).join('')}</ol>
    <p class="fine">D1–D5 are the five published exam domains. All scenarios, systems and people are synthetic. Missions are original practice, not exam content.</p>`;
  $$('[data-mission]').forEach((b) => b.addEventListener('click', () => startMission(b.dataset.mission)));
  $('#start-l1').addEventListener('click', () => startMission(MISSIONS[0].id));
  $$('[data-say]').forEach((b) => b.addEventListener('click', () => askPatch(b.dataset.say)));
}

function startMission(id) {
  const m = MISSIONS.find((x) => x.id === id); resetToolIds();
  run = { m, s: m.initial(), log: [], done: false, pages: 0, rang: false };
  setGraph(m.graph, `Level ${m.num} · ${m.title}`, null);
  currentReset = () => { const ctxNode = m.graph.nodes.find((n) => n.kind === 'context'); if (ctxNode) { stage.setContext(ctxNode.id, 0, m.budget); schematic.setContext(ctxNode.id, 0, m.budget); } m.graph.nodes.filter((n) => n.kind === 'gate').forEach((g) => { stage.setGate(g.id, false, { instant: true }); schematic.setGate(g.id, false); }); };
  player.clear(currentReset);
  player.enqueue(...m.startBeats());
  patch.say('neutral', `Level ${m.num}. ${m.objective} No pressure. Some pressure.`);
  renderMission(); refreshAskBar();
}

function renderMission() {
  const { m, s } = run;
  const budgetPct = m.budget ? Math.min(100, Math.round(((s.used ?? 0) / m.budget) * 100)) : 0;
  const hasBudget = s.used !== undefined;
  $('#view-missions').innerHTML = `
    <div class="mission">
      <div class="mission-head">
        <button class="btn small ghost" id="m-back">All levels</button>
        <span class="marker">${markerSVG(m.marker)}</span>
        <div><h2>${esc(m.title)}</h2><p class="fine">${m.domains.map((d) => esc(DOMAINS[d])).join(' · ')}</p></div>
      </div>
      <p class="brief">${esc(m.brief)}</p>
      <div class="hud"><span class="pager ${run.rang ? 'ring' : ''}" title="Pages: how many times production would have paged you (traps and blocked writes). Fewer is better.">${pagerSVG()} paged ${run.pages}×</span><span title="Steps taken">${(s.turn || 0)} step${s.turn === 1 ? '' : 's'}</span><span class="fine">pages = times production would have called you at 3 am</span></div>
      ${hasBudget ? `<div class="budget" role="meter" aria-valuemin="0" aria-valuemax="${m.budget}" aria-valuenow="${s.used}" aria-label="Context used"><div class="budget-bar"><i style="width:${budgetPct}%" class="${budgetPct > 100 || s.over ? 'over' : budgetPct > 80 ? 'warn' : ''}"></i></div><span class="fine">${s.used.toLocaleString()} / ${m.budget.toLocaleString()} tokens in context</span></div>` : ''}
      ${run.done ? debriefHtml() : `<h3 class="h-sub">Your next step</h3><div class="actions" id="actions">${m.actions.filter((a) => a.available(s)).map((a) => `
        <button class="action" data-action="${a.id}" data-type="${a.type === 'trap' ? trapKind(a) : a.type}">
          <span class="action-type">${{ read: 'Read', write: 'Write', meta: 'Decide', finish: 'Finish', trap: { write: 'Write', read: 'Read', meta: 'Decide' }[trapKind(a)] }[a.type]}</span>
          <span class="action-label">${esc(a.label)}</span><code class="action-tool">${esc(a.tool)}</code><span class="action-desc">${esc(a.desc)}</span></button>`).join('')}</div>
        <p class="fine wait-hint" id="wait-hint" hidden>Playing the scene; the next choices unlock in a moment (or press Next on the stage).</p>`}
      <details class="transcript" ${run.log.length ? 'open' : ''}><summary>Message transcript (${run.log.length})</summary>
        <ol>${run.log.map((e) => `<li class="t-${e.kind}">${e.kind === 'note' ? `<p>${esc(e.text).replace(/\n/g, '<br>')}</p>` : `<span class="t-kind">${e.kind.replace('_', ' ')}</span><pre><code>${esc(e.text)}</code></pre>`}</li>`).join('')}</ol>
      </details>
    </div>`;
  $('#m-back').addEventListener('click', missionsHome);
  $$('[data-action]').forEach((b) => b.addEventListener('click', () => doAction(b.dataset.action)));
  if (run.done) { wireDebrief(); scrollPanelTo($('.debrief')); }
  syncActionLock(player.state());
  const t = $('.transcript ol'); if (t) t.scrollTop = t.scrollHeight; // scroll inside the transcript only, never the panel
}

// Scroll the clipboard (not the window) so an element sits near its top.
function scrollPanelTo(el) {
  const side = $('#side'); const behavior = settings.reducedMotion ? 'auto' : 'smooth';
  if (side.scrollHeight > side.clientHeight + 4) side.scrollTo({ top: el.offsetTop - 16, behavior });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior });
}

// Traps are labelled by what they would do, so the type chip never gives the trap away.
function trapKind(a) { return /refund|reset|write|listen|bind|api key|0\.0\.0\.0/i.test(a.tool + ' ' + a.label) ? 'write' : /prompt|permission|skip|follow|log|stdout|console/i.test(a.tool + ' ' + a.label) ? 'meta' : 'read'; }

function syncActionLock(s) {
  const busy = s.pending > 0 || player.busy;
  $$('#actions .action').forEach((b) => { b.disabled = busy; });
  const hint = $('#wait-hint'); if (hint) hint.hidden = !busy;
}
document.addEventListener('player-change', (e) => { if (run && !run.done) syncActionLock(e.detail); });

function doAction(id) {
  const a = run.m.actions.find((x) => x.id === id); if (!a || !a.available(run.s)) return;
  run.s.turn = (run.s.turn || 0) + 1;
  const out = a.run(run.s);
  run.log.push(...out.log);
  player.enqueue(...out.beats);
  if (out.patch) patch.say(out.patch[0], out.patch[1]);
  run.rang = !!(out.blocked || out.page || a.type === 'trap');
  if (run.rang) run.pages++;
  if (out.blocked) addXp(1);
  if (a.type === 'finish') { run.done = true; run.result = run.m.score(run.s); const rec = store.recordMission(run.m.id, run.result); addXp(Math.round(run.result.total / 2)); run.best = rec; }
  renderMission();
}

function debriefHtml() {
  const r = run.result;
  return `<div class="debrief">
    <div class="grade-row"><span class="stamp big fresh ${r.grade === 'S' || r.grade === 'A' ? 'pass' : r.grade === 'B' ? 'warn' : 'fail'}">Grade ${r.grade}</span><div><b>${r.total} / 100</b> · <span title="Times production would have paged you">paged ${run.pages}×</span><p class="fine">Best: ${run.best.grade} · ${run.best.best}. Deterministic rubric; same choices, same score.</p></div></div>
    <ul class="rubric">${r.items.map((i) => `<li class="${i.pts === i.max ? 'ok' : i.pts ? 'part' : 'miss'}"><span class="pts">${i.pts}/${i.max}</span><span><b>${esc(i.label)}</b><br><span class="fine">${esc(i.why)} <span class="chip">${i.concept}</span></span></span></li>`).join('')}</ul>
    <h3 class="h-sub">Take these into the exam</h3><ul class="takeaways">${r.takeaways.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="row"><button class="btn primary" id="m-again">Play again</button>${run.m.num < MISSIONS.length ? '<button class="btn" id="m-next">Next level</button>' : '<button class="btn" id="m-build">Try the builder</button>'}<button class="btn ghost" id="m-ask">Ask Patch about this</button></div>
  </div>`;
}
function wireDebrief() {
  const r = run.result;
  patch.say(r.grade === 'S' ? 'delighted' : r.grade === 'A' ? 'smug' : r.grade === 'B' ? 'neutral' : 'facepalm',
    { S: 'Grade S. I would let you near production. Supervised. Lightly.', A: 'Grade A. One more safeguard and I stop worrying.', B: 'Grade B. It works, the way a ladder on a forklift works.', C: 'Grade C. The incident report writes itself. It has already started.' }[r.grade]);
  $('#m-again').addEventListener('click', () => startMission(run.m.id));
  $('#m-next')?.addEventListener('click', () => startMission(MISSIONS[run.m.num].id));
  $('#m-build')?.addEventListener('click', () => show('builder'));
  $('#m-ask').addEventListener('click', () => {
    const missed = r.items.filter((i) => i.pts < i.max).map((i) => i.label).join('; ') || 'nothing';
    askPatch(`I just played "${run.m.title}" and scored ${r.total}. I lost points on: ${missed}. Explain the architecture concepts I missed, with an example.`);
  });
}

// ---------------- Builder ----------------
let builder = null;
function builderOpen() {
  const sid = builder?.scenario || 'valve';
  builder = { scenario: sid, design: store.draft(sid) || ['request', 'answer'], report: null };
  renderBuilder(); refreshBuilderStage(); refreshAskBar();
}
function refreshBuilderStage() {
  const g = designGraph(builder.design.length ? builder.design : ['request']);
  setGraph(g, `Your design · ${SCENARIOS.find((s) => s.id === builder.scenario).title}`, null, 'Add bricks in order, then press "Inspect and stress-test" to run four chaos tests on this table.');
}
function saveDesign() { store.saveDraft(builder.scenario, builder.design); }

function renderBuilder() {
  const sc = SCENARIOS.find((s) => s.id === builder.scenario);
  const groups = [...new Set(COMPONENTS.map((c) => c.group))];
  const prog = store.progress.builder;
  $('#view-builder').innerHTML = `
    <div class="builder">
      <div class="scenario-tabs" role="tablist" aria-label="Scenario">${SCENARIOS.map((s) => `<button role="tab" aria-selected="${s.id === sc.id}" data-scn="${s.id}">${esc(s.title)}${prog[s.id] ? ` <span class="chip">${esc(prog[s.id].verdict)}</span>` : ''}</button>`).join('')}</div>
      <p class="brief">${esc(sc.brief)}</p>
      <div class="budget-line"><span>Budget: cost ≤ ${sc.budget.cost}</span><span>latency ≤ ${(sc.budget.ms / 1000).toFixed(0)} s</span><span class="fine">(human approval wait not counted)</span></div>
      <h3 class="h-sub">Your pipeline <span class="fine">(order matters: guards must come before what they guard)</span></h3>
      <ol class="pipeline" id="pipeline" aria-label="Pipeline, in order">${builder.design.map((id, i) => {
        const c = byId[id];
        return `<li class="slot" draggable="true" data-i="${i}" tabindex="0" aria-label="${i + 1}. ${esc(c.label)}. Alt plus arrow keys to move, Delete to remove.">
          <span class="slot-n">${i + 1}</span><span class="slot-name">${esc(c.label)}</span>
          <span class="slot-ctrl"><button class="icon" data-move="-1" aria-label="Move ${esc(c.label)} earlier" ${i === 0 ? 'disabled' : ''}>▲</button><button class="icon" data-move="1" aria-label="Move ${esc(c.label)} later" ${i === builder.design.length - 1 ? 'disabled' : ''}>▼</button><button class="icon" data-remove aria-label="Remove ${esc(c.label)}">✕</button></span></li>`;
      }).join('')}<li class="slot drop-end" data-i="${builder.design.length}" aria-hidden="true">Drop here, or tap a brick below</li></ol>
      <div class="row">
        <button class="btn primary" id="b-inspect">Inspect and stress-test</button>
        <button class="btn ghost" id="b-reset">Start over</button>
        <button class="btn ghost" id="b-example">Load one valid design</button>
        <button class="btn ghost" id="b-save">Save this design</button>
      </div>
      <div class="row save-row" id="b-save-row" hidden><label class="sr-only" for="b-name">Design name</label><input type="text" id="b-name" maxlength="40" placeholder="Name this design"><button class="btn small primary" id="b-save-go">Save</button><button class="btn small ghost" id="b-save-cancel">Cancel</button></div>
      <div id="b-report"></div>
      ${savedDesignsHtml()}
      <h3 class="h-sub">Bricks</h3>
      ${groups.map((g) => `<div class="palette-group"><span class="fine">${esc(g)}</span><div class="palette">${COMPONENTS.filter((c) => c.group === g).map((c) => {
        const used = builder.design.includes(c.id);
        return `<button class="brick-card" data-add="${c.id}" draggable="${!used}" ${used ? 'disabled' : ''} data-kind="${c.kind}" title="${esc(c.role)}"><span class="studs" aria-hidden="true"></span><span class="bc-name">${esc(c.label)}</span><span class="bc-io">${esc(c.io)}</span></button>`;
      }).join('')}</div></div>`).join('')}
    </div>`;

  $$('[data-scn]').forEach((b) => b.addEventListener('click', () => { builder = { scenario: b.dataset.scn, design: store.draft(b.dataset.scn) || ['request', 'answer'] }; renderBuilder(); refreshBuilderStage(); }));
  $$('[data-add]').forEach((b) => {
    b.addEventListener('click', () => insertComponent(b.dataset.add, null));
    b.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', `add:${b.dataset.add}`); });
  });
  const list = $('#pipeline');
  $$('.slot', list).forEach((li) => {
    li.addEventListener('dragstart', (e) => { if (li.dataset.i != null) e.dataTransfer.setData('text/plain', `move:${li.dataset.i}`); });
    li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('drag-over'); });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', (e) => {
      e.preventDefault(); li.classList.remove('drag-over');
      const [kind, val] = e.dataTransfer.getData('text/plain').split(':'); const to = +li.dataset.i;
      if (kind === 'add') insertComponent(val, to);
      if (kind === 'move') moveTo(+val, to);
    });
    li.addEventListener('keydown', (e) => {
      const i = +li.dataset.i; if (li.classList.contains('drop-end')) return;
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); move(i, e.key === 'ArrowUp' ? -1 : 1, true); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(i); }
    });
  });
  $$('[data-move]', list).forEach((b) => b.addEventListener('click', (e) => { const i = +e.target.closest('.slot').dataset.i; move(i, +b.dataset.move, true); }));
  $$('[data-remove]', list).forEach((b) => b.addEventListener('click', (e) => remove(+e.target.closest('.slot').dataset.i)));
  $('#b-inspect').addEventListener('click', inspectDesign);
  $('#b-save').addEventListener('click', () => { const row = $('#b-save-row'); row.hidden = false; const inp = $('#b-name'); inp.value = `Design ${store.savedDesigns(builder.scenario).length + 1}`; inp.focus(); inp.select(); });
  $('#b-save-cancel').addEventListener('click', () => { $('#b-save-row').hidden = true; });
  const doSave = () => {
    const r = builder.report || evaluate(builder.design, builder.scenario);
    const name = ($('#b-name').value.trim() || `Design ${store.savedDesigns(builder.scenario).length + 1}`).slice(0, 40);
    store.saveDesign(builder.scenario, { name, design: [...builder.design], verdict: r.verdict, passed: r.passed, total: r.tests.length, cost: r.cost, ms: r.ms, scores: r.scores, at: Date.now() });
    renderBuilder(); patch.say('smug', `Saved "${name}". Now build a worse one and compare. Science.`); $('.saved')?.scrollIntoView({ block: 'nearest' });
  };
  $('#b-save-go').addEventListener('click', doSave);
  $('#b-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSave(); } });
  $$('[data-load]').forEach((b) => b.addEventListener('click', () => { const d = store.savedDesigns(builder.scenario)[+b.dataset.load]; if (d) { builder.design = [...d.design]; saveDesign(); builder.report = null; renderBuilder(); refreshBuilderStage(); } }));
  $$('[data-del]').forEach((b) => b.addEventListener('click', () => { store.deleteDesign(builder.scenario, +b.dataset.del); renderBuilder(); }));
  $('#b-reset').addEventListener('click', () => { builder.design = ['request', 'answer']; builder.report = null; saveDesign(); renderBuilder(); refreshBuilderStage(); patch.say('neutral', 'Clean table. Every design starts as a request and an answer with nothing in between, which is also how most outages start.'); });
  $('#b-example').addEventListener('click', () => { builder.design = [...EXAMPLE_DESIGNS[builder.scenario]]; saveDesign(); renderBuilder(); refreshBuilderStage(); patch.say('smug', 'One valid design. Not the only one. Try removing a guard and watch what breaks.'); });
  if (builder.report) renderReport();
}

function savedDesignsHtml() {
  const list = store.savedDesigns(builder.scenario); if (!list.length) return '';
  return `<h3 class="h-sub">Saved designs <span class="fine">compare, then load the better one</span></h3><ul class="saved">${list.map((d, i) => `<li><b>${esc(d.name)}</b><span class="chip" title="verdict">${esc(d.verdict)}</span><span class="fine">${d.passed}/${d.total} tests · cost ${d.cost} · ${(d.ms / 1000).toFixed(1)} s · safety ${d.scores.safety}</span><button class="btn small ghost" data-load="${i}">Load</button><button class="icon" data-del="${i}" aria-label="Delete ${esc(d.name)}">✕</button></li>`).join('')}</ul>`;
}

function changed(focusIndex) {
  saveDesign(); builder.report = null; renderBuilder(); refreshBuilderStage();
  if (focusIndex != null) $(`#pipeline .slot[data-i="${focusIndex}"]`)?.focus();
}
function insertComponent(id, at) {
  if (builder.design.includes(id)) return;
  const d = builder.design; let i = at ?? (d[d.length - 1] === 'answer' ? d.length - 1 : d.length);
  if (id === 'request') i = 0; if (id === 'answer') i = d.length;
  d.splice(i, 0, id);
  const c = byId[id];
  patch.say('neutral', { Safety: 'A safety brick. Someone has been reading incident reports.', Brains: 'More brains. Remember: brains cost money per token.', Context: 'Context plumbing. Suitcase management, essentially.', Tools: 'Tools. Read ones are friends. Write ones need supervision.', Reliability: 'Reliability brick. Future-you sends thanks.', Edges: 'An edge. Every pipeline needs a beginning and an end. Ideally in that order.' }[c.group]);
  changed(i);
}
function move(i, dir, focus) { const d = builder.design; const j = i + dir; if (j < 0 || j >= d.length) return; [d[i], d[j]] = [d[j], d[i]]; changed(focus ? j : null); }
function moveTo(from, to) { const d = builder.design; const [x] = d.splice(from, 1); d.splice(to > from ? to - 1 : to, 0, x); changed(); }
function remove(i) { builder.design.splice(i, 1); changed(Math.min(i, builder.design.length - 1)); }

function inspectDesign() {
  builder.report = evaluate(builder.design, builder.scenario);
  const r = builder.report;
  store.recordBuilder(builder.scenario, r.verdict, r.passed, r.tests.length);
  addXp(r.verdict === 'Ship it' ? 40 : r.verdict === 'Ship with fixes' ? 15 : 3);
  renderReport();
  // Play the stress tests on the stage: green packets for passes, red for failures.
  const beats = r.tests.map((t) => {
    const path = t.path.filter((id) => builder.design.includes(id));
    const ev = [];
    for (let k = 0; k < path.length - 1; k++) ev.push({ t: 'flow', from: path[k], to: path[k + 1], kind: t.pass ? 'result' : 'blocked' });
    path.forEach((id) => ev.push({ t: 'status', node: id, status: t.pass ? 'ok' : 'error' }));
    return { caption: `${t.pass ? 'Pass' : 'Fail'} · ${t.title}. ${t.result}`, events: ev };
  });
  player.load(beats, null);
  patch.say(r.verdict === 'Ship it' ? 'delighted' : r.verdict === 'Ship with fixes' ? 'smug' : 'alarmed',
    { 'Ship it': 'It survives the stress tests. I am almost disappointed. Almost.', 'Ship with fixes': 'Close. A few holes, clearly labelled, like a good colander.', 'Do not ship': 'Do not ship. I say this as a friend, and as the one who gets paged.' }[r.verdict]);
}

function renderReport() {
  const r = builder.report;
  const sec = (title, arr, cls) => arr.length ? `<h4>${title}</h4><ul class="fb ${cls}">${arr.map((x) => `<li><span>${esc(x.text)}</span><span class="quip">${esc(x.quip)}</span> <span class="chip">${x.concept}</span></li>`).join('')}</ul>` : '';
  $('#b-report').innerHTML = `<div class="report">
    <div class="grade-row"><span class="stamp fresh ${r.verdict === 'Ship it' ? 'pass' : r.verdict === 'Ship with fixes' ? 'warn' : 'fail'}" data-v="${esc(r.verdict)}">${esc(r.verdict)}</span><span class="fine">${r.passed}/${r.tests.length} stress tests passed · cost <b class="${r.overCost ? 'over' : ''}">${r.cost}</b> of ${r.budget.cost} · latency <b class="${r.overMs ? 'over' : ''}">${(r.ms / 1000).toFixed(1)} s</b> of ${(r.budget.ms / 1000).toFixed(0)} s${builder.design.includes('approval') ? ' + human approval wait' : ''}</span></div>
    <div class="scores">${Object.entries(r.scores).map(([k, v]) => `<div><span class="fine">${{ cost: 'frugality' }[k] || k}</span><span class="bar" aria-hidden="true"><i style="width:${v}%"></i></span><b>${v}</b></div>`).join('')}</div>
    ${sec('Blocks shipping', r.critical, 'crit')}${sec('Missing safeguards', r.missing, 'miss')}${sec('Failure points found in stress tests', r.failures, 'fail')}${sec('Weaknesses and costs', r.weaknesses, 'weak')}${sec('Strengths', r.strengths, 'good')}
    <h4>Stress tests</h4><ol class="tests">${r.tests.map((t) => `<li class="${t.pass ? 'pass' : 'fail'}"><b>${t.pass ? 'Pass' : 'Fail'}</b> ${esc(t.title)} <span class="fine">${esc(t.result)}</span></li>`).join('')}</ol>
    <p class="fine">Deterministic teaching rubric with relative cost and latency units. Several different designs can pass. It is not a production review.</p>
    <button class="btn ghost" id="b-ask">Discuss my design with Patch</button></div>`;
  $('#b-ask').addEventListener('click', () => {
    askPatch(`Review my "${r.scenario.title}" design in this order: ${builder.design.map((id) => byId[id].label).join(' → ')}. Verdict was "${r.verdict}". What are the strongest improvements and what would each cost?`);
  });
}

// ---------------- Quiz ----------------
let quizMounted = false; let quizApi = null;
async function quizOpen() {
  if (quizMounted) return;
  const root = $('#view-quiz'); root.innerHTML = '<p class="fine">Loading the question bank…</p>';
  try {
    const bank = await loadBank(); quizMounted = true;
    quizApi = mountQuiz(root, { bank, onPatch: (p, l, o) => patch.say(p, l, o), onXp: addXp });
  } catch (e) { root.innerHTML = `<p class="error-line">${esc(e.message)} Start the preview server with a bank file (README).</p>`; }
}

// ---------------- Ask ----------------
let askApi = null;
const TOPIC_BEATS = {
  retrieval: [{ caption: 'Retrieval (conceptual): rank documents, keep the top few.', events: [{ t: 'flow', from: 'agent', to: 'search', kind: 'request' }, { t: 'status', node: 'search', status: 'working' }] }, { caption: 'Ranked results return as a tool_result.', events: [{ t: 'flow', from: 'search', to: 'agent', kind: 'result' }, { t: 'status', node: 'search', status: 'ok' }] }],
  tools: [{ caption: 'Tool call (conceptual): Claude requests a read-only tool.', events: [{ t: 'flow', from: 'agent', to: 'erp', kind: 'request' }, { t: 'status', node: 'erp', status: 'working' }] }, { caption: 'The harness runs it and returns a tool_result with the same tool_use_id.', events: [{ t: 'flow', from: 'erp', to: 'agent', kind: 'result' }, { t: 'status', node: 'erp', status: 'ok' }] }],
  approval: [{ caption: 'Approval (conceptual): a write waits at the gate for a named human.', events: [{ t: 'flow', from: 'agent', to: 'gate', kind: 'approval' }, { t: 'flow', from: 'gate', to: 'approver', kind: 'approval' }, { t: 'status', node: 'approver', status: 'working' }] }, { caption: 'Approved: the gate allows exactly that write.', events: [{ t: 'flow', from: 'approver', to: 'gate', kind: 'result' }, { t: 'gate', node: 'gate', open: true }, { t: 'flow', from: 'gate', to: 'write', kind: 'write' }, { t: 'status', node: 'write', status: 'ok' }] }],
  context: [{ caption: 'Context budget (conceptual): every message and tool result takes space.', events: [{ t: 'context', node: 'ctx', used: 9000, budget: 12000 }, { t: 'status', node: 'ctx', status: 'waiting' }] }],
  retry: [{ caption: 'Retry (conceptual): a transient error, then a capped retry with backoff.', events: [{ t: 'flow', from: 'erp', to: 'supplier', kind: 'request' }, { t: 'flow', from: 'supplier', to: 'erp', kind: 'blocked' }, { t: 'status', node: 'supplier', status: 'error' }] }, { caption: 'Second attempt succeeds after backoff.', events: [{ t: 'flow', from: 'erp', to: 'supplier', kind: 'request' }, { t: 'flow', from: 'supplier', to: 'erp', kind: 'result' }, { t: 'status', node: 'supplier', status: 'ok' }] }],
  injection: [{ caption: 'Untrusted text (conceptual): a write requested by document text is denied by policy.', events: [{ t: 'flow', from: 'agent', to: 'gate', kind: 'blocked' }, { t: 'status', node: 'gate', status: 'blocked' }] }],
};
let asking = false;
const askInput = $('#ask-input'); const askSend = $('#ask-send');

// Can the stage illustrate the answer, or is the learner's own work on the table?
function stageIsFree() { return !(currentView === 'missions' && run) && currentView !== 'builder'; }

function mountAskOnce() {
  if (askApi) return askApi;
  askApi = mountAsk($('#ask-mount'), {
    input: askInput, sendBtn: askSend,
    onSubmit: (text) => routeIntent(text),
    onPatch: (p, l, o) => patch.say(p, l, o),
    onTopic: (t) => { if (stageIsFree() && TOPIC_BEATS[t]) player.enqueue(...TOPIC_BEATS[t]); },
    onStreamStart: () => {
      openAsk();
      if (!stageIsFree()) return; // keep the mission or design on the table; Patch talks about it instead
      if (currentGraph !== MISSIONS[0].graph) setGraph(MISSIONS[0].graph, 'Conceptual scene · steps picked by keyword match on the answer text', () => { stage.setContext('ctx', 2400, 12000); schematic.setContext('ctx', 2400, 12000); stage.setGate('gate', false, { instant: true }); });
      player.clear(currentReset); player.enqueue({ caption: 'Question received. The scene will illustrate topics as the answer mentions them. It does not execute or verify anything.', events: [{ t: 'flow', from: 'lead', to: 'agent', kind: 'request' }, { t: 'status', node: 'agent', status: 'working' }] });
    },
    onStreamEnd: ({ truncated, cancelled, failed } = {}) => { if (stageIsFree()) player.enqueue({ caption: failed ? 'The model did not answer.' : cancelled ? 'Answer stopped by you.' : truncated ? 'Answer stopped at the length limit. Press Continue for the rest.' : 'Answer complete.', events: [{ t: 'flow', from: 'agent', to: 'lead', kind: failed || truncated ? 'blocked' : 'result' }, { t: 'status', node: 'agent', status: failed ? 'error' : truncated ? 'waiting' : 'ok' }] }); },
    getContext: askContext,
    onNeedsCode: () => patch.say('neutral', 'This server wants an access code first. Settings has a box for it.'),
  });
  return askApi;
}

// What Patch can see. Kept short so it fits small local models as well as cloud ones.
function askContext() {
  const parts = [`studio section: ${VIEW_NAMES[currentView] || currentView}`];
  if (run) {
    const steps = run.log.filter((l) => l.kind === 'tool_use').slice(-4).map((l) => { try { const j = JSON.parse(l.text); return j.name || j.method || 'tool call'; } catch { return (l.text || '').slice(0, 40); } });
    parts.push(`mission level ${run.m.num} "${run.m.title}" (objective: ${run.m.objective}); steps so far: ${steps.length ? steps.join(' | ') : 'none yet'}; paged ${run.pages} time(s)${run.done ? `; finished with grade ${run.result.grade} (${run.result.total}/100), lost points on: ${run.result.items.filter((i) => i.pts < i.max).map((i) => i.label).join(', ') || 'nothing'}` : ''}`);
  }
  if (currentView === 'builder' && builder) {
    const sc = SCENARIOS.find((x) => x.id === builder.scenario);
    parts.push(`builder scenario "${sc?.title}": design order ${builder.design.map((id) => byId[id]?.label || id).join(' → ')}${builder.report ? `; last verdict "${builder.report.verdict}", ${builder.report.passed}/${builder.report.tests.length} stress tests passed; failing: ${builder.report.tests.filter((t) => !t.pass).map((t) => t.title).join(', ') || 'none'}` : '; not yet stress-tested'}`);
  }
  if (currentView === 'quiz' && quizApi?.inRun()) parts.push(quizApi.current());
  return parts.join('. ').slice(0, 900);
}

function refreshAskBar() {
  const narrow = matchMedia('(max-width: 640px)').matches;
  const ph = run && currentView === 'missions' ? (narrow ? 'Ask Patch about this incident…' : 'Ask Patch about this incident, or say “what should I do next?”…')
    : currentView === 'builder' ? (narrow ? 'Ask Patch about your design…' : 'Ask Patch about your design, or say “review my design”…')
    : currentView === 'quiz' ? (narrow ? 'Ask Patch about this question…' : 'Ask Patch about this question, or say “quiz me on D5”…')
    : (narrow ? 'Ask Patch, or say “quiz me on MCP”' : 'Ask Patch anything, or say “quiz me on MCP”…');
  askInput.placeholder = ph;
  const key = run && currentView === 'missions' ? 'mission' : currentView === 'builder' ? 'builder' : currentView === 'quiz' ? 'quiz' : currentView === 'settings' ? 'settings' : 'home';
  askApi?.setSuggestions(SUGGESTIONS[key]);
}

function openAsk() {
  mountAskOnce();
  if (!asking) {
    asking = true; $('#side').classList.add('asking'); $('#view-ask').hidden = false;
    $('#ask-close').textContent = `Back to ${VIEW_NAMES[currentView] || 'the studio'}`;
    $('#nav-ask').setAttribute('aria-pressed', 'true'); $('#nav-ask').setAttribute('aria-current', 'page');
    refreshAskBar();
    if (!askApi.count()) patch.say('neutral', run ? 'Ask away. I can see the incident you are in; I will not spoil the score unless you ask.' : 'Ask away. Questions, or orders: “quiz me on MCP”, “play level 3”, “how am I doing”. I take both.');
  }
  syncHash();
}
function closeAsk({ silent = false } = {}) {
  if (!asking) return;
  asking = false; $('#side').classList.remove('asking'); $('#view-ask').hidden = true;
  $('#nav-ask').setAttribute('aria-pressed', 'false'); $('#nav-ask').setAttribute('aria-current', 'false');
  if (!silent) syncHash();
}
function toggleAsk() { asking ? closeAsk() : openAsk(); }
$('#ask-close').addEventListener('click', () => closeAsk());
$('#ask-bar').addEventListener('submit', (e) => e.preventDefault()); // chat.js owns Enter and the Ask button
document.addEventListener('keydown', (e) => { if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) { e.preventDefault(); askInput.focus(); } });

// Send text to Patch from anywhere (buttons, chips, the quiz). Commands are routed first.
function askPatch(text, { force = false } = {}) {
  mountAskOnce();
  if (!force && routeIntent(text)) return;
  openAsk(); askApi.ask(text);
}

// ---- intent routing: the studio acts on plain-language commands before the model is involved ----
const DOMAIN_HINTS = [
  ['D2', /claude code|claude\.md|settings\.json|hook|subagent|headless|--max-turns|slash command/],
  ['D4', /\bmcp\b|tool (design|use|schema|result|call)|server|transport|json-rpc|stdio|oauth/],
  ['D3', /prompt|structured output|json output|xml tag|few-shot|system prompt|eval/],
  ['D5', /context|token|compact|retriev|cache|retry|backoff|idempot|reliab|timeout/],
  ['D1', /agent|orchestrat|loop|architect|workflow|subagent|router|design pattern/],
];
function domainOf(t) { const m = /\bd([1-5])\b/.exec(t); if (m) return `D${m[1]}`; for (const [d, re] of DOMAIN_HINTS) if (re.test(t)) return d; return null; }
function weakestDomain() {
  const q = store.quiz; const by = {};
  for (const [, a] of Object.entries(q.answers)) { const d = a.d; if (!d) continue; (by[d] ||= { n: 0, ok: 0 }).n++; if (a.correct) by[d].ok++; }
  const ranked = Object.entries(by).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);
  return ranked[0]?.[0] || null;
}

function routeIntent(raw) {
  const t = raw.toLowerCase().replace(/[“”"']/g, '').trim();
  const say = (pose, line) => patch.say(pose, line);

  // Progress: answered from local state, instantly, labelled as such.
  // "What should I do next" inside a mission or design is a question for Patch about that work, not a progress query.
  const busyWithWork = (run && currentView === 'missions') || currentView === 'builder' || (currentView === 'quiz' && quizApi?.inRun());
  if (/how am i doing|my (progress|score|xp|rank|stats|standing)|what have i (done|finished|completed|played)|where am i\b/.test(t) || (!busyWithWork && /what should i (do|study|practi[cs]e|play) next/.test(t))) {
    openAsk(); askApi.local(raw, progressReport()); say('smug', 'Pulled from your clipboard, not from the model. Numbers do not need a GPU.'); return true;
  }
  // Navigation
  if (/^(open |go to |show( me)? |take me to )?(the )?settings$/.test(t)) { show('settings'); say('neutral', 'Settings. Nothing in here pages anyone.'); return true; }
  if (/^(open |go to |show( me)? |take me to )?(the )?(home|missions?|levels?|start)$/.test(t)) { show('missions', { rehome: true }); say('neutral', 'The level board. Pick an incident.'); return true; }
  if (/^(open |go to |show( me)? |take me to )?(the )?builder$/.test(t)) { show('builder'); say('neutral', 'The builder. Bricks go in order; so do outages.'); return true; }
  if (/^(open |go to |show( me)? |take me to )?(the )?(questions?|quiz|question bank)$/.test(t)) { show('quiz', { rehome: true }); say('neutral', 'Two hundred original questions. None of them are leaked, all of them are grumpy.'); return true; }

  // Missions: a play verb or an explicit level number.
  const lvl = /\b(?:level|mission|l)\s*([1-5])\b/.exec(t);
  const playVerb = /\b(play|start|open|run|launch|replay|try|do|begin|load)\b/.test(t) || /^(level|mission) [1-5]/.test(t);
  const missionByWord = [[/valve|pump station|late ship/, 0], [/context diet|spec library|400.page/, 1], [/refund/, 2], [/friday|claude code|4:55|deploy/, 3], [/three servers|mcp servers|servers walk/, 4]].find(([re]) => re.test(t));
  if (lvl || (playVerb && (missionByWord || /\b(incident|mission|level)\b/.test(t)))) {
    const idx = lvl ? +lvl[1] - 1 : missionByWord ? missionByWord[1] : null;
    if (idx !== null) { show('missions'); startMission(MISSIONS[idx].id); return true; }
  }

  // Builder: design/build + a scenario.
  if (/\b(build|design|architect|help me design|open the builder)\b/.test(t) && /refund|valve|builder|agent|assistant|system/.test(t) && !/\b(what|why|how|when|explain|should)\b/.test(t)) {
    const sid = /refund|support/.test(t) ? 'refund' : 'valve';
    builder = { scenario: sid, design: store.draft(sid) || ['request', 'answer'], report: null };
    show('builder'); say('neutral', `Builder, ${sid === 'refund' ? 'support refund agent' : 'late-valve assistant'}. Drag bricks in the order the request meets them.`); return true;
  }

  // Questions: explicit quiz verbs only, so "what is a quiz" still goes to the model.
  const quizAsk = /^(quiz|test|drill|grill|examine) me\b/.test(t) || /\b(give|start|run|open|do|show|take|launch)( me)?( a| some| the| my)? ?(quiz|questions?|practice|practise|drill|night shift|mistakes|bookmarks|exam.?weighted)\b/.test(t) || /\b(practi[cs]e|drill) (questions? )?(on|about|for)\b/.test(t) || /^(night shift|review (my )?mistakes|my bookmarks)$/.test(t);
  if (quizAsk) {
    const mode = /mistake|wrong|missed/.test(t) ? 'mistakes' : /bookmark/.test(t) ? 'bookmarks' : /night shift|shift/.test(t) ? 'shift' : /weighted|exam run|full run|mock/.test(t) ? 'weighted' : null;
    const d = /weakest|worst/.test(t) ? weakestDomain() : domainOf(t.replace(/quiz|questions?/g, ''));
    show('quiz');
    quizOpen().then(() => {
      if (!quizApi) return;
      if (mode) quizApi.start(mode); else if (d) quizApi.start('exam', d); else quizApi.start('weighted');
      say('busy', mode === 'mistakes' ? 'Your mistakes pile. It missed you.' : mode === 'bookmarks' ? 'Bookmarks. The ones you promised to come back to.' : mode === 'shift' ? 'Night shift. Twelve calls, three pages.' : d ? `Ten questions from ${d}: ${DOMAINS[d]}.` : 'An exam-weighted run. Twenty questions, weighted like the real blueprint.');
    });
    return true;
  }
  return false;
}

function progressReport() {
  const p = store.progress; const q = store.quiz;
  const answered = Object.keys(q.answers).length; const right = Object.values(q.answers).filter((a) => a.correct).length;
  const xp = p.xp || 0; let i = RANKS.findIndex(([min]) => xp < min); if (i === -1) i = RANKS.length; const rank = RANKS[i - 1][1]; const next = RANKS[i];
  const missions = MISSIONS.map((m) => { const r = p.missions[m.id]; return `- Level ${m.num} · ${m.title}: ${r ? `best grade **${r.grade}** (${r.best}/100, ${r.plays} play${r.plays === 1 ? '' : 's'})` : 'not played yet'}`; }).join('\n');
  const builds = SCENARIOS.map((sc) => { const b = p.builder[sc.id]; return `- ${sc.title}: ${b ? `**${b.verdict}** (${b.passed}/${b.total} stress tests)` : 'no design inspected yet'}`; }).join('\n');
  const unplayed = MISSIONS.find((m) => !p.missions[m.id]); const weak = weakestDomain();
  const nextMove = unplayed ? `Play **Level ${unplayed.num} · ${unplayed.title}** (say "play level ${unplayed.num}").` : q.mistakes.length ? `Clear the **${q.mistakes.length} mistakes** pile (say "review my mistakes").` : weak ? `Drill **${weak}** (say "quiz me on ${weak}").` : 'Run a night shift and try to survive all twelve calls.';
  return `## Where you stand\n**${xp} XP · ${rank}**${next ? ` · ${next[0] - xp} XP to ${next[1]}` : ' · top rank'}\n\n## Missions\n${missions}\n\n## Builder\n${builds}\n\n## Questions\n- ${answered} answered, ${answered ? Math.round((right / answered) * 100) : 0}% correct · ${q.mistakes.length} to review · ${q.bookmarks.length} bookmarked · best night shift: ${q.shiftBest || 0} calls survived${weak ? `\n- Weakest domain so far: **${weak}** (${DOMAINS[weak]})` : ''}\n\n## Next move\n${nextMove}`;
}

// ---------------- Settings ----------------
async function settingsOpen() {
  const s = store.settings; const health = await fetch('/api/health').then((r) => r.json()).catch(() => null);
  const st = stage.stats();
  $('#view-settings').innerHTML = `
    <div class="settings">
      <h2>Settings</h2>
      <label class="toggle"><input type="checkbox" id="s-lowgpu" ${s.lowGpu ? 'checked' : ''}> Low-GPU mode <span class="fine">No shadows or reflections, 30 fps cap, 1× pixels. Reloads the page.</span></label>
      <label class="toggle"><input type="checkbox" id="s-motion" ${s.reducedMotion ? 'checked' : ''}> Reduced motion <span class="fine">Pipes flash instead of moving packets; slower captions. Reloads.</span></label>
      <label class="toggle"><input type="checkbox" id="s-2d" ${s.view2d ? 'checked' : ''}> Start in 2D schematic</label>
      ${health?.needsCode ? `<h3 class="h-sub">Access code</h3><p class="fine">This server asks for a code before Patch answers. It is kept only in this browser.</p><div class="row"><input type="password" id="s-code" placeholder="Access code" autocomplete="off"><button class="btn" id="s-code-save">Save code</button></div>` : ''}
      <h3 class="h-sub">Progress</h3>
      <div class="row"><button class="btn" id="s-export">Export progress</button><label class="btn">Import progress<input type="file" id="s-import" accept="application/json" hidden></label><button class="btn ghost danger" id="s-reset">Reset everything</button></div>
      <p class="fine" id="s-msg"></p>
      <h3 class="h-sub">About this build</h3>
      <dl class="about">
        <dt>Model</dt><dd>${esc(health?.model || 'unknown')}${health?.demo ? ' (scripted answers only)' : ''}${health ? ` · shared daily budget left: ${health.budgetLeft >= 1e6 ? (health.budgetLeft / 1e6).toFixed(1) + 'M' : Math.round(health.budgetLeft / 1000) + 'k'} characters` : ''}${health?.keepWarm && health.keepWarm !== 'off' ? ` · model kept warm (${esc(health.keepWarm)})` : ''}</dd>
        <dt>Privacy</dt><dd>${health?.provider === 'vertex' ? 'Your questions to Patch, plus a short note about what is on screen, are sent to Google Vertex AI to generate the answer. Progress, bookmarks and scores stay in this browser.' : 'Your questions to Patch are answered by a model on this server. Progress, bookmarks and scores stay in this browser.'}</dd>
        <dt>Build</dt><dd>Architect Studio v${esc(health?.version || '?')} · ${health?.feedbackCount ?? 0} rated answers saved on this server as candidate training examples</dd>
        <dt>Rendering</dt><dd>${webglOk ? `WebGL raster: shaded plastic, generated environment reflections${s.lowGpu ? ' (off in low-GPU)' : ''}, shadow maps. Not ray tracing.` : 'WebGL unavailable: 2D schematic only.'}</dd>
        <dt>Render cost</dt><dd>${st ? `${st.avgMs} ms average CPU submit time per frame, p95 ${st.p95Ms} ms over ${st.frames} frames (renders only while something moves).` : 'No frames measured yet.'}
          <div class="row"><button class="btn small" id="s-bench">Measure for 8 seconds</button></div><span class="fine" id="s-bench-out">Tip: start a long answer in Ask Patch first, then come back and measure, to see the cost while the model generates.</span></dd>
        <dt>Scenes</dt><dd>Mission and builder scenes play authored, deterministic steps. In Ask Patch, steps are picked by keyword match on the answer text. Neither reasons about or executes anything.</dd>
        <dt>Content</dt><dd>Missions, builder rules and practice questions are original study material, not official or leaked exam content. Verify important claims against current official documentation.</dd>
      </dl>
    </div>`;
  $('#s-bench').addEventListener('click', async () => {
    const out = $('#s-bench-out'); const busy = health?.busy;
    out.textContent = 'Measuring… the stage panel is shown while it runs.';
    $('#workspace').dataset.view = 'missions'; $('#side').hidden = true; // show the stage full-size for the run
    $('#workspace').classList.add('expanded'); stage.resize();
    const r = await stage.bench(8000);
    $('#workspace').classList.remove('expanded'); $('#side').hidden = false; $('#workspace').dataset.view = 'settings'; stage.resize();
    const live = await fetch('/api/health').then((x) => x.json()).catch(() => ({}));
    out.textContent = `${r.fps} fps (cap ${r.fpsCap}), frame interval p50 ${r.frameIntervalP50} ms, p95 ${r.frameIntervalP95} ms, ${r.frames} frames. Model ${live.busy || busy ? 'was generating' : 'was idle'} during the run.`;
    console.info('[bench]', JSON.stringify({ ...r, modelBusy: !!(live.busy || busy), lowGpu: settings.lowGpu }));
  });
  $('#s-code-save')?.addEventListener('click', () => { try { localStorage.setItem('ccarf2:accessCode', $('#s-code').value.trim()); $('#s-msg').textContent = 'Access code saved in this browser.'; } catch { $('#s-msg').textContent = 'Could not save: storage is blocked.'; } });
  const reloadSet = (k) => (e) => { store.setSetting(k, e.target.checked); location.reload(); };
  $('#s-lowgpu').addEventListener('change', reloadSet('lowGpu'));
  $('#s-motion').addEventListener('change', reloadSet('reducedMotion'));
  $('#s-2d').addEventListener('change', (e) => { store.setSetting('view2d', e.target.checked); view2d = e.target.checked; apply2d(); });
  $('#s-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'architect-studio-progress.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  $('#s-import').addEventListener('change', async (e) => {
    try { const r = store.importAny(JSON.parse(await e.target.files[0].text())); $('#s-msg').textContent = r.keys ? `Restored ${r.keys} saved items.` : `Merged ${r.bookmarks} bookmarks and ${r.mistakes} mistakes.`; renderXp(); quizMounted = false; }
    catch { $('#s-msg').textContent = 'That file is not valid JSON.'; }
  });
  $('#s-reset').addEventListener('click', () => { if (confirm('Delete all progress, bookmarks and drafts on this device?')) { store.resetAll(); location.reload(); } });
}

// ---------------- boot ----------------
// Stale-tab check: if the server runs a newer build than this page, offer a reload.
const BUILD = '2.2.0';
function checkHealth() {
  return fetch('/api/health', { cache: 'no-store' }).then((r) => r.json()).then((h) => {
    $('#model-pill').textContent = h.model; $('#model-pill').dataset.demo = String(h.demo);
    window.__provider = h.provider;
    const where = h.provider === 'vertex' ? 'Questions you ask Patch are sent to Google Vertex AI (Gemini); missions, builder and quiz scoring run in your browser.'
      : h.provider === 'local' ? 'Patch runs on a model hosted on this server; nothing is sent to a cloud AI service.' : 'Demo mode: Patch shows scripted sample answers.';
    $('#foot-model').textContent = where;
    document.querySelectorAll('.where-note').forEach((n) => { n.textContent = h.provider === 'vertex' ? 'questions go to Google Vertex AI (Gemini)' : h.provider === 'local' ? 'answers come from the model on this server, not a cloud API' : 'demo answers only'; });
    if (h.version && h.version !== BUILD && !$('#stale-bar')) {
      const bar = document.createElement('div'); bar.id = 'stale-bar'; bar.className = 'stale-bar'; bar.setAttribute('role', 'status');
      bar.innerHTML = `A newer version of the studio is live (v${esc(h.version)}). <button class="btn small primary" type="button">Reload</button> <span class="fine">Your progress is kept.</span>`;
      bar.querySelector('button').addEventListener('click', () => location.reload());
      document.body.prepend(bar);
    }
  }).catch(() => { $('#model-pill').textContent = 'Server unreachable'; });
}
checkHealth();
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkHealth(); });
{ const [v, sub] = (location.hash.slice(1) || 'missions').split('/'); show(v); if (sub === 'ask' || v === 'ask') openAsk(); }
mountAskOnce(); refreshAskBar();
requestAnimationFrame(() => setTimeout(loadStage, 0));
window.__studio = { stage, player, store, evaluate };
