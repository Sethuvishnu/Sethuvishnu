/* ═══════════════════════════════════════════
   ✏️  ADJUST THESE VALUES TO CHANGE SPACING
   ═══════════════════════════════════════════ */

const CONFIG = {
  GAP_X: 1100,
  GAP_Y: 980,
  CARD_W: 280,
  CARD_H: 320,
};

function makeCard() {
  const card = document.createElement('div');
  card.className = 'portfolio-card';
  card.innerHTML = `
    <div class="card-tag">Available for hire</div>
    <div class="card-name">Sethu Vishnu K</div>
    <div class="card-title">Creative Technologist</div>
    <div class="card-divider"></div>
    <div class="card-section-label">Skills</div>
    <div class="card-skills">
      <span class="skill-pill">React Native</span>
      <span class="skill-pill">Node.js</span>
      <span class="skill-pill">Motion Design</span>
      <span class="skill-pill">AI / LLMs</span>
      <span class="skill-pill">After Effects</span>
    </div>
    <div class="card-section-label">Links</div>
    <div class="card-links">
      <a class="card-link" href="https://runcity.xyz" target="_blank">runcity.xyz</a>
      <a class="card-link" href="https://github.com/Sethuvishnu" target="_blank">GitHub</a>
    </div>
  `;
  return card;
}

const TILE_W = CONFIG.CARD_W + CONFIG.GAP_X;
const TILE_H = CONFIG.CARD_H + CONFIG.GAP_Y;

const wrap   = document.getElementById('canvas-wrap');
const canvas = document.getElementById('infinite-canvas');

const W = window.innerWidth;
const H = window.innerHeight;

const COLS = Math.ceil(W / TILE_W) + 6;
const ROWS = Math.ceil(H / TILE_H) + 6;

let offsetX = 0, offsetY = 0;
let dragging = false;
let startX, startY, startOX, startOY;

const cards = [];

function placeCard(card, bx, by) {
  card.dataset.baseX = bx;
  card.dataset.baseY = by;
  card.style.transform = `translate3d(${bx}px, ${by}px, 0)`;
}

for (let row = -3; row < ROWS; row++) {
  for (let col = -3; col < COLS; col++) {
    const card = makeCard();
    const bx = col * TILE_W + (W / 2 - CONFIG.CARD_W / 2);
    const by = row * TILE_H + (H / 2 - CONFIG.CARD_H / 2);
    placeCard(card, bx, by);
    canvas.appendChild(card);
    cards.push(card);
  }
}

function updateCards() {
  const ox = ((offsetX % TILE_W) + TILE_W) % TILE_W;
  const oy = ((offsetY % TILE_H) + TILE_H) % TILE_H;
  cards.forEach(card => {
    const x = parseFloat(card.dataset.baseX) + ox;
    const y = parseFloat(card.dataset.baseY) + oy;
    card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
  updatePhotoCards(); // keep photos in sync
}

/* ═══════════════════════════════════════════
   ✏️  PHYSICS TUNING
   ═══════════════════════════════════════════ */

const FRICTION        = 0.96;
const STOP_THRESHOLD  = 0.01;
const DRAG_SMOOTH     = 0.2;
const DRAG_RESISTANCE = 0.45;

let velX = 0, velY = 0;
let targetOffsetX = 0, targetOffsetY = 0;
let lastX, lastY, lastT;
let momentumRAF = null;
let dragRAF = null;

function cancelMomentum() {
  if (momentumRAF) cancelAnimationFrame(momentumRAF);
  momentumRAF = null;
}

function cancelDragLoop() {
  if (dragRAF) cancelAnimationFrame(dragRAF);
  dragRAF = null;
}

function dragLoop() {
  offsetX += (targetOffsetX - offsetX) * DRAG_SMOOTH;
  offsetY += (targetOffsetY - offsetY) * DRAG_SMOOTH;
  updateCards();
  if (dragging) dragRAF = requestAnimationFrame(dragLoop);
}

function startMomentum() {
  function step() {
    offsetX += velX * 16;
    offsetY += velY * 16;
    velX *= FRICTION;
    velY *= FRICTION;
    updateCards();
    if (Math.abs(velX) > STOP_THRESHOLD || Math.abs(velY) > STOP_THRESHOLD) {
      momentumRAF = requestAnimationFrame(step);
    } else {
      momentumRAF = null;
    }
  }
  momentumRAF = requestAnimationFrame(step);
}

/* Mouse */
wrap.addEventListener('mousedown', e => {
  cancelMomentum();
  dragging = true;
  startX = e.clientX; startY = e.clientY;
  startOX = offsetX;  startOY = offsetY;
  targetOffsetX = offsetX; targetOffsetY = offsetY;
  lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
  velX = 0; velY = 0;
  wrap.classList.add('dragging');
  cancelDragLoop();
  dragRAF = requestAnimationFrame(dragLoop);
});

window.addEventListener('mousemove', e => {
  if (!dragging) return;
  const dx = (e.clientX - startX) * DRAG_RESISTANCE;
  const dy = (e.clientY - startY) * DRAG_RESISTANCE;
  targetOffsetX = startOX + dx;
  targetOffsetY = startOY + dy;

  const now = performance.now();
  const dt = now - lastT;
  if (dt > 0) {
    velX = 0.8 * velX + 0.2 * ((e.clientX - lastX) * DRAG_RESISTANCE / dt);
    velY = 0.8 * velY + 0.2 * ((e.clientY - lastY) * DRAG_RESISTANCE / dt);
  }
  lastX = e.clientX; lastY = e.clientY; lastT = now;
});

window.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  cancelDragLoop();
  wrap.classList.remove('dragging');
  startMomentum();
});

/* Touch */
wrap.addEventListener('touchstart', e => {
  cancelMomentum();
  const t = e.touches[0];
  dragging = true;
  startX = t.clientX; startY = t.clientY;
  startOX = offsetX;  startOY = offsetY;
  targetOffsetX = offsetX; targetOffsetY = offsetY;
  lastX = t.clientX; lastY = t.clientY; lastT = performance.now();
  velX = 0; velY = 0;
  wrap.classList.add('dragging');
  cancelDragLoop();
  dragRAF = requestAnimationFrame(dragLoop);
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (!dragging) return;
  const t = e.touches[0];
  const dx = (t.clientX - startX) * DRAG_RESISTANCE;
  const dy = (t.clientY - startY) * DRAG_RESISTANCE;
  targetOffsetX = startOX + dx;
  targetOffsetY = startOY + dy;

  const now = performance.now();
  const dt = now - lastT;
  if (dt > 0) {
    velX = 0.8 * velX + 0.2 * ((t.clientX - lastX) * DRAG_RESISTANCE / dt);
    velY = 0.8 * velY + 0.2 * ((t.clientY - lastY) * DRAG_RESISTANCE / dt);
  }
  lastX = t.clientX; lastY = t.clientY; lastT = now;
}, { passive: true });

window.addEventListener('touchend', () => {
  if (!dragging) return;
  dragging = false;
  cancelDragLoop();
  wrap.classList.remove('dragging');
  startMomentum();
});

/* ═══════════════════════════════════════════
   PHOTO LAYER — separate array, same tile size
   so wrapping is perfectly in sync with cards
   ═══════════════════════════════════════════ */

const PHOTO_CONFIG = [
  { src: "photo1.jpg", caption: "01 / studio",   w: 260, offsetX: 550,  offsetY: 450,  rot: -2   },
  { src: "photo2.jpg", caption: "02 / street",   w: 220, offsetX: -550, offsetY: 300,  rot: 1.5  },
  { src: "photo3.jpg", caption: "03 / portrait", w: 300, offsetX: 600,  offsetY: -450, rot: -1   },
  { src: "photo4.jpg", caption: "04 / detail",   w: 200, offsetX: -600, offsetY: -500, rot: 2    },
  { src: "photo5.jpg", caption: "05 / wide",     w: 320, offsetX: 0,    offsetY: 600,  rot: -1.5 },
];

// uses exact same tile size as profile cards — this is what stops the jump/flicker
const PHOTO_TILE_W = TILE_W;
const PHOTO_TILE_H = TILE_H;

const photoCards = []; // own array, own wrap calc — never mixed with cards[]

function makePhotoCard(photo) {
  const card = document.createElement('div');
  card.className = 'photo-card';
  card.style.width = photo.w + 'px';
  card.style.transform = `rotate(${photo.rot}deg)`;
  card.innerHTML = `
    <img src="${photo.src}" alt="${photo.caption}" decoding="async">
    <div class="photo-caption">${photo.caption}</div>
  `;
  return card;
}

PHOTO_CONFIG.forEach(photo => {
  for (let row = -3; row < ROWS; row++) {
    for (let col = -3; col < COLS; col++) {
      const card = makePhotoCard(photo);
      const bx = col * PHOTO_TILE_W + (W / 2 - photo.w / 2) + photo.offsetX;
      const by = row * PHOTO_TILE_H + (H / 2 - photo.w / 2) + photo.offsetY;
      placeCard(card, bx, by);
      canvas.appendChild(card);
      photoCards.push(card);
    }
  }
});

function updatePhotoCards() {
  const ox = ((offsetX % PHOTO_TILE_W) + PHOTO_TILE_W) % PHOTO_TILE_W;
  const oy = ((offsetY % PHOTO_TILE_H) + PHOTO_TILE_H) % PHOTO_TILE_H;
  photoCards.forEach(card => {
    const x = parseFloat(card.dataset.baseX) + ox;
    const y = parseFloat(card.dataset.baseY) + oy;
    card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${card.dataset.rot || 0}deg)`;
  });
}