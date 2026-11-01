// Patch's pixel sprite: 24×24 original pixel art, full body, one face per reaction,
// with a separate blink frame that CSS toggles (no JS timers).
const C = { k: '#1b1e2b', w: '#f2f4f8', g: '#b9c0cf', b: '#4fb3ff', B: '#1a5fc8', r: '#e23b2e', a: '#ffb02e', A: '#d98a12', y: '#ffd166', d: '#2a2f45', o: '#ff6a1a', p: '#ff8fa3' };

// eyes: [row1, row2] 2px each; mouth: [row1,row2] 8px each (x 8..15)
const FACES = {
  neutral:   { eyes: ['bb', 'BB'], mouth: ['........', '..kkkkk.'] },
  smug:      { eyes: ['ww', 'BB'], mouth: ['......kk', '....kkww'] },
  delighted: { eyes: ['wb', 'bw'], mouth: ['kwwwwwwk', 'wkkkkkkw'] },
  alarmed:   { eyes: ['bb', 'bB'], mouth: ['...kk...', '...kk...'] },
  facepalm:  { eyes: ['kk', 'ww'], mouth: ['........', '.kkkkkk.'], hand: true },
  busy:      { eyes: ['BB', 'bb'], mouth: ['...kk...', '..kkkk..'] },
  sleepy:    { eyes: ['ww', 'kk'], mouth: ['...kk...', '........'] },
};

function rows(pose, blink = false) {
  const f = FACES[pose] || FACES.neutral;
  const eye = (i) => (blink ? (i ? 'kk' : 'ww') : f.eyes[i]);
  const R = [
    '...........r............',
    '...........k............',
    '...........k............',
    '......kkkkkkkkkkkk......',
    '.....kwwwwwwwwwwwwk.....',
    '.....kwwwwwwwwwwwgk.....',
    `.....kww${eye(0)}wwww${eye(0)}wgk.....`,
    `.....kww${eye(1)}wwww${eye(1)}wgk.....`,
    '.....kwwwwwwwwwwwgk.....',
    `.....kww${f.mouth[0]}wgk.....`,
    `.....kww${f.mouth[1]}wgk.....`,
    '.....kwwwwwwwwwwwgk.....',
    '......kkkkkkkkkkkk......',
    '.........kggggk.........',
    '.......yy..yy..yy.......',
    '.....kaaaaaaaaaaaak.....',
    '...kakaaaaaaaaaaaakak...',
    '...kakaaakddddkaaakak...',
    '...kakaaakdbbdkaaakak...',
    '...kkkAAAAAAAAAAAAkkk...',
    '......kddddkkddddk......',
    '......kddddkkddddk......',
    '......kddddkkddddk......',
    '......kkkkkkkkkkkk......',
  ];
  if (f.hand) {
    R[5] = '.....kwwkaaaaakwwwgk....'.slice(0, 24);
    R[6] = '.....kwkaaaaaaakwwgk....'.slice(0, 24);
    R[7] = '.....kwkaaaaaaakwwgk....'.slice(0, 24);
    R[8] = '.....kwwkAAAAAkwwwgk....'.slice(0, 24);
    R[14] = '...kkkyy..yy..yy........';
    R[15] = '...kakaaaaaaaaaaaak.....';
    R[16] = '...kakaaaaaaaaaaaakak...';
  }
  return R.map((r) => r.replace(/\./g, '.').padEnd(24, '.').slice(0, 24));
}

function rects(R, filter) {
  let out = '';
  R.forEach((row, y) => [...row].forEach((ch, x) => { if (C[ch] && (!filter || filter(x, y))) out += `<rect x="${x}" y="${y}" width="1" height="1" fill="${C[ch]}"/>`; }));
  return out;
}

export function portraitSVG(pose = 'neutral', size = 96) {
  const open = rows(pose, false), closed = rows(pose, true);
  const eyeArea = (x, y) => y >= 6 && y <= 7 && x >= 8 && x <= 15;
  const blinkable = !FACES[pose]?.hand && pose !== 'sleepy';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="Patch, looking ${pose}" class="sprite pose-${pose}">
    ${rects(open, (x, y) => !eyeArea(x, y))}
    <g class="eyes-open">${rects(open, eyeArea)}</g>
    ${blinkable ? `<g class="eyes-closed">${rects(closed, eyeArea)}</g>` : ''}
  </svg>`;
}

// Level markers: small pixel badges with the level number.
export function markerSVG(label, state = 'open') {
  const fill = state === 'done' ? '#1f8a4c' : state === 'best' ? '#ffb02e' : '#2f6fde';
  return `<svg viewBox="0 0 12 12" width="44" height="44" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="1" y="2" width="10" height="9" fill="#1b1e2b"/><rect x="2" y="3" width="8" height="7" fill="${fill}"/>
    <rect x="3" y="1" width="2" height="2" fill="${fill}"/><rect x="7" y="1" width="2" height="2" fill="${fill}"/>
    <text x="6" y="8.6" font-size="4.6" text-anchor="middle" fill="#fff" font-family="Pixelify Sans, monospace">${label}</text></svg>`;
}

// A pager icon that can "ring" (CSS class).
export function pagerSVG() {
  return `<svg viewBox="0 0 12 8" width="30" height="20" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="1" width="12" height="7" fill="#1b1e2b"/><rect x="1" y="2" width="7" height="4" fill="#7ad6ff"/><rect x="9" y="2" width="2" height="2" fill="#ff6a1a"/><rect x="2" y="0" width="1" height="1" fill="#1b1e2b"/></svg>`;
}
