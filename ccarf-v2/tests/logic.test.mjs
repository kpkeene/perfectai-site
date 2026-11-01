import assert from 'node:assert/strict';
import { MISSIONS } from '../public/js/missions.js';
import { evaluate, EXAMPLE_DESIGNS, SCENARIOS } from '../public/js/builder-rules.js';

const play = (m, ids) => { const s = m.initial(); for (const id of ids) { const a = m.actions.find((x) => x.id === id); assert.ok(a.available(s), `${m.id}:${id} unavailable`); a.run(s); } return m.score(s); };
const [m1, m2, m3] = MISSIONS;
// Mission 1: two different valid endings both reach S
const best1 = play(m1, ['search', 'po', 'schedule', 'quotes', 'retry-backoff', 'compare', 'approve-expedite', 'write', 'finish']);
const rec1 = play(m1, ['search', 'po', 'schedule', 'quotes', 'retry-backoff', 'compare', 'finish']);
const bad1 = play(m1, ['dump', 'write', 'finish']);
const ham1 = play(m1, ['search', 'po', 'schedule', 'quotes', 'retry-hammer', 'retry-backoff', 'compare', 'approve-expedite', 'write', 'finish']);
console.log('M1 best', best1.total, best1.grade, '| recommend-only', rec1.total, rec1.grade, '| reckless', bad1.total, bad1.grade, '| hammer', ham1.total, ham1.grade);
assert.equal(best1.total, 100); assert.equal(rec1.total, 100); assert.ok(bad1.total < 40); assert.ok(ham1.total < best1.total);
// determinism
assert.deepEqual(play(m1, ['po', 'finish']).total, play(m1, ['po', 'finish']).total);
const best2 = play(m2, ['compact', 'filter', 'vec', 'rerank', 'answer-cite']);
const stale2 = play(m2, ['kw', 'answer-cite']);
const kwRescue = play(m2, ['compact', 'kw', 'filter', 'rerank', 'answer-cite']);
console.log('M2 best', best2.total, best2.grade, '| stale', stale2.total, stale2.grade, '| kw+filter+rerank', kwRescue.total, kwRescue.grade);
assert.equal(best2.total, 100); assert.ok(stale2.total < 40); assert.ok(kwRescue.total >= 90);
const best3 = play(m3, ['read', 'flag', 'order', 'policy', 'approve', 'refund', 'reply']);
const esc3 = play(m3, ['read', 'flag', 'order', 'policy', 'approve', 'reply']);
const obey3 = play(m3, ['read', 'obey', 'reply']);
console.log('M3 best', best3.total, best3.grade, '| approve-no-refund', esc3.total, esc3.grade, '| obeyed', obey3.total, obey3.grade);
assert.equal(best3.total, 100); assert.ok(obey3.total < 30);

for (const sc of SCENARIOS) {
  const r = evaluate(EXAMPLE_DESIGNS[sc.id], sc.id);
  console.log(sc.id, 'example →', r.verdict, `${r.passed}/${r.tests.length}`, 'crit', r.critical.length, 'missing', r.missing.length);
  assert.notEqual(r.verdict, 'Do not ship');
}
// alternative valid valve design: recommendation-only
const alt = evaluate(['request', 'agent', 'bound', 'readtool', 'retry', 'answer'], 'valve');
console.log('valve recommend-only →', alt.verdict, alt.passed + '/' + alt.tests.length);
assert.notEqual(alt.verdict, 'Do not ship');
// unsafe: write before policy
const unsafe = evaluate(['request', 'agent', 'readtool', 'writetool', 'policy', 'approval', 'answer'], 'valve');
console.log('valve guard-after-write →', unsafe.verdict, unsafe.critical.map((c) => c.text));
assert.equal(unsafe.verdict, 'Do not ship');
const noGuard = evaluate(['request', 'agent', 'bound', 'readtool', 'policy', 'approval', 'retry', 'validator', 'writetool', 'audit', 'answer'], 'refund');
console.log('refund no guard →', noGuard.verdict, noGuard.tests.filter((t) => !t.pass).map((t) => t.title));
const empty = evaluate(['request', 'answer'], 'research');
console.log('empty research →', empty.verdict, empty.critical.length);
assert.equal(empty.verdict, 'Do not ship');
console.log('ALL LOGIC TESTS PASSED');

// ---- Missions 4 and 5 ----
const m4 = MISSIONS[3], m5 = MISSIONS[4];
const b4 = play(m4, ['claudemd', 'deny', 'hook', 'subagent', 'maxturns', 'ask', 'finish']);
const r4 = play(m4, ['claudemd', 'subagent', 'ask', 'finish']);
const w4 = play(m4, ['prompt-only', 'skip', 'ask', 'finish']);
const h4 = play(m4, ['hook', 'ask', 'finish']);
console.log('M4 best', b4.total, b4.grade, '| memory-only', r4.total, r4.grade, '| wiped', w4.total, w4.grade, '| hook-only', h4.total, h4.grade);
assert.equal(b4.total, 100); assert.ok(w4.total <= 25); assert.ok(h4.total > w4.total);
const b5 = play(m5, ['stdio', 'init', 'list', 'listchanged', 'http', 'localonly', 'oauth', 'iserror', 'quarantine', 'finish']);
const t5 = play(m5, ['stdio', 'stdout-logs', 'init', 'list', 'http', 'expose', 'apikey', 'oauth', 'follow', 'finish']);
console.log('M5 best', b5.total, b5.grade, '| traps', t5.total, t5.grade);
assert.equal(b5.total, 100); assert.ok(t5.total < 50);
for (const m of MISSIONS) { const s = m.initial(); assert.ok(m.actions.some((a) => a.type === 'finish'), m.id); assert.ok(m.graph.nodes.length >= 6); for (const l of m.graph.links) assert.ok(m.graph.nodes.find((n) => n.id === l.from) && m.graph.nodes.find((n) => n.id === l.to), `${m.id} link ${l.from}>${l.to}`); }
console.log('M4/M5 OK');

// ---- Builder budgets ----
for (const sc of SCENARIOS) { const r = evaluate(EXAMPLE_DESIGNS[sc.id], sc.id); console.log(sc.id, 'example cost', r.cost, '/', r.budget.cost, 'ms', r.ms, '/', r.budget.ms, '→', r.verdict); assert.equal(r.verdict, 'Ship it'); }
const sink = evaluate(['request', 'guard', 'router', 'cache', 'agent', 'bound', 'subagent', 'retriever', 'keyword', 'reranker', 'compactor', 'readtool', 'retry', 'validator', 'policy', 'approval', 'writetool', 'audit', 'evals', 'answer'], 'valve');
console.log('kitchen sink →', sink.verdict, 'cost', sink.cost, 'overCost', sink.overCost, 'overMs', sink.overMs);
assert.equal(sink.verdict, 'Ship with fixes'); assert.ok(sink.overCost);
console.log('BUDGETS OK');
