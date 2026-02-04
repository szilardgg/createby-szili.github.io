const promptEl = document.getElementById('prompt');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const buttonsWrap = document.getElementById('buttons');
const confetti = document.getElementById('confetti');
const overlay = document.getElementById('overlay');
const meterFill = document.getElementById('meterFill');
const percentEl = document.getElementById('percent');
const heartsCanvas = document.getElementById('heartsCanvas');
const hctx = heartsCanvas ? heartsCanvas.getContext('2d') : null;
const loveTextCanvas = document.getElementById('loveTextCanvas');
const ltctx = loveTextCanvas ? loveTextCanvas.getContext('2d') : null;

// ===== Background music (YouTube) =====
let ytPlayer = null;
let userInteracted = false;
const YT_VIDEO_ID = 'tyKu0uZS86Q';
const QUIET_VOLUME = 8; // 0..100

// YouTube API global hook
window.onYouTubeIframeAPIReady = function() {
  const el = document.getElementById('yt-player');
  if (!el) return;
  ytPlayer = new YT.Player('yt-player', {
    videoId: YT_VIDEO_ID,
    playerVars: {
      autoplay: 1,
      controls: 0,
      loop: 1,
      playlist: YT_VIDEO_ID,
      modestbranding: 1,
      rel: 0,
      fs: 0,
      disablekb: 1,
      playsinline: 1,
    },
    events: {
      onReady: (e) => {
        try {
          e.target.mute();
          e.target.setVolume(QUIET_VOLUME);
          e.target.playVideo();
        } catch {}
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          try { e.target.playVideo(); } catch {}
        }
      }
    }
  });
};

function enableQuietMusic() {
  if (!ytPlayer) return;
  try {
    ytPlayer.setVolume(QUIET_VOLUME);
    ytPlayer.unMute();
    ytPlayer.playVideo();
  } catch {}
}

function setupMusicInteractionUnlock() {
  if (userInteracted) return;
  const unlock = () => {
    userInteracted = true;
    enableQuietMusic();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

// Motion preference and performance helpers
let prefersReducedMotion = false;
try {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion = !!mql.matches;
  mql.addEventListener?.('change', (e) => prefersReducedMotion = !!e.matches);
} catch {}

let overlayActive = false;
let HEART_SHADOW = 6;
const PERF = { lastTs: 0, emaFps: 60, low: false };
function updatePerf(ts) {
  if (!PERF.lastTs) { PERF.lastTs = ts; return; }
  const dt = (ts - PERF.lastTs) / 1000;
  PERF.lastTs = ts;
  const fps = 1 / Math.max(0.0001, dt);
  PERF.emaFps = PERF.emaFps * 0.9 + fps * 0.1;
  PERF.low = PERF.emaFps < 48;
}

let attempts = 0;
let yesScale = 1;

const teaseTexts = [
  'Biztos? Gondold át még egyszer… 🥺',
  'Tudod, a csoki már megvan… 🍫',
  'Rózsák, gyertyák, mi ketten… 🌹',
  'A „Nem” gomb félős ám! 😳',
  'Utolsó esély, mielőtt beleszeretek még jobban… 💞',
];

function randomBetween(min, max) { return Math.random() * (max - min) + min; }

function moveNoButton() {
  const wrapRect = buttonsWrap.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();

  const pad = 8;
  const maxLeft = wrapRect.width - btnRect.width - pad;
  const maxTop  = wrapRect.height - btnRect.height - pad;
  const left = Math.max(pad, Math.min(maxLeft, randomBetween(pad, maxLeft)));
  const top  = Math.max(pad, Math.min(maxTop,  randomBetween(pad, maxTop)));

  noBtn.style.left = `${left}px`;
  noBtn.style.top  = `${top}px`;
}

function growYesButton() {
  yesScale = Math.min(3.6, yesScale + 0.18);
  yesBtn.style.setProperty('--yes-scale', yesScale.toFixed(2));
}

function updatePrompt() {
  const text = teaseTexts[Math.min(attempts, teaseTexts.length - 1)];
  promptEl.textContent = text;
}

function spawnHearts(x, y, count = 24) {
  const colors = ['#ff5c8a', '#ff7aa2', '#ff9bbb', '#ff3f7f'];
  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    h.className = 'heart';
    h.style.left = `${x + randomBetween(-30, 30)}px`;
    h.style.top  = `${y + randomBetween(-10, 10)}px`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    h.style.background = color;
    h.style.animationDuration = `${randomBetween(0.9, 1.6)}s`;
    confetti.appendChild(h);
    setTimeout(() => h.remove(), 1600);
  }
}

function sayYesCelebration() {
  promptEl.textContent = 'Tudtam! Te vagy a legjobb döntésem ❤️';
  const noteEl = document.getElementById('note');
  if (noteEl) noteEl.textContent = 'Találka: te + én + csillagfény ✨';
  noBtn.style.opacity = '0';
  noBtn.style.pointerEvents = 'none';
  yesBtn.disabled = true;
  yesBtn.style.pointerEvents = 'none';
  yesScale = 2.2;
  yesBtn.style.setProperty('--yes-scale', yesScale);

  // Show overlay with only the floating pictures (no extra effects)
  showOverlayCelebration();
}

// Interactions
noBtn.addEventListener('mouseenter', () => {
  attempts++;
  moveNoButton();
  growYesButton();
  updatePrompt();
});

noBtn.addEventListener('touchstart', (e) => {
  attempts++;
  moveNoButton();
  growYesButton();
  updatePrompt();
  e.preventDefault();
});

noBtn.addEventListener('click', (e) => {
  attempts++;
  moveNoButton();
  growYesButton();
  updatePrompt();
  e.preventDefault();
});

yesBtn.addEventListener('click', () => {
  enableQuietMusic();
  sayYesCelebration();
});

// Initial layout tweak so the No button starts near center
window.addEventListener('load', () => {
  moveNoButton();
  // Background animations disabled by request
  // if (hctx) initHeartsBackground();
  // if (ltctx) initLoveTextCanvas();
  initBackgroundWords();
  setupMusicInteractionUnlock();
  startIntroSequence();
});

// Build a static grid of 'Szeretlek' words in the background (no animation)
function initBackgroundWords() {
  const cont = document.querySelector('.bg-words');
  if (!cont) return;
  cont.innerHTML = '';
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const stepX = vw < 480 ? 160 : 130; // horizontal spacing (looser on very small screens)
  const stepY = vw < 480 ? 80  : 60;  // vertical spacing
  const rows = Math.ceil(vh / stepY) + 1;
  const cols = Math.ceil(vw / stepX) + 2;
  for (let r = 0; r < rows; r++) {
    const y = r * stepY + 24;
    const offset = (r % 2) ? stepX / 2 : 0;
    for (let c = 0; c < cols; c++) {
      const x = c * stepX + offset + 16;
      const s = document.createElement('span');
      s.textContent = 'Szeretlek';
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      cont.appendChild(s);
    }
  }
}

window.addEventListener('resize', () => {
  // Reflow background words on resize
  initBackgroundWords();
});

// Celebration overlay logic
function showOverlayCelebration() {
  overlayActive = true;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('hide-card');
  startFloatingPics();
}

function startLoveMeter(targetPercent = 100, durationMs = 1500) {
  targetPercent = Math.max(0, Math.min(1000, targetPercent));
  const start = performance.now();
  const startWidth = 0;
  let lastShownBucket = -1;
  function tick(now) {
    updatePerf(now);
    const p = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - p, 2.2); // easeOutQuad-ish
    const val = Math.floor(startWidth + (targetPercent - startWidth) * eased);
    const bar = Math.min(100, val);
    meterFill.style.width = bar + '%';
    percentEl.textContent = val + '%';

    // Pop the counter on each +10%
    const bucket = Math.floor(val / 10);
    if (bucket !== lastShownBucket) {
      lastShownBucket = bucket;
      percentEl.classList.add('pop');
      setTimeout(() => percentEl.classList.remove('pop'), 260);
    }

    // Fire extra hearts at 100, 200, 300
    if (val === 100 || val === 200 || val === 300) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      spawnHearts(centerX, centerY, PERF.low || prefersReducedMotion ? 36 : 64);
    }
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function createFallingHeart() {
  const h = document.createElement('div');
  h.className = 'fall-heart';
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const left = Math.random() * vw;
  const size = randomBetween(10, 18);
  const dx = randomBetween(-120, 120);
  const dur = randomBetween(3.5, 6.5);
  const colorChoices = ['#ff3f7f', '#ff5c8a', '#ff7aa2', '#ff9bbb'];
  h.style.left = `${left}px`;
  h.style.width = `${size}px`;
  h.style.height = `${size}px`;
  h.style.background = colorChoices[Math.floor(Math.random() * colorChoices.length)];
  h.style.setProperty('--dx', `${dx}px`);
  h.style.setProperty('--s', `${randomBetween(0.9, 1.4)}`);
  h.style.animation = `fall ${dur}s linear forwards`;
  document.body.appendChild(h);
  setTimeout(() => h.remove(), dur * 1000 + 100);
}

function startHeartRain(durationMs = 5000) {
  const interval = setInterval(() => {
    for (let i = 0; i < 6; i++) createFallingHeart();
  }, 120);
  setTimeout(() => clearInterval(interval), durationMs);
}

// Additional continuous heart spray across the screen (DOM hearts)
let heartSprayInterval;
function startGlobalHeartSpray(durationMs = 6000, batch = 12, everyMs = 260) {
  if (prefersReducedMotion || heartSprayInterval) return;
  const start = performance.now();
  heartSprayInterval = setInterval(() => {
    const now = performance.now();
    if (now - start > durationMs) { clearInterval(heartSprayInterval); heartSprayInterval = null; return; }
    const amount = PERF.low ? Math.max(6, Math.floor(batch * 0.6)) : batch;
    const centerX = randomBetween(0.15, 0.85) * window.innerWidth;
    const centerY = randomBetween(0.25, 0.75) * window.innerHeight;
    spawnHearts(centerX, centerY, amount);
  }, everyMs);
}

// ==== Animated hearts background (canvas) ====
let HEARTS = [];
let lastTs = 0;
let dpr = 1;
const mouse = { x: 0, y: 0, active: false };

// Track pointer for proximity pulsing
window.addEventListener('pointermove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
});
window.addEventListener('pointerleave', () => { mouse.active = false; });
window.addEventListener('blur', () => { mouse.active = false; });

function initHeartsBackground() {
  dpr = Math.max(1, Math.min(1.25, window.devicePixelRatio || 1));
  resizeCanvas();
  spawnHeartsBackground();
  lastTs = performance.now();
  requestAnimationFrame(animateHearts);
  window.addEventListener('resize', () => {
    resizeCanvas();
    spawnHeartsBackground();
  });
}

function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  heartsCanvas.width = Math.floor(w * dpr);
  heartsCanvas.height = Math.floor(h * dpr);
  heartsCanvas.style.width = w + 'px';
  heartsCanvas.style.height = h + 'px';
  hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnHeartsBackground() {
  const area = window.innerWidth * window.innerHeight;
  let target = Math.max(100, Math.min(300, Math.floor(area / 14000)));
  if (prefersReducedMotion) target = Math.floor(target * 0.5);
  if (PERF.low) target = Math.floor(target * 0.7);
  const count = target;
  HEARTS = [];
  for (let i = 0; i < count; i++) {
    HEARTS.push(makeHeart());
  }
}

function makeHeart() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const depth = Math.random(); // 0..1: parallax depth
  const size = 8 + depth * 18; // px
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: randomBetween(-0.15, 0.15),
    vy: randomBetween(-0.15, 0.15),
    angle: Math.random() * Math.PI * 2,
    av: randomBetween(0.2, 0.7) * (Math.random() < 0.5 ? -1 : 1) * 0.3,
    // red tone; vary lightness a bit with depth
    light: 55 + depth * 15,
    size,
    depth,
    alpha: 0.35 + depth * 0.5,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseAmp: 0,
  };
}

function animateHearts(ts) {
  updatePerf(ts);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016); // s
  lastTs = ts;

  // Faint, slow-changing tint behind for extra richness
  const tintHue = 350 + Math.sin(ts / 1800) * 10; // subtle pinkish drift
  hctx.clearRect(0, 0, w, h);
  hctx.fillStyle = `hsla(${tintHue}, 80%, 97%, 0.25)`;
  hctx.fillRect(0, 0, w, h);

  HEART_SHADOW = (PERF.low || overlayActive) ? 2 : 6;

  for (let i = 0; i < HEARTS.length; i++) {
    const p = HEARTS[i];
    // Global flow field + gentle personal swirl
    const t = ts * 0.0012;
    const flow = flowVel(p.x, p.y, t, p.depth);
    const flowScale = (PERF.low || overlayActive) ? 0.6 : 1;
    p.vx += flow.vx * dt * flowScale;
    p.vy += flow.vy * dt * flowScale;
    p.angle += p.av * dt;
    p.vx += Math.cos(p.angle) * (0.008 + p.depth * 0.02);
    p.vy += Math.sin(p.angle) * (0.008 + p.depth * 0.02);
    // Tiny random
    if (!PERF.low) {
      p.vx += randomBetween(-0.003, 0.003);
      p.vy += randomBetween(-0.003, 0.003);
    }
    // Damping
    p.vx *= 0.993; p.vy *= 0.993;
    // Move
    p.x += p.vx;
    p.y += p.vy;
    // Wrap
    if (p.x < -30) p.x = w + 30; else if (p.x > w + 30) p.x = -30;
    if (p.y < -30) p.y = h + 30; else if (p.y > h + 30) p.y = -30;
    
    // Proximity heartbeat: hearts near cursor pulse
    let targetAmp = 0;
    const radius = 140;
    if (mouse.active) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d = Math.hypot(dx, dy);
      if (d < radius) {
        // closer -> stronger pulse
        const t = 1 - (d / radius); // 0..1
        targetAmp = 0.25 + t * 0.55; // up to ~0.8 near cursor
      }
    }
    // Smooth approach/decay of pulse amplitude
    p.pulseAmp += (targetAmp - p.pulseAmp) * (targetAmp > p.pulseAmp ? 0.15 : 0.08);
    p.pulsePhase += dt * (6 + p.depth * 4); // beat speed

    const scale = 1 + Math.max(0, p.pulseAmp) * (0.5 + 0.5 * Math.sin(p.pulsePhase * Math.PI * 2));

    const color = `hsla(0, 85%, ${p.light}%, ${p.alpha})`;
    drawHeart(hctx, p.x, p.y, p.size * scale, color, p.angle * 0.6);
  }

  requestAnimationFrame(animateHearts);
}

// Coherent flow field for global swirling motion
function flowVel(x, y, t, depth) {
  const f1 = 0.0014, f2 = 0.0011;
  const a = Math.sin(x * f1 + t * 0.8) + Math.cos(y * f1 - t * 1.1);
  const b = Math.cos(x * f2 - t * 0.6) - Math.sin(y * f2 + t * 0.9);
  const ang = Math.atan2(b, a);
  const base = 18 + depth * 24; // px/s approx
  return { vx: Math.cos(ang) * base, vy: Math.sin(ang) * base };
}

function drawHeart(ctx, x, y, s, color, rot = 0) {
  // Draw a smooth heart with cubic beziers
  const k = s / 2; // size scale
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -0.3 * s);
  ctx.bezierCurveTo(0, -s, -s, -s, -s, -0.2 * s);
  ctx.bezierCurveTo(-s, 0.4 * s, -0.4 * s, 0.7 * s, 0, s);
  ctx.bezierCurveTo(0.4 * s, 0.7 * s, s, 0.4 * s, s, -0.2 * s);
  ctx.bezierCurveTo(s, -s, 0, -s, 0, -0.3 * s);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(255, 92, 138, 0.25)';
  ctx.shadowBlur = HEART_SHADOW;
  ctx.fill();
  ctx.restore();
}

// ===== Love Text Storm (canvas) =====
let LT = { dpr: 1, words: [], last: 0, target: 0, running: false };
function initLoveTextCanvas() {
  LT.dpr = Math.max(1, Math.min(1.25, window.devicePixelRatio || 1));
  resizeLoveTextCanvas();
  window.addEventListener('resize', resizeLoveTextCanvas);
}

function resizeLoveTextCanvas() {
  if (!loveTextCanvas) return;
  const w = overlay.clientWidth || window.innerWidth;
  const h = overlay.clientHeight || window.innerHeight;
  loveTextCanvas.width = Math.floor(w * LT.dpr);
  loveTextCanvas.height = Math.floor(h * LT.dpr);
  loveTextCanvas.style.width = w + 'px';
  loveTextCanvas.style.height = h + 'px';
  ltctx.setTransform(LT.dpr, 0, 0, LT.dpr, 0, 0);
}

function startLoveTextStorm() {
  if (!ltctx || LT.running) return;
  LT.running = true;
  LT.words = [];
  // Set target density by screen area
  const area = (overlay.clientWidth || window.innerWidth) * (overlay.clientHeight || window.innerHeight);
  let target = Math.max(80, Math.min(360, Math.floor(area / 9000)));
  if (prefersReducedMotion) target = Math.floor(target * 0.5);
  LT.target = target;
  LT.last = performance.now();
  requestAnimationFrame(animateLoveText);
}

// ===== Intro sequence (page entry) =====
const introOverlay = document.getElementById('introOverlay');
const introText = document.getElementById('introText');

const INTRO_SLIDES = [
  'Tudom, tudom… néha nehéz voltam. <br><span class="soft">Köszönöm, hogy mégis itt vagy.</span>',
  'Sajnálom, hogy megbántottalak. Őszintén kérek <strong class="hl">bocsánatot</strong> mindenért. Nélküled minden hiányos, és szeretném jóvátenni, amit lehet.',
  '<span class="soft">És most elmondom neked…</span> <br><strong class="hl">Annyira szeretlek</strong> — imádom a csillogó szemeidet, ahogy egyetlen pillantásod fényt gyújt bennem. A mosolyod melege az otthonom, a nevetésed a kedvenc dalom. Csodálom a türelmed, az erődet, a kedvességed minden apró rezdülését. Ahogy figyelsz, ahogy bátorítasz, ahogy szeretsz — mindenben ott vagy nekem. Közeleg a <span class="hl">szerelmesek napja</span>. <br>'
];

let introIndex = 0;
let introTyping = false;
let introTimer = null;
let holdActive = false;
let holdStart = 0;
const HOLD_TIME_MS = 1800;
const holdNextBtn = document.getElementById('holdNext');
const holdFillEl = document.getElementById('holdFill');
const holdHintEl = document.getElementById('holdHint');

function setIntroHTML(html) {
  if (!introText) return;
  introText.classList.remove('show');
  introText.innerHTML = '';
  const wrapper = document.createElement('span');
  wrapper.innerHTML = html;
  introText.appendChild(wrapper);
  introText.classList.add('show');

  if (prefersReducedMotion) return; // skip typing animation

  wrapper.style.display = 'inline-block';
  wrapper.style.whiteSpace = 'pre-wrap';
  wrapper.style.clipPath = 'inset(0 100% 0 0)';
  // Faster reveal: lower base and per-character time
  const duration = 800 + Math.min(2400, wrapper.textContent.length * 20);
  const start = performance.now();
  introTyping = true;
  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2;
    wrapper.style.clipPath = `inset(0 ${Math.floor((1-eased)*100)}% 0 0)`;
    if (p < 1 && introTyping) requestAnimationFrame(step);
    else introTyping = false;
  }
  requestAnimationFrame(step);
}

function showIntroSlide(i) {
  if (!introOverlay) return;
  introIndex = i;
  setIntroHTML(INTRO_SLIDES[i]);
  clearTimeout(introTimer);
  const isLast = i === INTRO_SLIDES.length - 1;
  // No auto-advance; use press-and-hold button instead
  if (holdHintEl) holdHintEl.style.display = i === 0 ? 'block' : 'none';
}

function nextIntro() {
  if (introTyping) { introTyping = false; }
  if (introIndex < INTRO_SLIDES.length - 1) {
    showIntroSlide(introIndex + 1);
    if (introIndex === INTRO_SLIDES.length - 1) {
      // just switched to last slide
      playComplimentChime();
    }
  } else {
    finishIntro();
  }
}

function skipIntro() { finishIntro(); }

function finishIntro() {
  if (!introOverlay) return;
  introOverlay.classList.add('hidden');
  clearTimeout(introTimer);
  const card = document.querySelector('.card');
  if (card) card.classList.add('reveal');
  document.body.classList.remove('hide-card');
}

function startIntroSequence() {
  if (!introOverlay || !introText) return;
  introOverlay.classList.remove('hidden');
  document.body.classList.add('hide-card');
  showIntroSlide(0);
}

// Allow click to finish only on the last slide (no skipping earlier)
// Replace click-to-finish with press-and-hold to advance
function resetHold() {
  holdActive = false;
  holdStart = 0;
  if (holdFillEl) holdFillEl.style.width = '0%';
}

function holdTick(ts) {
  if (!holdActive) return;
  const elapsed = ts - holdStart;
  const p = Math.max(0, Math.min(1, elapsed / HOLD_TIME_MS));
  if (holdFillEl) holdFillEl.style.width = (p * 100).toFixed(1) + '%';
  if (p >= 1) {
    resetHold();
    nextIntro();
  } else {
    requestAnimationFrame(holdTick);
  }
}

function beginHold() {
  holdActive = true;
  holdStart = performance.now();
  requestAnimationFrame(holdTick);
}

function endHold() { resetHold(); }

if (holdNextBtn) {
  holdNextBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); beginHold(); });
  window.addEventListener('pointerup', endHold);
  window.addEventListener('pointercancel', endHold);
  window.addEventListener('pointerleave', endHold);
}

// Gentle chime on the final slide
function playComplimentChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = now + i * 0.18;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.12, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
      o.start(t0);
      o.stop(t0 + 0.65);
    });
  } catch {}
}

function spawnLoveWord() {
  const w = overlay.clientWidth || window.innerWidth;
  const h = overlay.clientHeight || window.innerHeight;
  const depth = Math.random();
  const size = 16 + depth * 40; // font px
  const speed = 12 + depth * 36;
  const ang = Math.random() * Math.PI * 2;
  const life = 3500 + Math.random() * 4500;
  const hue = 350 + Math.random() * 20;
  LT.words.push({
    text: 'Szeretlek',
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    rot: randomBetween(-0.2, 0.2),
    size,
    alpha: 0,
    born: performance.now(),
    life,
    hue,
  });
}

function animateLoveText(ts) {
  if (!LT.running) return;
  const w = overlay.clientWidth || window.innerWidth;
  const h = overlay.clientHeight || window.innerHeight;

  ltctx.clearRect(0, 0, w, h);

  // Spawn towards target density
  const deficit = LT.target - LT.words.length;
  if (deficit > 0) {
    const toAdd = Math.min(deficit, Math.ceil(deficit * 0.25) + 4);
    for (let i = 0; i < toAdd; i++) spawnLoveWord();
  } else if (deficit < -40) {
    LT.words.splice(0, Math.min(LT.words.length, 20));
  }

  const now = ts;
  for (let i = LT.words.length - 1; i >= 0; i--) {
    const wv = LT.words[i];
    const age = now - wv.born;
    const t = Math.min(1, age / wv.life);
    const fadeIn = Math.min(1, age / 600);
    const fadeOut = Math.max(0, 1 - Math.max(0, age - (wv.life - 800)) / 800);
    wv.alpha = Math.max(0, Math.min(1, fadeIn * fadeOut));

    // Motion
    const speedScale = PERF.low ? 0.7 : 1;
    wv.x += wv.vx * 0.016 * speedScale;
    wv.y += wv.vy * 0.016 * speedScale;

    // Wrap
    if (wv.x < -200) wv.x = w + 200; else if (wv.x > w + 200) wv.x = -200;
    if (wv.y < -100) wv.y = h + 100; else if (wv.y > h + 100) wv.y = -100;

    // Draw
    ltctx.save();
    ltctx.translate(wv.x, wv.y);
    ltctx.rotate(wv.rot);
    ltctx.font = `700 ${wv.size}px Poppins, system-ui, sans-serif`;
    ltctx.fillStyle = `hsla(${wv.hue}, 80%, 55%, ${wv.alpha * 0.9})`;
    ltctx.shadowColor = 'rgba(255, 92, 138, 0.28)';
    ltctx.shadowBlur = PERF.low ? 3 : 8;
    ltctx.textAlign = 'center';
    ltctx.textBaseline = 'middle';
    ltctx.fillText(wv.text, 0, 0);
    ltctx.restore();

    if (age > wv.life) LT.words.splice(i, 1);
  }

  requestAnimationFrame(animateLoveText);
}

// ===== Floating 5 pictures after YES =====
const PIC_SOURCES = [
  'img/1.png',
  'img/2.png',
  'img/3.png',
  'img/4.png',
  'img/5.png',
];

function startFloatingPics() {
  const wrap = document.getElementById('floatPics');
  if (!wrap) return;
  wrap.innerHTML = '';
  const W = window.innerWidth;
  const H = window.innerHeight;
  const rng = () => Math.random();
  const isMobile = W <= 768;

  // Positions: center cluster on mobile, edge-perimeter on larger screens
  let positions;
  if (isMobile) {
    // Spread out across the screen on mobile (corners + top-center)
    positions = [
      { x: 0.18 * W, y: 0.18 * H }, // top-left
      { x: 0.82 * W, y: 0.22 * H }, // top-right
      { x: 0.85 * W, y: 0.82 * H }, // bottom-right
      { x: 0.20 * W, y: 0.85 * H }, // bottom-left
      { x: 0.50 * W, y: 0.12 * H }, // top-center
    ];
  } else {
    positions = [
      { x: 0.18 * W, y: 0.12 * H },
      { x: 0.82 * W, y: 0.22 * H },
      { x: 0.88 * W, y: 0.72 * H },
      { x: 0.22 * W, y: 0.86 * H },
      { x: 0.10 * W, y: 0.48 * H },
    ];
  }

  for (let i = 0; i < 5; i++) {
    const el = document.createElement(PIC_SOURCES[i] ? 'img' : 'div');
    if (PIC_SOURCES[i]) el.src = PIC_SOURCES[i];
    if (!PIC_SOURCES[i]) { el.className = 'float-pic fallback'; el.textContent = '❤️'; }
    else el.className = 'float-pic';

    const p = positions[i % positions.length];
    // small jitter to avoid perfect layout feel (none on mobile)
    const jitterX = isMobile ? 0 : (rng() * 0.04 - 0.02) * W;
    const jitterY = isMobile ? 0 : (rng() * 0.04 - 0.02) * H;
    const margin = Math.max(16, Math.min(W, H) * (isMobile ? 0.10 : 0.06));
    const bx = Math.max(margin, Math.min(W - margin, p.x + jitterX));
    const by = Math.max(margin, Math.min(H - margin, p.y + jitterY));

    const rot = Math.floor(rng() * 12 - 6);
    const dur = 6 + Math.floor(rng() * 4);
    const dx = Math.floor((isMobile ? 3 : 4) + rng() * (isMobile ? 6 : 10));
    const dy = Math.floor((isMobile ? 3 : 4) + rng() * (isMobile ? 6 : 10));

    el.style.setProperty('--bx', `${bx}px`);
    el.style.setProperty('--by', `${by}px`);
    el.style.setProperty('--rot', `${rot}deg`);
    el.style.setProperty('--dur', `${dur}s`);
    el.style.setProperty('--dx', `${dx}px`);
    el.style.setProperty('--dy', `${dy}px`);

    wrap.appendChild(el);
  }
}
