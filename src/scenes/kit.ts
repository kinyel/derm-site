/**
 * Shared 3D kit: brand palette (read from CSS tokens), the glass material (fresnel rim +
 * gradient environment + thin-film tint, no `transmission`), ribbons, helpers.
 */
import * as THREE from 'three';

export type Tone = 'rose' | 'blush' | 'leaf' | 'white' | 'night';

const TOKENS: Record<Tone | 'blush400' | 'glacier400' | 'blush600' | 'blush700' | 'glacier600' | 'glacier700' | 'leaf700' | 'night3' | 'mist' | 'skin1' | 'skin3' | 'skin5' | 'blush100', string> = {
  skin1: '--skin-1',
  skin3: '--skin-3',
  skin5: '--skin-5',
  blush100: '--blush-100',
  rose: '--glacier-400', // the second glass tone: glacier blue (palette v4)
  blush: '--blush-400',
  leaf: '--leaf-400',
  white: '--white',
  night: '--night',
  night3: '--night-3',
  // fixed tones: the same on dark and light bands (not swapped for the deep tones)
  blush400: '--blush-400',
  glacier400: '--glacier-400',
  blush600: '--blush-600',
  blush700: '--blush-700',
  glacier600: '--glacier-600',
  glacier700: '--glacier-700',
  leaf700: '--leaf-700',
  mist: '--mist',
};

const cache = new Map<string, THREE.Color>();

/** Scenes on light bands use the 700 tones so glass stays visible; the engine sets this per stage. */
let lightSurface = false;
export function setSurface(isLight: boolean): void {
  lightSurface = isLight;
}
export const onLightSurface = () => lightSurface;
const DEEP: Partial<Record<keyof typeof TOKENS, keyof typeof TOKENS>> = { rose: 'glacier600', blush: 'blush700', leaf: 'leaf700', white: 'blush' };

/** Brand colour from the CSS tokens (never a hard-coded value). */
export function color(requested: keyof typeof TOKENS): THREE.Color {
  const name = lightSurface ? (DEEP[requested] ?? requested) : requested;
  let c = cache.get(name);
  if (!c) {
    const css = getComputedStyle(document.documentElement).getPropertyValue(TOKENS[name]).trim();
    c = new THREE.Color(css || '#ffffff');
    cache.set(name, c);
  }
  return c.clone();
}

export const NOISE_GLSL = /* glsl */ `
vec3 hash3(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6))); return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
float noise3(vec3 p){
  vec3 i = floor(p), f = fract(p); vec3 u = f*f*(3.0-2.0*f);
  return mix(mix(mix(dot(hash3(i+vec3(0,0,0)),f-vec3(0,0,0)), dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                 mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)), dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
             mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)), dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                 mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)), dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
}
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise2(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x), u.y); }
`;

const GLASS_VERT = /* glsl */ `
uniform float uTime; uniform float uWobble;
varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
${NOISE_GLSL}
void main(){
  vUv = uv; vec3 p = position;
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.0)).xyz;
  #endif
  if (uWobble > 0.0) { p += normal * noise3(position*1.4 + uTime*0.25) * uWobble; }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
    n = mat3(instanceMatrix) * n;
  #endif
  vN = normalize(normalMatrix * n); vV = normalize(-mv.xyz); vP = p;
  gl_Position = projectionMatrix * mv;
}`;

const GLASS_FRAG = /* glsl */ `
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uTint;
uniform float uOpacity; uniform float uIri; uniform float uTime; uniform float uGlow; uniform float uReveal;
varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
void main(){
  if (uReveal < 1.0 && vUv.x > uReveal) discard;
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV);
  float ndv = max(dot(n, v), 0.0);
  float f = pow(1.0 - ndv, 2.4);                       // fresnel rim
  vec3 r = reflect(-v, n);
  float g = r.y * 0.5 + 0.5;                            // gradient "environment" from the brand palette
  vec3 env = mix(uC, mix(uA, uB, smoothstep(0.12, 0.6, g)), smoothstep(0.0, 0.38, g));   // pink leads, then rose, then a touch of leaf
  float t = fract(f * uIri + g * 0.35 + uTime * 0.02);  // thin-film tint, palette only
  vec3 film = mix(mix(uB, uA, smoothstep(0.0, 0.55, t)), uC, smoothstep(0.6, 1.0, t));
  float spec = pow(max(dot(r, normalize(vec3(0.35, 0.8, 0.5))), 0.0), 48.0);
  float spec2 = pow(max(dot(r, normalize(vec3(-0.6, 0.2, 0.75))), 0.0), 18.0) * 0.25;
  vec3 col = mix(uTint, env, 0.34 + 0.4 * f);
  col = mix(col, film, 0.3 * f + 0.12);
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(lum), col, 1.28);                      // keep the colour sharp, not milky
  col += (spec + spec2) * vec3(1.0);
  col += uTint * uGlow;
  float alpha = clamp(uOpacity * (0.46 + 0.54 * f) + spec + spec2 + uGlow * 0.6, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}`;

export interface GlassOptions {
  tint?: THREE.Color;
  opacity?: number;
  /** Thin-film strength (number of colour bands across the rim). */
  iri?: number;
  wobble?: number;
  glow?: number;
  side?: THREE.Side;
  depthWrite?: boolean;
}

export function glass(opts: GlassOptions = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
    uniforms: {
      uA: { value: color('rose') },
      uB: { value: color('blush') },
      uC: { value: color('leaf') },
      uTint: { value: opts.tint ?? color('white') },
      uOpacity: { value: Math.min(1, (opts.opacity ?? 0.85) + (lightSurface ? 0.12 : 0)) },
      uIri: { value: opts.iri ?? 1.4 },
      uTime: { value: 0 },
      uWobble: { value: opts.wobble ?? 0 },
      uGlow: { value: opts.glow ?? 0 },
      uReveal: { value: 1 },
    },
    transparent: true,
    depthWrite: opts.depthWrite ?? false,
    side: opts.side ?? THREE.DoubleSide,
  });
}

/** Soft additive light (orbs, beams, glows). */
export function light(tone: THREE.Color, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color: tone, transparent: true, opacity, blending: lightSurface ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false });
}

/** Round soft glow sprite material (radial falloff). */
export function glowMaterial(tone: THREE.Color, strength = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: tone }, uStrength: { value: strength } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uStrength; varying vec2 vUv;
      void main(){
        float d = length(vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d); a *= a * uStrength;
        gl_FragColor = vec4(uColor * a, a);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: lightSurface ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
}

/** Flat ribbon along a smooth curve, with an optional twist. u runs along the ribbon (for reveal). */
export function ribbonGeometry(points: THREE.Vector3[], width: number, segments: number, twist = 0, widthProfile?: (t: number) => number): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const up = new THREE.Vector3(0, 0, 1);
  const tan = new THREE.Vector3();
  const bin = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPoint(t, p);
    curve.getTangent(t, tan);
    bin.crossVectors(tan, up).normalize();
    if (bin.lengthSq() < 0.001) bin.set(1, 0, 0);
    bin.applyAxisAngle(tan, twist * t * Math.PI * 2);
    nrm.crossVectors(bin, tan).normalize();
    const w = (width * (widthProfile ? widthProfile(t) : Math.sin(Math.PI * Math.min(1, t * 1.05)) * 0.7 + 0.3)) / 2;
    pos.push(p.x + bin.x * w, p.y + bin.y * w, p.z + bin.z * w, p.x - bin.x * w, p.y - bin.y * w, p.z - bin.z * w);
    nor.push(nrm.x, nrm.y, nrm.z, nrm.x, nrm.y, nrm.z);
    uv.push(t, 0, t, 1);
    if (i < segments) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Keep a box of (boxW × boxH) world units whole inside the stage at any aspect ratio. */
export function fitToAspect(camera: THREE.PerspectiveCamera, aspect: number, boxW: number, boxH: number, pad = 1.12): void {
  camera.aspect = aspect;
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const distV = (boxH * pad) / 2 / tanV;
  const distH = (boxW * pad) / 2 / (tanV * aspect);
  camera.position.z = Math.max(distV, distH);
  camera.updateProjectionMatrix();
}

/** Visible half-height and half-width at z = 0 for a camera looking down -z. */
export function frustumAt(camera: THREE.PerspectiveCamera): { hw: number; hh: number } {
  const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  return { hw: hh * camera.aspect, hh };
}

export function rng(seed: number): () => number {
  let a = Math.floor(seed * 2 ** 32) || 0x9e3779b9;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function disposeTree(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose?.();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((mat) => {
      const sm = mat as THREE.ShaderMaterial & { map?: THREE.Texture };
      sm.map?.dispose?.();
      if (sm.uniforms) Object.values(sm.uniforms).forEach((u) => (u.value as THREE.Texture | undefined)?.isTexture && (u.value as THREE.Texture).dispose());
      mat.dispose();
    });
  });
}

export const ease = {
  out: (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3),
  inOut: (t: number) => {
    const x = Math.min(Math.max(t, 0), 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  },
  clamp: (t: number) => Math.min(Math.max(t, 0), 1),
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  /** Frame-rate independent damping toward a target. */
  damp: (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt)),
};

export function setTime(root: THREE.Object3D, time: number): void {
  root.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
    if (mat?.uniforms?.uTime) mat.uniforms.uTime.value = time;
  });
}

export { THREE };

/* ---------- small builders shared by scenes ---------- */

export function stageSet(fov = 30, z = 7): { scene: THREE.Scene; camera: THREE.PerspectiveCamera } {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 60);
  camera.position.set(0, 0, z);
  return { scene, camera };
}

export function tube(points: THREE.Vector3[], radius: number, tubular = 64, radial = 8, closed = false): THREE.TubeGeometry {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, 'centripetal'), tubular, radius, radial, closed);
}

export const v3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

/** Nearest ancestor <section>/<header>/.band, to scope DOM hooks to the stage's own section. */
export function sectionOf(stage: HTMLElement): HTMLElement {
  return (stage.closest('section, header, .band') as HTMLElement | null) ?? document.body;
}

export const isFinePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Per-page variation for procedure pages: the parent category motif with a seed-driven twist. */
export function variation(params: Record<string, string | number | boolean>): { seed: number; spin: number; speed: number; scale: number; tints: THREE.Color[] } {
  const seed = Number(params.seed ?? 0.5);
  const names = ['rose', 'blush', 'leaf'] as const;
  const shift = Math.floor(seed * 3) % 3;
  return {
    seed,
    spin: seed * Math.PI * 2,
    speed: 0.8 + seed * 0.5,
    scale: params.variant ? 0.86 : 1,
    tints: [0, 1, 2].map((i) => color(names[(i + shift) % 3])),
  };
}

/** Plane with a custom fragment shader (procedural surfaces: skin, pigment network, footprint…). */
export function shaderPlane(w: number, h: number, fragment: string, uniforms: Record<string, { value: unknown }>, opts: { additive?: boolean; segments?: number } = {}): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uA: { value: color('rose') }, uB: { value: color('blush') }, uC: { value: color('leaf') }, ...uniforms },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; varying vec2 vUv;\n${NOISE_GLSL}\n${fragment}`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: opts.additive && !lightSurface ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h, opts.segments ?? 1, opts.segments ?? 1), mat);
}

let dotTex: THREE.CanvasTexture | undefined;
/** Soft round sprite for THREE.Points (points are square without a map). */
export function dotTexture(): THREE.CanvasTexture {
  if (!dotTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    dotTex = new THREE.CanvasTexture(c);
  }
  return dotTex;
}
