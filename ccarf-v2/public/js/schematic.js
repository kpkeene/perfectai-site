// 2D brick schematic: the accessible, low-power alternative to the 3D stage.
// Same API surface as Stage for the parts the player uses.
const NS = 'http://www.w3.org/2000/svg';
const KIND_FILL = {
  agent: '#ffb02e', retriever: '#2f6fde', 'tool-read': '#1f9e93', 'tool-write': '#e23b2e', gate: '#f2d33a',
  store: '#4f7fd8', context: '#2fa652', human: '#2fa652', validator: '#2fa652', retry: '#7b5cd6', log: '#8fc7ff',
  answer: '#eef1f6', compactor: '#1f9e93', router: '#8fc7ff', user: '#2f6fde', cache: '#f2d33a', eval: '#8b93a3',
  subagent: '#ff7a1a', bound: '#b3bacb', guard: '#7b5cd6',
};
const FLOW_COLOR = { request: '#5aa2ff', result: '#3ddc84', blocked: '#ff5a4e', write: '#ff8a33', data: '#eef1f6', approval: '#f2d33a' };

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
}

export class Schematic {
  constructor(host) {
    this.host = host; this.nodes = new Map(); this.links = new Map(); this.listeners = {};
    this.svg = el('svg', { class: 'schematic', role: 'img' }); host.append(this.svg);
  }
  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); }
  emit(evt, d) { (this.listeners[evt] || []).forEach((f) => f(d)); }

  setGraph(graph) {
    this.svg.innerHTML = ''; this.nodes.clear(); this.links.clear();
    const xs = graph.nodes.map((n) => n.x), zs = graph.nodes.map((n) => n.z);
    const minX = Math.min(...xs) - 4, maxX = Math.max(...xs) + 4, minZ = Math.min(...zs) - 4, maxZ = Math.max(...zs) + 4;
    const S = 14; // px per stud
    const W = (maxX - minX) * S, H = (maxZ - minZ) * S;
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.svg.setAttribute('aria-label', `Schematic: ${graph.nodes.map((n) => n.label).join(', ')}`);
    const defs = el('defs', {}, this.svg);
    const mk = el('marker', { id: 'arr', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#c9d2e3' }, mk);
    const P = (n) => [(n.x - minX) * S, (n.z - minZ) * S];
    const lg = el('g', {}, this.svg);
    for (const l of graph.links) {
      const a = graph.nodes.find((n) => n.id === l.from), b = graph.nodes.find((n) => n.id === l.to); if (!a || !b) continue;
      const [x1, y1] = P(a), [x2, y2] = P(b); const mx = (x1 + x2) / 2;
      const d = Math.abs(y1 - y2) < 1 ? `M${x1},${y1} L${x2},${y2}` : `M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}`;
      const path = el('path', { d, class: 'sch-link', 'marker-end': 'url(#arr)' }, lg);
      this.links.set(`${l.from}>${l.to}`, path);
    }
    for (const n of graph.nodes) {
      const [x, y] = P(n);
      const g = el('g', { class: 'sch-node', transform: `translate(${x},${y})`, tabindex: 0, role: 'button', 'aria-label': `${n.label}: ${n.role}` }, this.svg);
      const w = 136, h = 50;
      for (let i = 0; i < 4; i++) el('rect', { x: -w / 2 + 14 + i * 28, y: -h / 2 - 6, width: 16, height: 7, rx: 2, fill: KIND_FILL[n.kind] || '#8b93a3', class: 'sch-stud' }, g);
      el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 5, fill: KIND_FILL[n.kind] || '#8b93a3', class: 'sch-body' }, g);
      if (n.kind === 'gate' || n.kind === 'tool-write') el('rect', { x: -w / 2, y: h / 2 - 7, width: w, height: 7, fill: 'url(#none)', class: 'sch-hazard' }, g);
      const t = el('text', { x: 0, y: -2, 'text-anchor': 'middle', class: 'sch-label' }, g);
      if (n.label.length > 17) { // wrap long names onto two lines instead of clipping
        const words = n.label.split(' '); let a = ''; while (words.length && (a + words[0]).length <= Math.ceil(n.label.length / 2) + 2) a += `${words.shift()} `;
        if (!a) a = `${words.shift()} `;
        el('tspan', { x: 0, dy: -5 }, t).textContent = a.trim(); el('tspan', { x: 0, dy: 12 }, t).textContent = words.join(' ');
      } else t.textContent = n.label;
      const s = el('text', { x: 0, y: 17, 'text-anchor': 'middle', class: 'sch-status' }, g); s.textContent = 'idle';
      g.addEventListener('click', () => this.emit('select', n));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.emit('select', n); } });
      this.nodes.set(n.id, { g, s, n });
    }
  }
  setStatus(id, status) { const r = this.nodes.get(id); if (!r) return; r.s.textContent = status; r.g.dataset.status = status; }
  resetStatuses() { for (const id of this.nodes.keys()) this.setStatus(id, 'idle'); }
  flow(from, to, kind) {
    const p = this.links.get(`${from}>${to}`) || this.links.get(`${to}>${from}`); if (!p) return Promise.resolve();
    p.style.stroke = FLOW_COLOR[kind] || '#fff'; p.classList.add('active');
    setTimeout(() => { p.style.stroke = ''; p.classList.remove('active'); }, 900);
    return Promise.resolve();
  }
  setGate(id, open) { const r = this.nodes.get(id); if (r) r.g.dataset.gate = open ? 'open' : 'closed'; }
  setContext(id, used, budget) { const r = this.nodes.get(id); if (r) r.s.textContent = `${used.toLocaleString()} / ${budget.toLocaleString()} tokens`; }
  select() {}
  resize() {}
}
