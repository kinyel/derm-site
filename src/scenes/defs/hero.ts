/**
 * Hero "living portrait" (§11.5).
 *
 * Home (owner, D77, D79–D81): no ribbons and no glows; the band's own gradient is the colour. The
 * clinic's mark floats in glass, twice: the "O" ring and the "C" arc of the logo, linked like two rings,
 * with two small pearls in orbit. One is level with the hero's buttons, a smaller one sits in the top
 * right corner. They are drawn in front of the portrait, clear of it, and are always in motion. As the
 * page scrolls the portrait itself moves in depth: the camera closes in, the relief deepens, the head turns.
 *
 * Profile page: the earlier arrangement (glows, two glass ribbons, the abstract bust).
 *
 * Portrait: a plane displaced by its depth map. Scroll: camera dollies in, depth parallax rises.
 * Fine pointers: parallax within ±1.5°. Touch: slow breathing motion (no gyroscope).
 *
 * params: portrait (url), depth (url), glass (1 = abstract glass placeholder), mode ("home" | "profile"),
 *         fadeBottom / fadeSides (fraction of the image over which its bottom and side edges dissolve;
 *         defaults 0.2 and 0.14).
 *
 * Edge fade: the cut-out's shoulders and arm run off the left, right and bottom of the picture. The
 * fade is computed in the image's own UV space, so the picture's border is always fully transparent
 * wherever the portrait sits: any viewport, orientation, scroll step, tier or poster.
 */
import { THREE, color, glass, glowMaterial, ribbonGeometry, frustumAt, ease, rng } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

function loadTexture(url: string, width: number, srgb: boolean): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const ar = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0.8;
      const c = document.createElement('canvas');
      c.width = width;
      c.height = Math.round(width / ar);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.userData.aspect = ar;
      resolve(t);
    };
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

const PORTRAIT_VERT = /* glsl */ `
uniform sampler2D uDepth; uniform float uStrength; uniform vec2 uShift;
varying vec2 vUv;
void main(){
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vec3 p = position;
  p.z += d * uStrength;               // nose and cheeks come forward more than ears and shoulders
  p.xy += uShift * (d - 0.3);         // …and slide further with the pointer / scroll
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const PORTRAIT_FRAG = /* glsl */ `
uniform sampler2D uMap; uniform sampler2D uDepth; uniform float uGlass; uniform float uTime; uniform float uFade;
uniform vec3 uEdge;                    // fade widths as fractions of the image: x left side, y foot, z right side
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
varying vec2 vUv;
void main(){
  vec4 c = texture2D(uMap, vUv);
  // soft dissolve towards the left, right and bottom borders of the picture (alpha is 0 at the border)
  float edge = smoothstep(0.0, uEdge.y, vUv.y) * smoothstep(0.0, uEdge.x, vUv.x) * smoothstep(0.0, uEdge.z, 1.0 - vUv.x);
  // eased once more, so the picture thins out slowly towards its border instead of ending in a band
  edge = edge * edge * (3.0 - 2.0 * edge);
  c.a *= edge;
  if (c.a < 0.004) discard;
  if (uGlass > 0.0) {
    float e = 1.0 / 420.0;
    float dx = texture2D(uDepth, vUv + vec2(e, 0.0)).r - texture2D(uDepth, vUv - vec2(e, 0.0)).r;
    float dy = texture2D(uDepth, vUv + vec2(0.0, e)).r - texture2D(uDepth, vUv - vec2(0.0, e)).r;
    vec3 n = normalize(vec3(-dx * 16.0, -dy * 16.0, 1.0));
    float f = pow(1.0 - n.z, 1.4);
    float t = fract(f * 1.5 + vUv.y * 0.45 + uTime * 0.03);
    vec3 film = mix(mix(uA, uB, smoothstep(0.0, 0.5, t)), uC, smoothstep(0.5, 1.0, t));
    c.rgb = mix(c.rgb, film, clamp(f * 0.6, 0.0, 0.6) * uGlass);
    float spec = pow(max(dot(reflect(vec3(0.0, 0.0, -1.0), n), normalize(vec3(0.4, 0.7, 0.6))), 0.0), 22.0);
    c.rgb += spec * 0.45 * uGlass;
  }
  c.a *= uFade;
  gl_FragColor = c;
  #include <colorspace_fragment>
}`;

/** Ribbon paths in normalised stage space (x, y in −1…1; z in world units). */
const RIBBONS_WIDE: [number, number, number][][] = [
  [[0.05, 1.25, -1.6], [0.2, 0.7, -1.3], [0.5, 0.3, -1.0], [0.9, -0.1, -0.8], [0.75, -0.6, -0.6], [0.3, -0.95, -0.5], [-0.2, -1.25, -0.4]],
  [[1.3, 0.75, -1.4], [0.75, 0.62, -1.1], [0.28, 0.25, -0.9], [0.2, -0.3, -0.8], [0.55, -0.72, -0.7], [1.3, -0.85, -0.7]],
  [[1.3, 0.25, 0.6], [0.85, 0.05, 0.7], [0.5, -0.35, 0.7], [0.15, -0.7, 0.5], [-0.35, -1.25, 0.3]],
  [[-1.3, -0.98, -0.9], [-0.5, -0.9, -0.8], [0.1, -0.78, 0.5], [0.7, -0.5, 0.6], [1.3, -0.62, 0.5]],
];
const RIBBONS_TALL: [number, number, number][][] = [
  [[-1.3, -0.05, -1.4], [-0.4, -0.2, -1.1], [0.5, -0.3, -0.9], [0.95, -0.6, -0.7], [0.3, -0.95, -0.5], [-0.3, -1.25, -0.4]],
  [[1.3, -0.1, -1.4], [0.5, -0.28, -1.1], [-0.5, -0.45, -0.9], [-0.95, -0.7, -0.8], [-0.4, -1.25, -0.6]],
  [[1.3, -0.5, 0.6], [0.6, -0.62, 0.7], [-0.1, -0.8, 0.6], [-0.7, -0.66, 0.5], [-1.3, -0.95, 0.3]],
  [[-1.3, -0.4, 0.5], [-0.6, -0.52, 0.6], [0.2, -0.98, 0.5], [0.8, -1.25, 0.3]],
];

const factory: SceneFactory = async (ctx) => {
  const { tier, params, still } = ctx;
  const mode = String(params.mode ?? 'home');
  const isGlass = Number(params.glass ?? 1);
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const BASE_Z = 7;
  const EMBLEM_Z = 1; // in front of the portrait plane and its depth relief
  camera.position.set(0, 0, BASE_Z);

  /* ---- background glows (profile only; the home hero is lit by its own gradient) ---- */
  const glowGeo = new THREE.PlaneGeometry(1, 1);
  const glows =
    mode === 'profile'
      ? [
          { mesh: new THREE.Mesh(glowGeo, glowMaterial(color('blush'), 0.5)), x: 0.66, y: 0.5, s: 1.6, ph: 0 },
          { mesh: new THREE.Mesh(glowGeo, glowMaterial(color('rose'), 0.6)), x: 0.3, y: -0.4, s: 1.7, ph: 2.1 }, // glacier blue sweep
          { mesh: new THREE.Mesh(glowGeo, glowMaterial(color('white'), 0.28)), x: 0.56, y: 0.06, s: 1.1, ph: 4.2 },
        ]
      : [];

  glows.forEach((g) => {
    g.mesh.position.z = -3;
    g.mesh.renderOrder = -10;
    scene.add(g.mesh);
  });

  /* ---- ribbons ---- */
  const ribbonGroup = new THREE.Group();
  scene.add(ribbonGroup);
  const ribbonCount = mode === 'profile' ? 2 : 0; // none on the home hero (owner, D77)
  // Pale pink, pale glacier blue, white, pale pink: light sweeps that the portrait reads through (owner request)
  const pale = (name: 'blush' | 'rose', t: number) => color(name).clone().lerp(color('white'), t);
  const tints = [pale('blush', 0.5), pale('rose', 0.45), color('white'), pale('blush', 0.62)];
  const ribbonMats = Array.from({ length: ribbonCount }, (_, i) => glass({ tint: tints[i % 4], opacity: 0.58, iri: 1.1 + i * 0.2 }));
  const ribbons: THREE.Mesh[] = ribbonMats.map((m) => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m);
    mesh.frustumCulled = false;
    ribbonGroup.add(mesh);
    return mesh;
  });

  /* ---- the mark in glass (home): the logo's "O" ring and "C" arc, linked, with two pearls in orbit ----
     Two of them (owner, D80, D81): the main one level with the hero's buttons, and a smaller one in the
     top right corner of the hero, under the booking button. They share geometry and glass. Both are
     always in motion: they sway, bob, their pearls orbit, and they turn further as the page scrolls. */
  interface Mark {
    root: THREE.Group;
    spin: THREE.Group;
    pearls: { mesh: THREE.Mesh; r: number; sp: number; ph: number; tilt: number }[];
    base: { x: number; y: number; s: number };
    phase: number;
    dir: number;
  }
  const marks: Mark[] = [];
  if (mode === 'home') {
    const tubeSeg = tier === 2 ? 28 : 16;
    const arcSeg = tier === 2 ? 160 : 96;
    const TUBE = 0.105;
    const GAP = Math.PI * 0.44;
    // light pink and glacier blue, as on the page: the fixed 400 tones, not the deep ones used for thin glass
    const pink = glass({ tint: color('blush400'), opacity: 0.9, iri: 1.6, glow: 0.1 });
    const blue = glass({ tint: color('glacier400'), opacity: 0.9, iri: 1.9, glow: 0.1 });
    const pinkPearl = glass({ tint: color('blush400'), opacity: 0.96, iri: 2.6, glow: 0.12 });
    const bluePearl = glass({ tint: color('glacier400'), opacity: 0.96, iri: 2.6, glow: 0.12 });
    const ringGeo = new THREE.TorusGeometry(1, TUBE, tubeSeg, arcSeg);
    const arcGeo = new THREE.TorusGeometry(1, TUBE, tubeSeg, arcSeg, Math.PI * 2 - GAP);
    const capGeo = new THREE.SphereGeometry(TUBE, tubeSeg, tubeSeg);
    const pearlGeo = new THREE.SphereGeometry(1, 24, 18);
    const buildMark = (phase: number, dir: number): Mark => {
      const root = new THREE.Group();
      const spin = new THREE.Group();
      // "O": a full ring
      const o = new THREE.Mesh(ringGeo, pink);
      o.position.x = -0.8;
      o.rotation.y = -0.42;
      // "C": the same ring with a gap, turned so the opening faces away from the "O" and tipped through it
      const c = new THREE.Group();
      const arc = new THREE.Mesh(arcGeo, blue);
      arc.rotation.z = GAP / 2;
      c.add(arc);
      [GAP / 2, -GAP / 2].forEach((ang) => {
        const end = new THREE.Mesh(capGeo, blue);
        end.position.set(Math.cos(ang), Math.sin(ang), 0);
        c.add(end);
      });
      c.position.x = 0.8;
      c.rotation.set(0.5, 0.62, 0);
      spin.add(o, c);
      // pearls: small spheres on tilted orbits round the pair
      const pearls = [
        { mat: pinkPearl, size: 0.15, r: 1.72, sp: 0.55, ph: 0.4, tilt: 0.5 },
        { mat: bluePearl, size: 0.11, r: 1.55, sp: -0.42, ph: 2.6, tilt: -0.35 },
      ].map((d) => {
        const mesh = new THREE.Mesh(pearlGeo, d.mat);
        mesh.scale.setScalar(d.size);
        spin.add(mesh);
        return { mesh, r: d.r, sp: d.sp * dir, ph: d.ph + phase, tilt: d.tilt };
      });
      root.add(spin);
      root.traverse((m) => {
        m.renderOrder = 6; // drawn after the portrait: never hidden by it
      });
      scene.add(root);
      return { root, spin, pearls, base: { x: 0, y: 0, s: 1 }, phase, dir };
    };
    marks.push(buildMark(0, 1), buildMark(1.9, -1));
  }
  /* Where the marks go. The page's own elements decide, so the scene reads their places and turns them
     into scene units; it checks again every few frames because text moves when the web font arrives or
     the window changes. Without the page around it (the poster harness) typical positions are used.
       main (D80): level with the hero's buttons: to their right, centred on their row, in the space
         before the portrait, as large as that space allows; where there is no room beside them (phones,
         upright tablets, small laptops) just under the buttons on their left edge;
       corner (D81): top right of the hero, under the navigation's booking button, on the content edge. */
  const heroEl = ctx.stage.closest<HTMLElement>('[data-hero]');
  const actionsEl = heroEl?.querySelector<HTMLElement>('.hero__actions') ?? null;
  const innerEl = heroEl?.querySelector<HTMLElement>('.hero__inner') ?? null;
  let lastAspect = 1.6;
  let placeTick = 0;
  /* Places are read from the page's LAYOUT (offsets), not from where things are drawn this instant.
     The hero's words drift and rise as the page scrolls; reading their drawn position made the main mark
     jump after the buttons a few times a second, which showed as a twitch (owner, D83). Layout offsets
     ignore those movements, so the marks stay put and only change when the layout itself does. */
  const offsetIn = (el: HTMLElement | null | undefined) => {
    let x = 0;
    let y = 0;
    let n: HTMLElement | null = el ?? null;
    while (n && n !== heroEl) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent as HTMLElement | null;
    }
    return { x, y, ok: Boolean(el) && n === heroEl };
  };
  function placeMarks() {
    if (!marks.length) return;
    const { hw, hh } = base;
    const near = (BASE_Z - EMBLEM_Z) / BASE_Z; // the marks are nearer the camera than the portrait's plane
    const wide = lastAspect >= 1.2;
    const W = ctx.stage.offsetWidth;
    const H = ctx.stage.offsetHeight;
    const a = offsetIn(actionsEl);
    const onPage = a.ok && W > 0 && H > 0 && (actionsEl?.offsetWidth ?? 0) > 0;
    const unit = onPage ? (2 * hh) / H : 0; // scene units per CSS pixel
    const toX = (px: number) => (px / W) * 2 * hw - hw;
    const toY = (py: number) => hh - (py / H) * 2 * hh;
    const set = (m: Mark, x: number, y: number, r: number) => {
      m.base.s = r * near;
      m.base.x = x * near;
      m.base.y = y * near;
      m.root.position.x = m.base.x;
      m.root.position.z = EMBLEM_Z;
    };

    // main
    if (onPage && actionsEl) {
      const aw = actionsEl.offsetWidth;
      const ah = actionsEl.offsetHeight;
      // room beside the buttons, before her elbow
      const portraitW = (portraitGroup.scale.x || 1) * BASE_H * ar;
      // the row is as wide as the text column; the buttons end where the last one ends
      const lastBtn = actionsEl.lastElementChild as HTMLElement | null;
      const lb = offsetIn(lastBtn);
      const rowEnd = lb.ok && lastBtn && lastBtn.offsetWidth > 0 ? lb.x + lastBtn.offsetWidth : a.x + aw;
      const left = toX(rowEnd) + 28 * unit;
      const right = base.x - portraitW / 2 + portraitW * 0.06;
      const beside = Math.min(hh * 0.17, (right - left) / 4);
      if (wide && beside >= 44 * unit) {
        set(marks[0], (left + right) / 2, toY(a.y + ah / 2), beside);
      } else {
        // never down into the strip of services
        const strip = offsetIn(heroEl?.querySelector<HTMLElement>('.hero__strip'));
        const room = wide && strip.ok ? (strip.y - (a.y + ah) - 24) / 2.5 : Infinity;
        const r = Math.max(22, Math.min(W * 0.085, 46, room)) * unit;
        set(marks[0], toX(a.x) + r * 1.95, toY(a.y + ah) - 14 * unit - r * 1.2, r);
      }
    } else if (wide) {
      set(marks[0], hw * 0.03, -hh * 0.3, hh * 0.15);
    } else {
      set(marks[0], -hw * 0.58, -hh * 0.16, hw * 0.17);
    }

    // corner
    if (onPage) {
      const inner = offsetIn(innerEl);
      const edge = inner.ok && innerEl && innerEl.offsetWidth > 0 ? inner.x : 20; // the page's side margin
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 72;
      const r = Math.max(13, Math.min(W * 0.034, H * 0.05, 40)) * unit;
      set(marks[1], toX(W - edge) - r * 1.95, toY(navH + 22) - r * 1.25, r);
    } else if (wide) {
      set(marks[1], hw * 0.84, hh * 0.66, hh * 0.07);
    } else {
      set(marks[1], hw * 0.68, hh * 0.72, hw * 0.07);
    }
  }

  /* ---- portrait ---- */
  const texW = tier === 2 ? 1024 : 768;
  const [map, depth] = await Promise.all([
    loadTexture(String(params.portrait), texW, true),
    loadTexture(String(params.depth), texW / 2, false),
  ]);
  const ar = (map.userData.aspect as number) || 0.8;
  const BASE_H = 4;
  const seg = tier === 2 ? [96, 120] : [48, 60];
  const portraitMat = new THREE.ShaderMaterial({
    vertexShader: PORTRAIT_VERT,
    fragmentShader: PORTRAIT_FRAG,
    uniforms: {
      uMap: { value: map },
      uDepth: { value: depth },
      uStrength: { value: 0.3 },
      uShift: { value: new THREE.Vector2() },
      uGlass: { value: isGlass },
      uTime: { value: 0 },
      uFade: { value: still ? 1 : 0 },
      uEdge: { value: new THREE.Vector3(Math.max(0.001, Number(params.fadeSides ?? 0.14)), Math.max(0.001, Number(params.fadeBottom ?? 0.2)), Math.max(0.001, Number(params.fadeSides ?? 0.14))) },
      uA: { value: color('rose') },
      uB: { value: color('blush') },
      uC: { value: color('leaf') },
    },
    transparent: true,
    depthWrite: true,
  });
  const portrait = new THREE.Mesh(new THREE.PlaneGeometry(BASE_H * ar, BASE_H, seg[0], seg[1]), portraitMat);
  const portraitGroup = new THREE.Group();
  portraitGroup.add(portrait);
  scene.add(portraitGroup);

  /* ---- petals (tier 2 only) ---- */
  const petals: { mesh: THREE.Mesh; x: number; y: number; z: number; sp: number; ph: number }[] = [];
  // Glass petals only accompany the abstract placeholder; they would sit across a real face.
  if (tier === 2 && mode === 'home' && isGlass === 1) {
    const r = rng(0.37);
    const petalGeo = new THREE.SphereGeometry(1, 24, 16);
    petalGeo.scale(0.5, 0.08, 0.24);
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(petalGeo, glass({ tint: tints[i % 3], opacity: 0.9, iri: 2.2 }));
      petals.push({ mesh, x: r() * 2 - 1, y: r() * 2 - 1, z: 0.6 + r() * 1.2, sp: 0.15 + r() * 0.2, ph: r() * 6.28 });
      mesh.scale.setScalar(0.22 + r() * 0.22);
      scene.add(mesh);
    }
  }

  /* ---- layout per aspect ratio / orientation ---- */
  const base = { x: 0, y: 0, hw: 1, hh: 1 };
  const v = (p: [number, number, number]) => new THREE.Vector3(p[0] * base.hw, p[1] * base.hh, p[2]);
  function layout(aspect: number) {
    camera.aspect = aspect;
    camera.position.z = BASE_Z;
    camera.updateProjectionMatrix();
    const { hw, hh } = frustumAt(camera);
    base.hw = hw;
    base.hh = hh;
    let h: number;
    if (mode === 'profile') {
      h = hh * 1.86;
      base.x = 0;
      base.y = -hh * 0.04;
    } else if (aspect >= 1.2) {
      // landscape phones, tablets on their side, laptops, desktops: text left, portrait right.
      // The strip of services covers the left 70% of the foot, so the portrait has the right-hand
      // column to itself from top to bottom (D79).
      h = hh * 1.74;
      base.x = hw * 0.56;
      base.y = -hh * 0.1;
    } else if (aspect >= 0.72) {
      // tall tablets
      h = hh * 1.1;
      base.x = hw * 0.34;
      base.y = -hh * 0.42;
    } else {
      // portrait phones: text on top, portrait below and partly behind the buttons
      h = hh * 0.98;
      base.x = hw * 0.12;
      base.y = -hh * 0.5;
    }
    portraitGroup.position.set(base.x, base.y, 0);
    portraitGroup.scale.setScalar(h / BASE_H);
    // Wide screens (home): the portrait stands in front of the strip of services, so its left side and
    // foot dissolve over a longer distance there: her arm melts into the box instead of stopping on it (D86).
    if (mode === 'home' && params.fadeSides === undefined && params.fadeBottom === undefined) {
      const e = portraitMat.uniforms.uEdge.value as THREE.Vector3;
      if (aspect >= 1.2) e.set(0.24, 0.27, 0.12);
      else e.set(0.14, 0.2, 0.14);
    }

    lastAspect = aspect;
    placeMarks();

    const paths = aspect >= 1.2 ? RIBBONS_WIDE : RIBBONS_TALL;
    const segs = tier === 2 ? 140 : 64;
    ribbons.forEach((mesh, i) => {
      mesh.geometry.dispose();
      const width = (0.34 - i * 0.05) * Math.min(hw, hh * 1.4) * (mode === 'profile' ? 0.7 : 1);
      mesh.geometry = ribbonGeometry(paths[i % paths.length].map(v), width, segs, 0.35 + i * 0.22);
      mesh.renderOrder = paths[i % paths.length][2][2] > 0 ? 5 : -5;
    });
    glows.forEach((g) => {
      g.mesh.scale.setScalar(Math.max(hw, hh) * 2 * g.s);
    });
  }

  let t0 = -1;
  const rot = { x: 0, y: 0 };
  /* How far the hero has scrolled out (0 at rest at the top, 1 when it has left), read from the stage's
     own place on the page each frame and eased, so it is right from the first frame and never jumps when
     the motion library arrives late (D81). Posters are drawn at rest. */
  let scrolled = 0;

  return {
    scene,
    camera,
    resize: layout,
    update({ time, dt, progress, pointer }) {
      if (t0 < 0) t0 = time;
      const intro = still ? 1 : ease.out((time - t0) / 1.9);
      let p = progress;
      if (mode === 'home') {
        if (still) {
          scrolled = 0;
        } else {
          // held in place by the home page's fade sequence: it says how far through its life the hero is
          const seq = (ctx.stage as HTMLElement & { __seq?: number }).__seq;
          const r = ctx.stage.getBoundingClientRect();
          const target = seq !== undefined ? seq : r.height > 0 ? ease.clamp(-r.top / r.height) : 0;
          scrolled = ease.damp(scrolled, target, 7, dt);
        }
        p = scrolled;
      }
      // most of the scroll effect happens while the hero is still well in view
      const s1 = ease.inOut(ease.clamp(p / 0.7));

      // ribbons (profile page) unfurl once, then rotate and stream down with scroll
      ribbonMats.forEach((m, i) => {
        m.uniforms.uReveal.value = still ? 1 : ease.clamp(intro * 1.25 - i * 0.08);
      });
      ribbonGroup.position.y = -p * base.hh * 1.25;
      ribbonGroup.rotation.z = -p * 0.32 + Math.sin(time * 0.12) * 0.012;
      ribbonGroup.scale.y = 1 - p * 0.28;

      // Scrolling out: the camera moves in, the relief of the face deepens and the head turns a little
      // towards the text, so the portrait reads as a solid thing leaving, not a picture sliding away.
      camera.position.z = BASE_Z - (mode === 'home' ? s1 * 1.15 : p * 0.9);
      const breathe = Math.sin(time * 0.55);
      portraitMat.uniforms.uStrength.value = 0.26 + (mode === 'home' ? s1 * 0.95 : p * 0.5) + (fine ? 0 : breathe * 0.05);
      portraitMat.uniforms.uFade.value = still ? 1 : ease.clamp(intro * 1.4);

      // pointer parallax within ±1.5°; touch devices breathe slowly instead
      const max = THREE.MathUtils.degToRad(1.5);
      const tx = fine && pointer.inside ? -pointer.y * max : Math.sin(time * 0.4) * max * 0.45;
      const ty = fine && pointer.inside ? pointer.x * max : breathe * max * 0.6;
      rot.x = ease.damp(rot.x, tx, 3.5, dt);
      rot.y = ease.damp(rot.y, ty, 3.5, dt);
      const turn = mode === 'home' ? s1 : 0;
      portraitGroup.rotation.set(rot.x + turn * 0.07, rot.y - turn * 0.3, 0);
      (portraitMat.uniforms.uShift.value as THREE.Vector2).set(rot.y * (2.2 + p * 3) - turn * 0.1, -rot.x * (2.2 + p * 3));
      portraitGroup.position.y = base.y + (mode === 'home' ? s1 * base.hh * 0.16 : p * base.hh * 0.18) + (1 - intro) * -0.25;

      glows.forEach((g) => {
        g.mesh.position.x = (g.x + Math.sin(time * 0.07 + g.ph) * 0.12) * base.hw;
        g.mesh.position.y = (g.y + Math.cos(time * 0.09 + g.ph) * 0.1) * base.hh;
      });

      // The marks never rest: they sway and bob, their pearls orbit, they lean with the pointer and
      // they turn further and lift as the page scrolls.
      if (marks.length) {
        if (!still && ++placeTick % 45 === 0) placeMarks();
        marks.forEach((m, i) => {
          const t = (still ? 2.4 : time) + m.phase;
          const grow = still ? 1 : 0.72 + 0.28 * ease.out(ease.clamp(intro * 1.1 - i * 0.15));
          m.root.scale.setScalar(m.base.s * grow);
          // the main mark stays level with the buttons it is placed against; the corner one lifts a little
          m.root.position.y = m.base.y + Math.sin(t * 0.9) * base.hh * 0.016 + s1 * base.hh * (i === 0 ? 0 : 0.04);
          // sways and tumbles, and turns further with scroll, but never far enough to read back to front
          // the static picture shows the marks square-on, so both rings read as the logo
          const sway = still ? 0 : 1;
          m.root.rotation.set(
            0.16 + sway * Math.sin(t * 0.52) * 0.14 + rot.x * 5 + s1 * 0.55,
            m.dir * (0.1 + sway * Math.sin(t * 0.4) * 0.32) + rot.y * 6 + m.dir * s1 * 0.75,
            sway * Math.sin(t * 0.31) * 0.09 - 0.08 - m.dir * s1 * 0.3,
          );
          m.pearls.forEach((pl) => {
            const ang = t * pl.sp + pl.ph;
            pl.mesh.position.set(Math.cos(ang) * pl.r, Math.sin(ang) * pl.r * Math.sin(pl.tilt) * 0.9, Math.sin(ang) * pl.r * Math.cos(pl.tilt) * 0.55);
          });
        });
      }
      petals.forEach((pt) => {
        pt.mesh.position.set(
          base.x + pt.x * base.hw * 0.5 + Math.sin(time * pt.sp + pt.ph) * 0.3,
          pt.y * base.hh * 0.8 + Math.cos(time * pt.sp * 0.8 + pt.ph) * 0.3 - p * base.hh * 0.6,
          pt.z,
        );
        pt.mesh.rotation.set(time * pt.sp + pt.ph, time * pt.sp * 0.7, pt.ph);
      });
    },
  };
};

export default factory;
