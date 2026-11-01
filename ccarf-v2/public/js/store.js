// Versioned local persistence. Everything stays in this browser.
const NS = 'ccarf2:';
const VERSION = 1;

function read(key, fallback) {
  try { const v = localStorage.getItem(NS + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function write(key, value) { try { localStorage.setItem(NS + key, JSON.stringify(value)); return true; } catch { return false; } }

export const store = {
  get settings() {
    const s = read('settings', {});
    // Humor and detailed answers are always on: obsolete keys from older builds are ignored on purpose.
    delete s.humor; delete s.humorLevel; delete s.answerBudget; delete s.detail;
    return { lowGpu: false, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, view2d: false, showStats: false, ...s };
  },
  setSetting(k, v) { const s = read('settings', {}); s[k] = v; write('settings', s); },

  get progress() { return read('progress', { v: VERSION, xp: 0, missions: {}, builder: {} }); },
  saveProgress(p) { write('progress', p); },
  addXp(n) { const p = this.progress; p.xp = Math.max(0, (p.xp || 0) + n); this.saveProgress(p); return p.xp; },
  recordMission(id, result) {
    const p = this.progress; const prev = p.missions[id];
    if (!prev || result.total > prev.best) p.missions[id] = { best: result.total, grade: result.grade, at: Date.now(), plays: (prev?.plays || 0) + 1 };
    else prev.plays = (prev.plays || 0) + 1;
    this.saveProgress(p); return p.missions[id];
  },
  recordBuilder(id, verdict, passed, total) {
    const p = this.progress; const prev = p.builder[id] || {};
    const rank = { 'Do not ship': 0, 'Ship with fixes': 1, 'Ship it': 2 };
    if (!prev.verdict || rank[verdict] >= rank[prev.verdict]) p.builder[id] = { verdict, passed, total, at: Date.now() };
    this.saveProgress(p);
  },

  get quiz() { return read('quiz', { v: VERSION, answers: {}, bookmarks: [], mistakes: [], streakBest: 0 }); },
  saveQuiz(q) { write('quiz', q); },

  draft(scenario) { return read(`draft:${scenario}`, null); },
  saveDraft(scenario, design) { write(`draft:${scenario}`, design); },
  savedDesigns(scenario) { return read(`designs:${scenario}`, []); },
  saveDesign(scenario, d) { const l = this.savedDesigns(scenario); l.push(d); write(`designs:${scenario}`, l.slice(-8)); },
  deleteDesign(scenario, i) { const l = this.savedDesigns(scenario); l.splice(i, 1); write(`designs:${scenario}`, l); },

  exportAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(NS)) out[k] = localStorage.getItem(k); }
    return { app: 'architect-studio-v2', exportedAt: new Date().toISOString(), data: out };
  },
  // Accepts a v2 export, or a raw localStorage dump from the earlier app: any array of
  // question ids under a key that mentions bookmarks or mistakes is merged in.
  importAny(obj) {
    const q = this.quiz; let merged = { bookmarks: 0, mistakes: 0, keys: 0 };
    if (obj?.app === 'architect-studio-v2' && obj.data) {
      for (const [k, v] of Object.entries(obj.data)) if (k.startsWith(NS)) { localStorage.setItem(k, v); merged.keys++; }
      return merged;
    }
    const idRe = /^P\d{3}-\d{3}$/;
    const walk = (key, val) => {
      if (typeof val === 'string') { try { val = JSON.parse(val); } catch { return; } }
      if (Array.isArray(val)) {
        const ids = val.map((x) => (typeof x === 'string' ? x : x?.id)).filter((x) => idRe.test(x || ''));
        if (ids.length && /bookmark|saved|star/i.test(key)) ids.forEach((id) => { if (!q.bookmarks.includes(id)) { q.bookmarks.push(id); merged.bookmarks++; } });
        if (ids.length && /mistake|wrong|review|missed/i.test(key)) ids.forEach((id) => { if (!q.mistakes.includes(id)) { q.mistakes.push(id); merged.mistakes++; } });
      } else if (val && typeof val === 'object') for (const [k, v] of Object.entries(val)) walk(`${key}.${k}`, v);
    };
    for (const [k, v] of Object.entries(obj || {})) walk(k, v);
    this.saveQuiz(q); return merged;
  },
  resetAll() { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(NS)) ks.push(k); } ks.forEach((k) => localStorage.removeItem(k)); },
};
