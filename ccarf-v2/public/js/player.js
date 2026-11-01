// Paced playback of "beats" (groups of scene events with one caption).
// Beats can arrive faster than people read (e.g. while tokens stream); the player
// buffers them and enforces a minimum reading interval. Pause / step / replay supported.
export class Player {
  constructor(targets, { minMs = 1500, reducedMotion = false } = {}) {
    this.targets = targets; this.minMs = reducedMotion ? 900 : minMs; this.reducedMotion = reducedMotion;
    this.beats = []; this.index = -1; this.paused = false; this.timer = null; this.listeners = {}; this.resetFn = null; this.busy = false;
  }
  on(e, f) { (this.listeners[e] ||= []).push(f); }
  emit(e, d) { (this.listeners[e] || []).forEach((f) => f(d)); }

  load(beats, resetFn) { this.stop(); this.beats = [...beats]; this.index = -1; this.resetFn = resetFn; this.reset(); this.emit('change', this.state()); this.schedule(0); }
  clear(resetFn) { this.stop(); this.beats = []; this.index = -1; this.resetFn = resetFn || this.resetFn; this.reset(); this.emit('change', this.state()); }
  enqueue(...beats) { this.beats.push(...beats); this.emit('change', this.state()); if (!this.timer && !this.busy && !this.paused) this.schedule(this.index < 0 ? 0 : this.minMs * 0.4); }

  reset() { this.targets.forEach((t) => t.resetStatuses?.()); this.resetFn?.(); }
  stop() { clearTimeout(this.timer); this.timer = null; }

  schedule(ms) {
    this.stop();
    if (this.paused || this.index >= this.beats.length - 1) { this.emit('change', this.state()); return; }
    this.timer = setTimeout(() => { this.timer = null; this.advance(); }, ms);
  }

  async advance() {
    if (this.index >= this.beats.length - 1) return;
    this.busy = true; this.index++;
    const beat = this.beats[this.index];
    this.emit('beat', { index: this.index, beat });
    this.emit('change', this.state());
    const t0 = performance.now();
    await this.apply(beat, false);
    this.busy = false;
    const spent = performance.now() - t0;
    this.schedule(Math.max(150, this.minMs - spent));
  }

  async apply(beat, instant) {
    const jobs = [];
    for (const ev of beat.events || []) {
      for (const t of this.targets) {
        if (ev.t === 'flow') jobs.push(t.flow(ev.from, ev.to, ev.kind, { instant }));
        else if (ev.t === 'status') t.setStatus(ev.node, ev.status);
        else if (ev.t === 'gate') t.setGate(ev.node, ev.open, { instant });
        else if (ev.t === 'context') t.setContext(ev.node, ev.used, ev.budget);
      }
    }
    if (!instant) await Promise.all(jobs);
  }

  // Rebuild state up to beat i instantly (used by previous / jump).
  async jump(i) {
    this.stop(); this.reset();
    for (let k = 0; k <= i && k < this.beats.length; k++) await this.apply(this.beats[k], true);
    this.index = Math.min(i, this.beats.length - 1);
    if (this.index >= 0) this.emit('beat', { index: this.index, beat: this.beats[this.index], jumped: true });
    this.emit('change', this.state());
  }
  next() { if (this.index < this.beats.length - 1) { this.stop(); this.advance().then(() => { if (this.paused) this.stop(); }); } }
  prev() { this.jump(this.index - 1); }
  replay() { this.paused = false; this.jump(-1).then(() => this.schedule(300)); }
  pause() { this.paused = true; this.stop(); this.emit('change', this.state()); }
  play() { this.paused = false; this.schedule(200); this.emit('change', this.state()); }
  toggle() { this.paused ? this.play() : this.pause(); }
  state() { return { index: this.index, total: this.beats.length, paused: this.paused, pending: this.beats.length - 1 - this.index }; }
}
