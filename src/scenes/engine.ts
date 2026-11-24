/**
 * Shared 3D engine (§11.1): ONE WebGLRenderer on ONE fixed full-viewport canvas.
 * Each `.stage[data-scene]` in the DOM is rendered into its own rectangle with scissor/viewport.
 * Scenes are lazy-imported when their stage comes within ~50% of a viewport, render only while
 * visible, and are disposed on page hide. Tier logic per §11.2.
 */
import * as THREE from 'three';
import type { Tier } from '../scripts/core.ts';
import { disposeTree, setTime, setSurface } from './kit.ts';

export interface FrameState {
  time: number;
  dt: number;
  /** 0 → 1 as the stage scrolls through the viewport (scrubbed by ScrollTrigger when available). */
  progress: number;
  pointer: { x: number; y: number; inside: boolean };
  width: number;
  height: number;
  aspect: number;
}

export interface SceneInstance {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update(state: FrameState): void;
  resize?(aspect: number, width: number, height: number): void;
  /** Hotspots: return the href of the mirrored HTML link under the pointer (or null). */
  pick?(ndc: THREE.Vector2): string | null;
  dispose?(): void;
}

export interface SceneContext {
  tier: Tier;
  stage: HTMLElement;
  params: Record<string, string | number | boolean>;
  /** Poster rendering: frozen time, no entrance animation. */
  still: boolean;
  /** Halves counts on the Lite tier. */
  count(n: number): number;
  renderer: THREE.WebGLRenderer;
}

export type SceneFactory = (ctx: SceneContext) => SceneInstance | Promise<SceneInstance>;

const defs = import.meta.glob<{ default: SceneFactory }>('./defs/*.ts');

interface StageRec {
  el: HTMLElement & { __p?: number; __fade?: number };
  name: string;
  state: 'idle' | 'loading' | 'live' | 'failed';
  instance?: SceneInstance;
  near: boolean;
  aspect: number;
  shown: boolean;
  hoverHref: string | null;
}

let renderer: THREE.WebGLRenderer | undefined;
let canvas: HTMLCanvasElement;
let tier: Tier = 1;
let raf = 0;
let running = false;
let lastT = 0;
let lastRender = 0;
let lastActivity = 0;
let drewLast = false;
let io: IntersectionObserver | undefined;
let ro: ResizeObserver | undefined;
const stages: StageRec[] = [];
const byEl = new Map<Element, StageRec>();
const pointer = { x: -1e5, y: -1e5 };
const query = new URLSearchParams(location.search);
const still = query.has('poster');
/** ?tier=N pins the tier for testing and switches the frame-time watchdog off. */
const pinned = query.has('tier') || still;
const stillTime = 3.2;

/* Frame-time watchdog (D79, D81). It decides once per tier whether this device can keep up with the 3D.
   The owner's rule is that the hero must stay alive on a capable computer, so the verdict is built to be
   hard to reach by accident:
     - only frames drawn AT REST count (no scroll or pointer movement in the last 400ms): scrolling makes
       every page busy, and that says nothing about whether the 3D itself is affordable;
     - the first 1.5s after drawing starts, or restarts, or a new scene goes live, is ignored (shaders
       compiling, textures uploading), and single long frames are ignored;
     - the verdict is the MEDIAN of 90 such frames, not an average;
     - full tier drops to lite above 26ms a frame; lite, which idles at 30fps on purpose, drops to the
       static images only above 55ms (under 18fps): a last resort for a device that truly cannot draw it.
   Earlier rules sent capable computers to the static hero: first an average over the first two seconds,
   then a window that could fill with frames from the moment a later scene was loading mid-scroll. */
const WATCH_WARMUP = 1500;
const WATCH_SAMPLES = 90;
let watchStart = 0;
let watchTimes: number[] = [];
let watchDone = pinned;

/* Per-stage fade (D81): a section that fades on scroll sets `stage.__fade` (0 to 1). After the scene is
   drawn, its rectangle is multiplied by that value, so the 3D fades in the same frame it is drawn in. */
/* Layering (D86). The canvas normally sits between a section's ground and its content. A stage marked
   data-layer="front" (the home hero's portrait) asks to be drawn in FRONT of the content; the canvas is
   shared, so it is only lifted (data-front, read by CSS) while every stage being drawn asks for it. */
let isFront = false;

let fadeScene: THREE.Scene | undefined;
let fadeCamera: THREE.OrthographicCamera | undefined;
let fadeMaterial: THREE.MeshBasicMaterial | undefined;
function drawFade(alpha: number) {
  if (!renderer) return;
  if (!fadeScene) {
    fadeScene = new THREE.Scene();
    fadeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    fadeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.SrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.SrcAlphaFactor,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMaterial);
    quad.frustumCulled = false;
    fadeScene.add(quad);
  }
  fadeMaterial!.opacity = alpha;
  renderer.render(fadeScene, fadeCamera!);
}

/** Pixel ratio for the canvas: capped per tier, and by a pixel budget so a large window on a high-density
    screen does not ask for nine million pixels a frame (5.2MP on the full tier, 3MP on lite). */
function maxDpr() {
  const cap = tier === 2 ? 2 : 1.5;
  const budget = tier === 2 ? 5.2e6 : 3e6;
  const area = Math.max(1, (canvas?.clientWidth ?? 1) * (canvas?.clientHeight ?? 1));
  return Math.max(1, Math.min(window.devicePixelRatio || 1, cap, Math.sqrt(budget / area)));
}

/* Resize the drawing buffer only when its size or pixel ratio really changed (D89). Setting a canvas's
   width or height, even to the same number, wipes it and reallocates it; phones send a stream of resize
   events while the address bar slides in and out during a scroll, and each one blanked the 3D for a frame. */
let sizedW = 0;
let sizedH = 0;
let sizedPr = 0;
function sizeRenderer(force = false) {
  if (!renderer) return;
  const pr = still ? window.devicePixelRatio : maxDpr();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!force && w === sizedW && h === sizedH && Math.abs(pr - sizedPr) < 0.01) return;
  sizedW = w;
  sizedH = h;
  sizedPr = pr;
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
}

async function load(rec: StageRec) {
  if (rec.state !== 'idle' || !renderer) return;
  const loader = defs[`./defs/${rec.name}.ts`];
  if (!loader) {
    rec.state = 'failed';
    return;
  }
  rec.state = 'loading';
  try {
    const mod = await loader();
    let params: Record<string, string | number | boolean> = {};
    try {
      params = JSON.parse(rec.el.dataset.params || '{}');
    } catch {
      params = {};
    }
    setSurface(!rec.el.closest('.on-night'));
    const instance = await mod.default({
      tier,
      stage: rec.el,
      params,
      still,
      count: (n) => (tier === 2 ? n : Math.max(1, Math.ceil(n / 2))),
      renderer,
    });
    if (!renderer) {
      instance.dispose?.();
      disposeTree(instance.scene);
      return;
    }
    rec.instance = instance;
    rec.state = 'live';
    rec.aspect = 0;
    watchStart = 0; // a scene going live is a busy moment: the watchdog starts its warm-up again
    watchTimes = [];
  } catch (err) {
    rec.state = 'failed';
    console.warn(`[3d] scene "${rec.name}" failed`, err);
  }
}

function frame(now: number) {
  if (!running || !renderer) return;
  raf = requestAnimationFrame(frame);
  const t = now / 1000;
  // Lite tier: ambient motion at 30fps; full rate while the page is scrolling or the pointer moves.
  if (tier === 1 && !still && now - lastActivity > 250 && now - lastRender < 31) return;
  const dt = Math.min(t - lastT || 0.016, 0.1);
  const frameMs = lastRender ? now - lastRender : 0;
  lastT = t;
  lastRender = now;

  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  let drew = false;
  let allFront = true;

  for (const rec of stages) {
    if (rec.state !== 'live' || !rec.instance) continue;
    const r = rec.el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) continue;
    // a section that has faded out on scroll (home page, D78) keeps its box: nothing to draw
    const fade = rec.el.__fade ?? 1;
    if (fade < 0.01) continue;

    if (!drew) {
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);
      drew = true;
    }
    if (rec.el.dataset.layer !== 'front') allFront = false;
    const inst = rec.instance;
    const aspect = r.width / r.height;
    if (Math.abs(aspect - rec.aspect) > 0.002) {
      rec.aspect = aspect;
      inst.camera.aspect = aspect;
      inst.resize?.(aspect, r.width, r.height);
      inst.camera.updateProjectionMatrix();
    }
    const inside = pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
    const raw = (H - r.top) / (H + r.height);
    const time = still ? stillTime : t;
    inst.update({
      time,
      dt: still ? 0.016 : dt,
      progress: still ? Number(rec.el.dataset.posterProgress ?? 0.35) : Math.min(1, Math.max(0, rec.el.__p ?? raw)),
      pointer: {
        x: Math.max(-1, Math.min(1, ((pointer.x - r.left) / r.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, -(((pointer.y - r.top) / r.height) * 2 - 1))),
        inside,
      },
      width: r.width,
      height: r.height,
      aspect,
    });
    setTime(inst.scene, time);
    const y = H - r.bottom;
    renderer.setViewport(r.left, y, r.width, r.height);
    renderer.setScissor(r.left, y, r.width, r.height);
    renderer.render(inst.scene, inst.camera);
    if (fade < 0.999) drawFade(fade);

    if (!rec.shown) {
      rec.shown = true;
      rec.el.classList.add('is-live'); // poster crossfades out; the box does not change size
      rec.el.dataset.ready = '1';
    }
  }

  if (!drew && drewLast) {
    renderer.setScissorTest(false);
    renderer.clear();
  }
  drewLast = drew;
  if ((drew && allFront) !== isFront) {
    isFront = drew && allFront;
    canvas.toggleAttribute('data-front', isFront);
  }

  // Watchdog (see the note above the constants)
  if (!watchDone && !still) {
    if (!drew) {
      watchStart = 0; // drawing stopped (nothing in view): warm up again when it resumes
    } else {
      if (!watchStart) watchStart = now;
      const atRest = now - lastActivity > 400;
      // a gap over a quarter of a second is the tab or window being away, not a frame
      if (atRest && now - watchStart > WATCH_WARMUP && frameMs > 0 && frameMs < 250) watchTimes.push(frameMs);
      if (watchTimes.length >= WATCH_SAMPLES) {
        watchDone = true;
        const sorted = watchTimes.slice().sort((a, b) => a - b);
        const median = sorted[sorted.length >> 1];
        watchTimes = [];
        if (median > (tier === 2 ? 26 : 55)) dropTier();
      }
    }
  }
}

function dropTier() {
  if (tier === 2) {
    tier = 1;
    document.documentElement.dataset.tier = '1';
    sizeRenderer(true);
    watchStart = 0;
    watchTimes = [];
    watchDone = false; // watch once more on the lower tier
  } else {
    document.documentElement.dataset.tier = '0';
    teardown();
  }
}

function play() {
  if (running || !renderer) return;
  running = true;
  lastT = 0;
  raf = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  cancelAnimationFrame(raf);
}

/** Back to posters: dispose everything and hide the canvas. */
function teardown() {
  stop();
  io?.disconnect();
  ro?.disconnect();
  for (const rec of stages) {
    if (rec.instance) {
      rec.instance.dispose?.();
      disposeTree(rec.instance.scene);
      rec.instance = undefined;
    }
    rec.state = 'failed';
    rec.el.classList.remove('is-live');
  }
  if (renderer) {
    renderer.dispose();
    renderer = undefined;
  }
  fadeScene = undefined;
  fadeCamera = undefined;
  fadeMaterial = undefined;
  canvas.hidden = true;
}

function onPointer(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  lastActivity = performance.now();
}

function ndcFor(rec: StageRec, e: MouseEvent): THREE.Vector2 {
  const r = rec.el.getBoundingClientRect();
  return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
}

function bindInteractive(rec: StageRec) {
  rec.el.addEventListener('pointermove', (e) => {
    const href = rec.instance?.pick?.(ndcFor(rec, e)) ?? null;
    if (href !== rec.hoverHref) {
      rec.hoverHref = href;
      rec.el.style.cursor = href ? 'pointer' : '';
    }
  });
  rec.el.addEventListener('click', (e) => {
    const href = rec.instance?.pick?.(ndcFor(rec, e));
    if (!href) return;
    // Every hotspot mirrors a real link in the DOM (rule 4.1): follow that link.
    const link = document.querySelector<HTMLAnchorElement>(`a[data-hotspot="${CSS.escape(href)}"], a[href="${CSS.escape(href)}"]`);
    if (link) link.click();
    else location.assign(href);
  });
}

export function startEngine(startTier: Tier) {
  const c = document.querySelector<HTMLCanvasElement>('[data-scene-canvas]');
  if (!c || renderer) return;
  canvas = c;
  tier = startTier;
  canvas.hidden = false;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: tier === 2 || still,
      powerPreference: 'high-performance',
      stencil: false,
      preserveDrawingBuffer: still,
    });
  } catch {
    canvas.hidden = true;
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  sizeRenderer();

  document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => {
    const rec: StageRec = { el, name: el.dataset.scene!, state: 'idle', near: false, aspect: 0, shown: false, hoverHref: null };
    stages.push(rec);
    byEl.set(el, rec);
    if (el.hasAttribute('data-interactive')) bindInteractive(rec);
  });

  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const rec = byEl.get(e.target);
        if (!rec) continue;
        rec.near = e.isIntersecting;
        if (e.isIntersecting) load(rec);
      }
    },
    { rootMargin: '50% 0px 50% 0px' },
  );
  ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const rec = byEl.get(e.target);
      if (rec) rec.aspect = 0; // re-fit on the next frame
    }
  });
  stages.forEach((s) => {
    io!.observe(s.el);
    ro!.observe(s.el);
  });

  // A window resize only resizes the canvas (and only if its size changed); each scene is refitted when its
  // own box changes size (the ResizeObserver above), not on every resize event the address bar sends.
  window.addEventListener('resize', () => sizeRenderer(), { passive: true });
  window.addEventListener('orientationchange', () => {
    sizeRenderer(true);
    stages.forEach((s) => (s.aspect = 0));
  }, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('scroll', () => (lastActivity = performance.now()), { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  // Leaving the page for good frees everything. A page kept in the back/forward cache is only paused,
  // so coming back with the Back button finds the 3D alive, not the static images (D81).
  window.addEventListener('pagehide', (e) => (e.persisted ? stop() : teardown()));
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && !document.hidden) play();
  });
  // The browser can take the graphics context away for a moment (many tabs, the computer waking up).
  // That is not the end of the 3D: show the static images while it is gone and carry on when it returns.
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
    for (const rec of stages) {
      rec.shown = false;
      rec.el.classList.remove('is-live');
    }
  });
  canvas.addEventListener('webglcontextrestored', () => {
    stages.forEach((s) => (s.aspect = 0));
    sizeRenderer(true);
    watchStart = 0;
    watchTimes = [];
    if (!document.hidden) play();
  });

  play();
}
