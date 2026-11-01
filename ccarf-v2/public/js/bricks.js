// Procedural interlocking-brick models. Original designs: generic studded bricks,
// round bricks, plates and tiles assembled into props. No trademarked shapes.
import * as THREE from '../vendor/three.module.min.js';

export const U = 1;            // one stud pitch
export const BRICK_H = 1.2;    // brick height in stud pitches
export const PLATE_H = 0.4;
const GAP = 0.04;              // visible seam between neighbouring bricks
const STUD_R = 0.3, STUD_H = 0.18;

export const PALETTE = {
  amber: 0xffb02e, red: 0xe23b2e, blue: 0x2f6fde, teal: 0x1f9e93, green: 0x2fa652,
  white: 0xeef1f6, grey: 0x8b93a3, dark: 0x3a4152, black: 0x23262f, beige: 0xd9b98c,
  orange: 0xff7a1a, purple: 0x7b5cd6, yellow: 0xf2d33a, sky: 0x8fc7ff,
};

const matCache = new Map();
export function plastic(color, opts = {}) {
  const key = `${color}|${opts.emissive || 0}|${opts.transparent ? 1 : 0}|${opts.map ? opts.map.uuid : ''}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.32, metalness: 0.0,
    emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissive ? 0.9 : 0,
    transparent: !!opts.transparent, opacity: opts.opacity ?? 1, map: opts.map || null,
  });
  m.userData.cached = true;
  matCache.set(key, m);
  return m;
}

// Merge non-indexed geometries (positions + normals + uvs) into one draw call.
function merge(geos) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = parts.reduce((s, g) => s + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}

const geoCache = new Map();
function studGeo() { return new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 18); }

// w × d studs, h in stud pitches (1.2 brick, 0.4 plate). Studs on top unless tile.
export function brickGeometry(w, d, h = BRICK_H, { studs = true, round = false } = {}) {
  const key = `${w}x${d}x${h}${studs}${round}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const geos = [];
  if (round) geos.push(new THREE.CylinderGeometry(w / 2 - GAP, w / 2 - GAP, h - GAP, 28).translate(0, h / 2, 0));
  else geos.push(new THREE.BoxGeometry(w - GAP, h - GAP, d - GAP).translate(0, h / 2, 0));
  if (studs) {
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
      if (round && w <= 2 && (i + j) % 2) continue; // a round 2x2 shows a single centre-ish ring
      geos.push(studGeo().translate(i - (w - 1) / 2, h + STUD_H / 2 - GAP / 2, j - (d - 1) / 2));
    }
  }
  const g = merge(geos);
  g.userData.cached = true;
  geoCache.set(key, g);
  return g;
}

export function brick(w, d, h, color, opts = {}) {
  const mesh = new THREE.Mesh(brickGeometry(w, d, h, opts), opts.material || plastic(color, opts));
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }

// Hazard-stripe texture for permission boundaries (meaningful, not decoration).
let hazardTex = null;
export function hazardTexture() {
  if (hazardTex) return hazardTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#f2d33a'; g.fillRect(0, 0, 128, 32);
  g.fillStyle = '#23262f';
  for (let x = -32; x < 160; x += 32) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 16, 32); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0); g.fill(); }
  hazardTex = new THREE.CanvasTexture(c); hazardTex.colorSpace = THREE.SRGBColorSpace;
  hazardTex.wrapS = THREE.RepeatWrapping; hazardTex.repeat.set(2, 1);
  return hazardTex;
}

// ---------- props (each sits on a 4×4 dark base plate, origin at plate centre) ----------
function basePlate(group) {
  group.add(at(brick(4, 4, PLATE_H, PALETTE.dark), 0, 0, 0));
  return PLATE_H + STUD_H * 0; // top of plate (studs ignored for stacking simplicity)
}

function statusLamp(group, y) {
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16), plastic(PALETTE.grey, { emissive: 0x000000 }).clone());
  lamp.material.emissiveIntensity = 1.2; lamp.material.userData.cached = false;
  at(lamp, 1.5, y + 0.08, 1.5);
  group.add(lamp);
  group.userData.lamp = lamp;
}

const builders = {
  agent(g, y, c = PALETTE.amber) {
    // Patch: brick-built night-shift robot.
    g.add(at(brick(1, 2, BRICK_H, PALETTE.dark), -0.5, y, 0));
    g.add(at(brick(1, 2, BRICK_H, PALETTE.dark), 0.5, y, 0));
    g.add(at(brick(2, 3, BRICK_H, c), 0, y + BRICK_H, 0));
    g.add(at(brick(1, 1, BRICK_H * 0.8, c, { studs: false }), -1.5, y + BRICK_H * 1.1, 0)); // arms
    g.add(at(brick(1, 1, BRICK_H * 0.8, c, { studs: false }), 1.5, y + BRICK_H * 1.1, 0));
    const head = new THREE.Group(); at(head, 0, y + BRICK_H * 2, 0);
    head.add(brick(2, 2, BRICK_H, PALETTE.white));
    const eyeMat = plastic(PALETTE.sky, { emissive: 0x4fb3ff });
    for (const x of [-0.45, 0.45]) {
      const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16), eyeMat);
      eye.rotation.x = Math.PI / 2; at(eye, x, 0.7, 1.0); head.add(eye);
    }
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), plastic(PALETTE.grey)); at(ant, 0.5, 1.6, -0.5); head.add(ant);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), plastic(PALETTE.red, { emissive: 0xff2a1a })); at(tip, 0.5, 2.05, -0.5); head.add(tip);
    g.add(head); g.userData.head = head;
    return y + BRICK_H * 3.2;
  },
  retriever(g, y) {
    g.add(at(brick(3, 2, BRICK_H, PALETTE.blue), 0, y, 0.5));
    const docMat = plastic(PALETTE.white);
    [-0.8, 0, 0.8].forEach((x, i) => {
      const doc = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1 - i * 0.15, 0.1), docMat);
      doc.castShadow = true; at(doc, x, y + BRICK_H + 0.75, -0.6 + i * 0.05); doc.rotation.z = (i - 1) * 0.08; g.add(doc);
    });
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.11, 10, 28), plastic(PALETTE.amber));
    at(lens, 0.6, y + BRICK_H + 1.1, 0.7); lens.rotation.y = 0.5; lens.castShadow = true; g.add(lens);
    return y + BRICK_H + 1.8;
  },
  'tool-read'(g, y) {
    g.add(at(brick(3, 2, BRICK_H, PALETTE.teal), 0, y, 0));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 8, 20, Math.PI), plastic(PALETTE.grey));
    at(handle, 0, y + BRICK_H + 0.2, 0); g.add(handle);
    g.add(at(brick(1, 1, PLATE_H, PALETTE.white, { studs: false }), -1, y + BRICK_H, 0.5));
    return y + BRICK_H + 0.9;
  },
  'tool-write'(g, y) {
    g.add(at(brick(3, 2, BRICK_H, PALETTE.red), 0, y, 0));
    const tile = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 0.6), plastic(0xffffff, { map: hazardTexture() }));
    at(tile, 0, y + BRICK_H * 0.5, 1.02); tile.rotation.x = Math.PI / 2; g.add(tile);
    const stamp = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 20), plastic(PALETTE.black));
    at(stamp, 0, y + BRICK_H + 0.6, 0); stamp.castShadow = true; g.add(stamp);
    return y + BRICK_H + 1.2;
  },
  gate(g, y) {
    g.add(at(brick(1, 1, BRICK_H * 3, PALETTE.grey), -1.5, y, 0));
    g.add(at(brick(1, 1, BRICK_H * 2, PALETTE.grey), 1.5, y, 0));
    const pivot = new THREE.Group(); at(pivot, -1.5, y + BRICK_H * 2.4, 0.6);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 0.3), plastic(0xffffff, { map: hazardTexture() }));
    arm.castShadow = true; at(arm, 1.8, 0, 0); pivot.add(arm);
    g.add(pivot); g.userData.arm = pivot;
    return y + BRICK_H * 3.2;
  },
  store(g, y, c = PALETTE.blue) {
    for (let i = 0; i < 3; i++) g.add(at(brick(2, 2, BRICK_H * 0.9, i === 2 ? PALETTE.white : c, { round: true, studs: i === 2 }), 0, y + i * BRICK_H * 0.9, 0));
    return y + BRICK_H * 2.9;
  },
  context(g, y) {
    const stack = new THREE.Group(); at(stack, 0, y, 0); g.add(stack);
    // Budget line: a red frame at 10 levels, held up by two thin posts (reads clearly from above).
    const ly = y + 10 * PLATE_H * 1.5; const red = plastic(PALETTE.red, { emissive: 0x7a0d06 });
    for (const [w, d, x, z] of [[2.8, 0.14, 0, -1.3], [2.8, 0.14, 0, 1.3], [0.14, 2.6, -1.4, 0], [0.14, 2.6, 1.4, 0]]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), red); at(bar, x, ly, z); g.add(bar);
    }
    for (const x of [-1.4, 1.4]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, ly - y, 8), plastic(PALETTE.grey)); at(post, x, y + (ly - y) / 2, 1.3); g.add(post); }
    g.userData.stack = stack; g.userData.stackBase = y;
    return y + 10 * PLATE_H * 1.5 + 0.4;
  },
  human(g, y, c = PALETTE.green) {
    g.add(at(brick(1, 1, BRICK_H, PALETTE.dark), -0.5, y, 0));
    g.add(at(brick(1, 1, BRICK_H, PALETTE.dark), 0.5, y, 0));
    g.add(at(brick(2, 1, BRICK_H, c), 0, y + BRICK_H, 0));
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.8, 20), plastic(PALETTE.beige)); at(head, 0, y + BRICK_H * 2 + 0.45, 0); head.castShadow = true; g.add(head);
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), plastic(PALETTE.orange)); at(hat, 0, y + BRICK_H * 2 + 0.8, 0); hat.castShadow = true; g.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 20), plastic(PALETTE.orange)); at(brim, 0, y + BRICK_H * 2 + 0.8, 0.05); g.add(brim);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.08), plastic(PALETTE.white)); at(clip, 0.9, y + BRICK_H * 1.4, 0.4); clip.rotation.z = -0.3; g.add(clip);
    return y + BRICK_H * 2 + 1.4;
  },
  validator(g, y) {
    g.add(at(brick(3, 2, BRICK_H, PALETTE.green), 0, y, 0));
    const m = plastic(PALETTE.white);
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), m); at(a, -0.35, y + BRICK_H + 0.45, 0); a.rotation.z = 0.7; g.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 0.3), m); at(b, 0.35, y + BRICK_H + 0.75, 0); b.rotation.z = -0.55; g.add(b);
    return y + BRICK_H + 1.7;
  },
  retry(g, y) {
    g.add(at(brick(2, 2, BRICK_H, PALETTE.purple), 0, y, 0));
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.14, 10, 30, Math.PI * 1.6), plastic(PALETTE.white));
    at(loop, 0, y + BRICK_H + 0.9, 0); g.add(loop); g.userData.spinner = loop;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 12), plastic(PALETTE.white)); at(cone, 0.75, y + BRICK_H + 0.9, 0); g.add(cone);
    return y + BRICK_H + 1.8;
  },
  log(g, y) {
    for (let i = 0; i < 4; i++) g.add(at(brick(2, 3, PLATE_H, i % 2 ? PALETTE.white : PALETTE.sky, { studs: i === 3 }), 0, y + i * PLATE_H, 0));
    g.add(at(brick(1, 3, BRICK_H * 1.4, PALETTE.dark, { studs: false }), -1.3, y, 0));
    return y + PLATE_H * 4 + 0.4;
  },
  answer(g, y) {
    g.add(at(brick(2, 2, BRICK_H * 2, PALETTE.white), 0, y, 0));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 8), plastic(PALETTE.grey)); at(pole, 0.6, y + BRICK_H * 2 + 0.9, 0.6); g.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.05), plastic(PALETTE.green)); at(flag, 1.05, y + BRICK_H * 2 + 1.5, 0.6); g.add(flag);
    return y + BRICK_H * 2 + 1.9;
  },
  compactor(g, y) {
    g.add(at(brick(3, 3, BRICK_H, PALETTE.teal), 0, y, 0));
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(at(brick(1, 1, BRICK_H, PALETTE.grey, { studs: false }), x, y + BRICK_H, z));
    const press = at(brick(3, 3, PLATE_H, PALETTE.dark), 0, y + BRICK_H * 2, 0); g.add(press); g.userData.press = press;
    return y + BRICK_H * 2 + 0.7;
  },
  router(g, y) {
    g.add(at(brick(2, 2, BRICK_H, PALETTE.sky), 0, y, 0));
    const pm = plastic(PALETTE.grey);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.8, 14), pm); t.rotation.z = Math.PI / 2; at(t, 0, y + BRICK_H + 0.35, 0); g.add(t);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14), pm); s.rotation.x = Math.PI / 2; at(s, 0, y + BRICK_H + 0.35, 0.45); g.add(s);
    return y + BRICK_H + 0.9;
  },
  user(g, y) { return builders.human(g, y, PALETTE.blue); },
  cache(g, y) {
    g.add(at(brick(3, 2, BRICK_H * 1.6, PALETTE.yellow), 0, y, 0));
    g.add(at(brick(2, 1, PLATE_H, PALETTE.dark, { studs: false }), 0, y + 0.7, 1.05).rotateX(Math.PI / 2));
    return y + BRICK_H * 1.6 + 0.3;
  },
  eval(g, y) {
    g.add(at(brick(2, 3, BRICK_H, PALETTE.grey), 0, y, 0));
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.1), plastic(PALETTE.white)); at(board, 0, y + BRICK_H + 0.9, 0); board.rotation.x = -0.25; g.add(board);
    return y + BRICK_H + 2;
  },
  subagent(g, y) { return builders.agent(g, y, PALETTE.orange); },
  bound(g, y) {
    g.add(at(brick(2, 2, BRICK_H, PALETTE.dark), 0, y, 0));
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.15, 24), plastic(PALETTE.white)); dial.rotation.x = Math.PI / 2; at(dial, 0, y + 0.6, 1.05); g.add(dial);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.05), plastic(PALETTE.red)); at(needle, 0.12, y + 0.8, 1.15); needle.rotation.z = -0.6; g.add(needle);
    return y + BRICK_H + 0.3;
  },
  guard(g, y) {
    g.add(at(brick(2, 2, BRICK_H, PALETTE.purple), 0, y, 0));
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 6), plastic(PALETTE.white)); shield.rotation.x = Math.PI / 2; at(shield, 0, y + BRICK_H + 0.8, 0); g.add(shield);
    return y + BRICK_H + 1.7;
  },
};

export function buildProp(kind) {
  const g = new THREE.Group();
  const y = basePlate(g);
  const fn = builders[kind] || builders['tool-read'];
  const top = fn(g, y);
  statusLamp(g, y);
  g.userData.top = top;
  g.userData.kind = kind;
  return g;
}

// Context tower: re-stack 1×2 bricks to show used tokens vs budget (10 levels = budget).
export function setContextLevel(group, used, budget) {
  const stack = group.userData.stack; if (!stack) return;
  while (stack.children.length) stack.remove(stack.children[0]);
  const levels = Math.min(14, Math.round((used / budget) * 10));
  for (let i = 0; i < levels; i++) {
    const over = i >= 10;
    const color = over ? PALETTE.red : i >= 8 ? PALETTE.orange : PALETTE.green;
    const b = brick(2, 2, PLATE_H * 1.5, color, { studs: i === levels - 1 });
    b.position.set(i % 2 ? 0.08 : -0.08, i * PLATE_H * 1.5, 0); stack.add(b);
  }
}

// Baseplate with instanced studs (one draw call for hundreds of studs).
export function baseplate(w, d, color = 0x2a3a2f) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), plastic(color, { roughness: 0.55 }));
  plate.position.y = -0.15; plate.receiveShadow = true; g.add(plate);
  const count = Math.floor(w / 2) * Math.floor(d / 2);
  const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 12), plastic(color, { roughness: 0.55 }), count);
  const m = new THREE.Matrix4(); let k = 0;
  for (let i = 0; i < Math.floor(w / 2); i++) for (let j = 0; j < Math.floor(d / 2); j++) {
    m.makeTranslation(-w / 2 + 1 + i * 2, 0.08, -d / 2 + 1 + j * 2); inst.setMatrixAt(k++, m);
  }
  inst.receiveShadow = true; g.add(inst);
  return g;
}
