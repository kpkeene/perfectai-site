// One shared WebGL stage for the whole app (missions, builder, chat).
// Raster rendering: shaded plastic, environment reflections from a generated room,
// soft shadow maps. This is NOT ray tracing and the UI never says it is.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { buildProp, setContextLevel, baseplate, plastic, PALETTE } from './bricks.js';

const STATUS_COLORS = { idle: 0x5a6274, working: 0xffb02e, ok: 0x2fe07a, blocked: 0xff3b2e, waiting: 0x7fb6ff, error: 0xff3b2e };
const PACKET_COLORS = { request: 0x2f8bff, result: 0x2fd06a, blocked: 0xff3b2e, write: 0xff7a1a, data: 0xeef1f6, approval: 0xf2d33a };

export class Stage {
  constructor(host, { lowGpu = false, reducedMotion = false } = {}) {
    this.host = host; this.lowGpu = lowGpu; this.reducedMotion = reducedMotion;
    this.canvasWrap = document.createElement('div'); this.canvasWrap.className = 'stage-canvas';
    this.labels = document.createElement('div'); this.labels.className = 'stage-labels';
    host.append(this.canvasWrap, this.labels);
    this.nodes = new Map(); this.pipes = new Map(); this.packets = new Set(); this.tweens = new Set();
    this.listeners = {}; this.selected = null;
    this.frameTimes = []; this.intervals = []; this.lastFrame = 0; this.lastTick = 0; this.benchUntil = 0; this.running = false; this.visible = true;
    try { this.initRenderer(); } catch (e) { this.failed = e; return; }
    this.initScene();
    this.bindInput();
    const ro = new ResizeObserver(() => this.resize()); ro.observe(host);
    new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; if (this.visible) this.kick(); }).observe(host);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.kick(); });
  }

  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); }
  emit(evt, data) { (this.listeners[evt] || []).forEach((f) => f(data)); }

  initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: !this.lowGpu, powerPreference: 'high-performance' });
    r.setPixelRatio(this.lowGpu ? 1 : Math.min(window.devicePixelRatio, 1.75));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = !this.lowGpu; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.setAttribute('aria-hidden', 'true');
    this.canvasWrap.append(r.domElement);
    this.renderer = r;
  }

  initScene() {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x161a33);
    s.fog = new THREE.Fog(0x161a33, 60, 140);
    this.scene = s;
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.5, 400);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.12;
    this.controls.maxPolarAngle = Math.PI / 2.15; this.controls.minDistance = 8; this.controls.maxDistance = 140;
    this.controls.enablePan = true; this.controls.screenSpacePanning = false;
    this.controls.addEventListener('change', () => this.kick());

    s.add(new THREE.HemisphereLight(0x9fb4ff, 0x2a2018, 0.55));
    const key = new THREE.DirectionalLight(0xffe2b8, 2.2); // warm "sodium lamp" key
    key.position.set(18, 30, 14); key.castShadow = !this.lowGpu;
    key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03;
    const sc = key.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 100;
    s.add(key); this.key = key;
    const rim = new THREE.DirectionalLight(0x7fa8ff, 0.8); rim.position.set(-20, 12, -18); s.add(rim);

    if (!this.lowGpu) {
      // Pre-filtered environment from a small generated "site office" room → plastic reflections.
      const pm = new THREE.PMREMGenerator(this.renderer);
      const room = new THREE.Scene();
      const box = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshStandardMaterial({ color: 0x30344a, side: THREE.BackSide }));
      room.add(box);
      const panel = (c, x, y, z, w, h, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); m.rotation.y = ry; m.lookAt(0, 0, 0); room.add(m); };
      panel(0xfff0d0, 0, 6.8, 0, 10, 10); panel(0xffd08a, 14.5, 3, 0, 6, 4); panel(0x8fb8ff, -14.5, 3, 5, 6, 4); panel(0xffffff, 0, 2, -14.5, 8, 3);
      s.environment = pm.fromScene(room, 0.04).texture; s.environmentIntensity = 0.55;
      pm.dispose();
    }
    this.world = new THREE.Group(); s.add(this.world);
    this.backdrop = new THREE.Group(); s.add(this.backdrop);
    this.buildBackdrop();
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2();
  }

  // Night-site atmosphere, far behind the table: a moon and a tower crane silhouette.
  buildBackdrop() {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }));
    moon.position.set(-26, 24, -12); this.backdrop.add(moon);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(4.6, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0.12 }));
    glow.position.copy(moon.position); this.backdrop.add(glow);
    const dark = new THREE.MeshBasicMaterial({ color: 0x0a0e1f });
    const crane = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.BoxGeometry(2.2, 46, 2.2), dark); mast.position.y = 23; crane.add(mast);
    const jib = new THREE.Mesh(new THREE.BoxGeometry(44, 1.6, 1.6), dark); jib.position.set(12, 46, 0); crane.add(jib);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(10, 2.4, 2), dark); counter.position.set(-9, 45.5, 0); crane.add(counter);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3, 3.2), dark); cab.position.set(2, 43.6, 0); crane.add(cab);
    const cable = new THREE.Mesh(new THREE.BoxGeometry(0.25, 20, 0.25), dark); cable.position.set(26, 36, 0); crane.add(cable);
    const hook = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.2), dark); hook.position.set(26, 25.5, 0); crane.add(hook);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b2e })); beacon.position.set(0, 47.4, 0); crane.add(beacon);
    crane.position.set(14, -2, 0); crane.scale.set(0.62, 0.62, 0.62); this.backdrop.add(crane);
  }

  // A sodium lamp post at the near corner of the table: the visible source of the warm key light.
  addLampPost(x, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 14, 10), plastic(PALETTE.dark)); pole.position.y = 7; pole.castShadow = !this.lowGpu; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 0.3), plastic(PALETTE.dark)); arm.position.set(-1.4, 13.9, 0); g.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.1), plastic(PALETTE.grey)); head.position.set(-2.8, 13.7, 0); g.add(head);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.9), plastic(0xffd48a, { emissive: 0xffb347 })); bulb.position.set(-2.8, 13.3, 0); g.add(bulb);
    const light = new THREE.PointLight(0xffb347, this.lowGpu ? 0 : 420, 60, 1.7); light.position.set(-2.8, 12.8, 0); g.add(light);
    g.position.set(x, 0, z); this.world.add(g);
  }

  bindInput() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const rect = el.getBoundingClientRect();
      this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects([...this.nodes.values()].map((n) => n.group), true)[0];
      if (hit) { let o = hit.object; while (o && !o.userData.nodeId) o = o.parent; if (o) this.select(o.userData.nodeId); }
    });
    this.host.addEventListener('keydown', (e) => {
      if (e.target.closest('button,input,textarea,select') && e.target !== this.host) return;
      const k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(k)) {
        e.preventDefault();
        if (k === 'ArrowLeft') this.orbit(-0.18, 0); if (k === 'ArrowRight') this.orbit(0.18, 0);
        if (k === 'ArrowUp') this.orbit(0, -0.1); if (k === 'ArrowDown') this.orbit(0, 0.1);
        if (k === '+' || k === '=') this.zoom(0.85); if (k === '-' || k === '_') this.zoom(1.18);
      }
    });
  }

  orbit(dTheta, dPhi) {
    const off = this.camera.position.clone().sub(this.controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta += dTheta; sph.phi = Math.min(Math.max(0.25, sph.phi + dPhi), this.controls.maxPolarAngle);
    off.setFromSpherical(sph); this.camera.position.copy(this.controls.target).add(off); this.controls.update(); this.kick();
  }
  zoom(f) {
    const off = this.camera.position.clone().sub(this.controls.target);
    const len = Math.min(Math.max(off.length() * f, this.controls.minDistance), this.controls.maxDistance);
    off.setLength(len); this.camera.position.copy(this.controls.target).add(off); this.controls.update(); this.kick();
  }

  // ---------- graph ----------
  setGraph(graph) {
    this.graph = graph; this.selected = null;
    for (const p of this.packets) { p.mesh.removeFromParent(); p.done?.(); } this.packets.clear(); this.tweens.clear();
    // Free GPU memory from the previous graph (shared cached geometry/materials are kept).
    this.world.traverse((o) => {
      if (o.geometry && !o.geometry.userData.cached) o.geometry.dispose();
      if (o.material && !o.material.userData.cached) o.material.dispose();
    });
    this.world.clear(); this.nodes.clear(); this.pipes.clear(); this.labels.innerHTML = '';
    if (this.failed) return;
    const xs = graph.nodes.map((n) => n.x), zs = graph.nodes.map((n) => n.z);
    const minX = Math.min(...xs) - 5, maxX = Math.max(...xs) + 5, minZ = Math.min(...zs) - 5, maxZ = Math.max(...zs) + 5;
    const bw = Math.ceil((maxX - minX) / 2) * 2, bd = Math.ceil((maxZ - minZ) / 2) * 2;
    const plate = baseplate(bw, bd); plate.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2); this.world.add(plate);
    this.bounds = { minX, maxX, minZ, maxZ };
    this.addLampPost(maxX - 1.5, maxZ - 1.5);
    this.backdrop.position.set((minX + maxX) / 2, 0, minZ - 26);

    for (const n of graph.nodes) {
      const group = buildProp(n.kind);
      group.position.set(n.x, 0, n.z);
      group.userData.nodeId = n.id;
      this.world.add(group);
      const label = document.createElement('button');
      label.className = 'node-label'; label.type = 'button'; label.tabIndex = -1; // the stage itself is the tab stop; labels are reached by arrow keys / pointer
      label.innerHTML = `<span class="nl-name"></span><span class="nl-status" data-status="idle">idle</span>`;
      label.querySelector('.nl-name').textContent = n.label;
      label.setAttribute('aria-label', `${n.label}: ${n.role}. Select for details.`);
      label.addEventListener('click', () => this.select(n.id));
      this.labels.append(label);
      const rec = { node: n, group, label, status: 'idle' };
      this.nodes.set(n.id, rec);
      if (n.kind === 'context') setContextLevel(group, 0, 1);
    }
    for (const l of graph.links) this.addPipe(l.from, l.to);
    this.fit(); this.kick();
  }

  addPipe(a, b) {
    const A = this.nodes.get(a), B = this.nodes.get(b); if (!A || !B) return;
    const h = 0.9;
    const pa = new THREE.Vector3(A.node.x, h, A.node.z), pb = new THREE.Vector3(B.node.x, h, B.node.z);
    const dx = pb.x - pa.x, dz = pb.z - pa.z;
    const pts = [];
    // Orthogonal routing with rounded elbows. Leave each node through the side of its base plate.
    if (Math.abs(dz) < 0.01 || Math.abs(dx) < 0.01) {
      const dir = pb.clone().sub(pa).normalize();
      pts.push(pa.clone().addScaledVector(dir, 2.05), pb.clone().addScaledVector(dir, -2.05));
    } else if (Math.abs(dx) >= Math.abs(dz)) {
      const sx = Math.sign(dx), mx = pa.x + dx / 2;
      pts.push(new THREE.Vector3(pa.x + sx * 2.05, h, pa.z), new THREE.Vector3(mx, h, pa.z), new THREE.Vector3(mx, h, pb.z), new THREE.Vector3(pb.x - sx * 2.05, h, pb.z));
    } else {
      const sz = Math.sign(dz), mz = pa.z + dz / 2;
      pts.push(new THREE.Vector3(pa.x, h, pa.z + sz * 2.05), new THREE.Vector3(pa.x, h, mz), new THREE.Vector3(pb.x, h, mz), new THREE.Vector3(pb.x, h, pb.z - sz * 2.05));
    }
    const path = new THREE.CurvePath();
    const R = 0.9;
    let cur = pts[0].clone();
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], prev = pts[i - 1], next = pts[i + 1];
      const r = Math.min(R, p.distanceTo(prev) / 2, p.distanceTo(next) / 2);
      if (r < 0.05) continue;
      const inPt = p.clone().addScaledVector(prev.clone().sub(p).normalize(), r);
      const outPt = p.clone().addScaledVector(next.clone().sub(p).normalize(), r);
      if (cur.distanceTo(inPt) > 0.01) path.add(new THREE.LineCurve3(cur, inPt));
      path.add(new THREE.QuadraticBezierCurve3(inPt, p.clone(), outPt));
      cur = outPt;
    }
    path.add(new THREE.LineCurve3(cur, pts[pts.length - 1].clone()));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(24, Math.round(path.getLength() * 3)), 0.2, 10, false),
      plastic(0xc9d2e3, { transparent: true, opacity: 0.55, roughness: 0.15 }));
    tube.castShadow = !this.lowGpu; this.world.add(tube);
    const collarMat = plastic(PALETTE.grey);
    for (const p of [pts[0], pts[pts.length - 1]]) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.35, 14), collarMat);
      const t = p === pts[0] ? path.getTangentAt(0) : path.getTangentAt(1);
      c.position.copy(p); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t); this.world.add(c);
    }
    // direction marker
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 12), plastic(0xeef1f6));
    cone.position.copy(path.getPointAt(0.5)); cone.position.y += 0.42;
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), path.getTangentAt(0.5)); this.world.add(cone);
    this.pipes.set(`${a}>${b}`, { path, tube, a, b });
  }

  pipeBetween(a, b) {
    const f = this.pipes.get(`${a}>${b}`); if (f) return { pipe: f, reverse: false };
    const r = this.pipes.get(`${b}>${a}`); if (r) return { pipe: r, reverse: true };
    return null;
  }

  fit() {
    if (!this.bounds) return;
    const { minX, maxX, minZ, maxZ } = this.bounds;
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const w = maxX - minX, d = maxZ - minZ;
    const aspect = Math.max(0.4, this.camera.aspect);
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const needH = (Math.max(d * 0.95, 9) + 3) / (2 * Math.tan(vfov / 2));
    const needW = (Math.max(w, 10) * 0.95) / (2 * Math.tan(vfov / 2) * aspect);
    const dist = Math.max(needH, needW) * 1.15 + 4;
    this.controls.target.set(cx, 1.6, cz);
    const elev = 0.76, az = -0.42;
    this.camera.position.set(cx + Math.sin(az) * Math.cos(elev) * dist, Math.sin(elev) * dist + 1.6, cz + Math.cos(az) * Math.cos(elev) * dist);
    this.controls.update(); this.kick();
  }

  resize() {
    if (this.failed) return;
    const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%'; this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.fit();
    this.renderer.render(this.scene, this.camera); // setSize clears the canvas; redraw now
    this.placeLabels();
  }

  // ---------- state changes ----------
  setStatus(id, status) {
    const n = this.nodes.get(id); if (!n) return;
    n.status = status;
    const lamp = n.group.userData.lamp;
    if (lamp) { lamp.material.color.setHex(STATUS_COLORS[status] ?? STATUS_COLORS.idle); lamp.material.emissive.setHex(status === 'idle' ? 0 : STATUS_COLORS[status]); }
    const chip = n.label.querySelector('.nl-status'); chip.dataset.status = status; chip.textContent = status;
    this.kick();
  }
  resetStatuses() { for (const id of this.nodes.keys()) this.setStatus(id, 'idle'); }

  setGate(id, open, { instant = false } = {}) {
    const n = this.nodes.get(id); const arm = n?.group.userData.arm; if (!arm) return;
    const target = open ? -Math.PI / 2.3 : 0;
    if (instant || this.reducedMotion) { arm.rotation.z = -target; this.kick(); return; }
    this.tween(arm.rotation, 'z', -target, 650);
  }

  setContext(id, used, budget) { const n = this.nodes.get(id); if (n) { setContextLevel(n.group, used, budget); this.kick(); } }

  select(id) {
    this.selected = id;
    for (const [nid, n] of this.nodes) n.label.classList.toggle('selected', nid === id);
    this.emit('select', this.nodes.get(id)?.node);
    this.kick();
  }

  // Animate a packet along the pipe between two nodes. Resolves when it arrives (or bounces).
  flow(from, to, kind = 'request', { instant = false, duration = 1100 } = {}) {
    const hit = this.pipeBetween(from, to);
    // When the canvas is off-screen (scrolled away, other view, hidden tab) nothing animates,
    // so resolve at once: the lesson timeline must never wait on rendering.
    const offscreen = !this.visible || document.hidden || !this.host.clientWidth;
    if (!hit || instant || this.reducedMotion || this.failed || offscreen) {
      if (hit && this.reducedMotion && !instant && !offscreen) this.flash(hit.pipe, kind);
      return Promise.resolve();
    }
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 18), plastic(PACKET_COLORS[kind] || 0xffffff, { emissive: PACKET_COLORS[kind], roughness: 0.2 }));
    mesh.castShadow = !this.lowGpu; this.world.add(mesh);
    const pk = { mesh, pipe: hit.pipe, reverse: hit.reverse, t0: performance.now(), duration, kind };
    this.packets.add(pk);
    return new Promise((res) => {
      let settled = false; const finish = () => { if (!settled) { settled = true; res(); } };
      pk.done = finish; this.kick();
      setTimeout(() => { if (this.packets.has(pk)) { pk.mesh.removeFromParent(); this.packets.delete(pk); } finish(); }, duration + 1800); // safety net
    });
  }

  flash(pipe, kind) {
    const m = pipe.tube.material; const old = m.color.getHex();
    if (m.userData.cached) { pipe.tube.material = m.clone(); pipe.tube.material.userData.cached = false; }
    pipe.tube.material.color.setHex(PACKET_COLORS[kind] || 0xffffff);
    setTimeout(() => { pipe.tube.material.color.setHex(old); this.kick(); }, 500); this.kick();
  }

  tween(obj, prop, to, ms) {
    const tw = { obj, prop, from: obj[prop], to, t0: performance.now(), ms }; this.tweens.add(tw); this.kick();
  }

  // ---------- frame loop: renders only while something changes ----------
  kick() { this.dirtyUntil = performance.now() + 400; if (!this.running && !this.failed) { this.running = true; requestAnimationFrame((t) => this.frame(t)); } }

  frame(t) {
    const maxFps = this.lowGpu ? 30 : 50;
    if (t - this.lastFrame < 1000 / maxFps - 1) { requestAnimationFrame((tt) => this.frame(tt)); return; }
    const dt = this.lastFrame ? t - this.lastFrame : 16; this.lastFrame = t;
    const busy = this.packets.size || this.tweens.size;
    // packets
    for (const pk of [...this.packets]) {
      let u = (t - pk.t0) / pk.duration;
      if (pk.kind === 'blocked') {
        if (!pk.fall && u >= 0.5) { // hits the boundary, then a tiny bounded physics bounce
          const p = pk.pipe.path.getPointAt(pk.reverse ? 0.5 : 0.5);
          pk.fall = { pos: p.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 3, 4, (Math.random() - 0.5) * 3), age: 0, bounces: 0 };
        }
        if (pk.fall) {
          const f = pk.fall; const s = dt / 1000; f.age += s;
          f.vel.y -= 18 * s; f.pos.addScaledVector(f.vel, s);
          if (f.pos.y < 0.2) { f.pos.y = 0.2; f.vel.y *= -0.45; f.vel.x *= 0.7; f.vel.z *= 0.7; f.bounces++; }
          pk.mesh.position.copy(f.pos); pk.mesh.rotation.x += s * 6;
          if (f.age > 1.1 || f.bounces > 3) { pk.mesh.removeFromParent(); this.packets.delete(pk); pk.done(); }
          continue;
        }
      }
      u = Math.min(u, 1);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      pk.mesh.position.copy(pk.pipe.path.getPointAt(pk.reverse ? 1 - e : e)); pk.mesh.position.y += 0.05;
      if (u >= 1) { pk.mesh.removeFromParent(); this.packets.delete(pk); pk.done(); }
    }
    for (const tw of [...this.tweens]) {
      const u = Math.min((t - tw.t0) / tw.ms, 1); const e = 1 - Math.pow(1 - u, 3);
      tw.obj[tw.prop] = tw.from + (tw.to - tw.from) * e; if (u >= 1) this.tweens.delete(tw);
    }
    // idle life: Patch's head and retry spinners (skipped in reduced-motion and low-GPU)
    if (!this.reducedMotion && !this.lowGpu) {
      for (const n of this.nodes.values()) {
        const hd = n.group.userData.head; if (hd) hd.rotation.y = Math.sin(t / 900 + n.node.x) * (n.status === 'working' ? 0.35 : 0.12);
        const sp = n.group.userData.spinner; if (sp && n.status === 'working') sp.rotation.z -= dt / 300;
      }
    }
    this.controls.update();
    const t0 = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.frameTimes.push(performance.now() - t0 + 0); if (this.frameTimes.length > 120) this.frameTimes.shift();
    this.placeLabels();
    const dtFrame = this.lastTick ? t - this.lastTick : 0; this.lastTick = t;
    if (dtFrame > 0 && dtFrame < 500) { this.intervals.push(dtFrame); if (this.intervals.length > 600) this.intervals.shift(); }
    const keepGoing = this.visible && !document.hidden && (this.benchUntil > performance.now() || busy || this.packets.size || this.tweens.size || performance.now() < this.dirtyUntil ||
      (!this.reducedMotion && !this.lowGpu && [...this.nodes.values()].some((n) => n.status === 'working')));
    if (this.benchUntil > performance.now()) this.orbit(dt / 2600, 0);
    if (keepGoing) requestAnimationFrame((tt) => this.frame(tt)); else { this.running = false; this.lastFrame = 0; this.lastTick = 0; }
  }

  // Continuous-render benchmark: orbits the camera for `ms` and reports frame pacing.
  // Run it while the local model is generating to see the real contention on your GPU.
  bench(ms = 8000) {
    this.frameTimes = []; this.intervals = []; this.benchUntil = performance.now() + ms; this.kick();
    return new Promise((res) => setTimeout(() => {
      const iv = [...this.intervals].sort((a, b) => a - b);
      const pct = (p) => +(iv[Math.min(iv.length - 1, Math.floor(iv.length * p))] || 0).toFixed(1);
      res({ seconds: ms / 1000, frames: iv.length, fps: iv.length ? +(1000 / (iv.reduce((a, b) => a + b, 0) / iv.length)).toFixed(1) : 0,
        frameIntervalP50: pct(0.5), frameIntervalP95: pct(0.95), cpuSubmitAvgMs: this.stats()?.avgMs, fpsCap: this.lowGpu ? 30 : 50 });
    }, ms + 50));
  }

  // Project labels above props and resolve overlaps (shift up, then compact, then hide).
  placeLabels() {
    const w = this.host.clientWidth, h = this.host.clientHeight; if (!w) return;
    const items = [];
    const v = new THREE.Vector3();
    for (const n of this.nodes.values()) {
      v.set(n.node.x, n.group.userData.top + 0.6, n.node.z).project(this.camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      items.push({ n, x, y, behind: v.z > 1 });
    }
    items.sort((a, b) => (b.n.node.id === this.selected) - (a.n.node.id === this.selected) || a.y - b.y);
    const placed = [];
    const compactMode = w < 560;
    for (const it of items) {
      const el = it.n.label;
      el.classList.toggle('compact', compactMode && it.n.node.id !== this.selected);
      const bw = el.offsetWidth || 120, bh = el.offsetHeight || 34;
      // Candidate positions: above the prop, then nudged up, then shifted sideways, before giving up.
      const free = (box) => !placed.some((p) => !(box.r < p.l + 2 || box.l > p.r - 2 || box.b < p.t + 2 || box.t > p.b - 2));
      const cands = [[0, 0], [0, -(bh * 0.7 + 4)], [bw * 0.55, -(bh * 0.35)], [-bw * 0.55, -(bh * 0.35)], [0, -2 * (bh * 0.7 + 4)], [bw * 0.55, -(bh * 1.05 + 4)], [-bw * 0.55, -(bh * 1.05 + 4)]];
      let x = it.x, y = it.y - bh, ok = false;
      for (const [dx, dy] of cands) {
        const cx = Math.min(Math.max(bw / 2 + 4, it.x + dx), w - bw / 2 - 4), cy = Math.max(4, it.y - bh + dy);
        const box = { l: cx - bw / 2, r: cx + bw / 2, t: cy, b: cy + bh };
        if (free(box)) { placed.push(box); x = cx; y = cy; ok = true; break; }
      }
      const inView = !it.behind && it.x > -bw && it.x < w + bw && y > -bh && y < h;
      const lx = Math.min(Math.max(4, x - bw / 2), w - bw - 4); // keep labels inside the stage
      el.style.transform = `translate(${Math.round(lx)}px, ${Math.round(Math.max(4, y))}px)`;
      el.classList.toggle('hidden', !ok || !inView);
    }
  }

  stats() {
    const a = this.frameTimes; if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    return { frames: a.length, avgMs: +(a.reduce((p, c) => p + c, 0) / a.length).toFixed(2), p95Ms: +s[Math.floor(s.length * 0.95)].toFixed(2) };
  }
}
