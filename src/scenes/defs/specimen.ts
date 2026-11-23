/**
 * Condition specimen: one stylised skin-surface patch whose shader parameters differ per
 * condition (bumps, plaques, patches, ridges, rings, dots, lines, scales, blisters, mottled).
 * Never photographic. The base tone varies across brown and Black skin (params.tone 0…1).
 * params: pattern, tone, density, accent, seed
 */
import { THREE, color, glass, stageSet, fitToAspect, shaderPlane, ease, isFinePointer } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const PATTERNS = ['smooth', 'bumps', 'plaques', 'patches', 'ridges', 'rings', 'dots', 'lines', 'scales', 'blisters', 'mottled'];

const FRAG = /* glsl */ `
uniform int uPattern; uniform float uTone; uniform float uDensity; uniform float uSeed; uniform float uSign; uniform float uAccentAmt;
uniform vec3 uSkinA; uniform vec3 uSkinB; uniform vec3 uAccent; uniform vec3 uDeep; uniform vec3 uPearl;

vec3 voro(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash21(i + g + uSeed), hash21(i + g + 31.0 + uSeed));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; id = hash21(i + g + 7.0 + uSeed); } else if (d < d2) { d2 = d; }
  }
  return vec3(d1, d2, id);
}
float fbm(vec2 p){ return noise2(p) * 0.5 + noise2(p * 2.03 + 11.0) * 0.3 + noise2(p * 4.01 + 5.0) * 0.2; }

// x = height, y = how much of the accent colour, z = tint (negative lighter, positive darker)
vec3 pattern(vec2 uv){
  float dens = mix(4.0, 13.0, uDensity);
  if (uPattern == 1) {                                   // bumps
    vec3 v = voro(uv * dens);
    float dome = smoothstep(0.44, 0.0, v.x) * step(0.3, v.z);
    return vec3(dome, dome, 0.3 * dome * (uSign < 0.0 ? -1.0 : 1.0));
  }
  if (uPattern == 2) {                                   // plaques: raised, scaly
    float blob = smoothstep(0.47, 0.6, fbm(uv * mix(1.6, 3.2, uDensity) + uSeed));
    float scale = noise2(uv * 46.0 + uSeed);
    return vec3(blob * (0.75 + scale * 0.3), blob, blob * (uSign == 0.0 ? -0.3 : uSign * 0.55) * (0.7 + scale * 0.5));
  }
  if (uPattern == 3) {                                   // flat patches: paler or darker
    float blob = smoothstep(0.5, 0.55, fbm(uv * mix(1.6, 3.4, uDensity) + uSeed));
    return vec3(0.0, blob * 0.4, blob * (uSign == 0.0 ? 0.5 : uSign));
  }
  if (uPattern == 4) {                                   // raised smooth ridges
    float d = abs(uv.y - 0.5 - 0.11 * sin(uv.x * 5.0 + uSeed * 6.0)) - 0.03 * noise2(uv * 6.0 + uSeed);
    float ridge = smoothstep(0.15, 0.0, d) * smoothstep(0.06, 0.26, uv.x) * smoothstep(0.96, 0.74, uv.x);
    float lobe = smoothstep(0.17, 0.0, length((uv - vec2(0.68, 0.36)) * vec2(1.0, 1.5)));
    float r = max(ridge, lobe * uDensity);
    return vec3(r * 1.25, r, 0.35 * r);
  }
  if (uPattern == 5) {                                   // rings with clearer centres
    vec3 v = voro(uv * mix(1.5, 3.0, uDensity));
    float ring = smoothstep(0.07, 0.0, abs(v.x - 0.33)) * step(0.25, v.z);
    float centre = smoothstep(0.33, 0.18, v.x) * step(0.25, v.z);
    return vec3(ring * 0.6 + ring * noise2(uv * 60.0) * 0.3, ring, ring * 0.45 - centre * 0.12);
  }
  if (uPattern == 6) {                                   // small dots
    vec3 v = voro(uv * dens * 1.5);
    float dot = smoothstep(0.17, 0.1, v.x) * step(0.36, v.z);
    return vec3(dot * 0.55, dot * 0.3, dot * (uSign < 0.0 ? -0.8 : 0.9));
  }
  if (uPattern == 7) {                                   // linear streaks
    float wave = uv.y + 0.05 * sin(uv.x * 6.0 + uSeed * 4.0);
    float band = sin(wave * dens * 4.2);
    float taper = noise2(vec2(uv.x * 3.0 + uSeed, floor(wave * dens * 4.2 / 6.2832) * 9.0));
    float line = smoothstep(0.72, 0.96, band) * smoothstep(0.25, 0.6, taper);
    return vec3(-line * 0.35, line * 0.5, line * (uSign == 0.0 ? -0.4 : uSign * 0.6));
  }
  if (uPattern == 8) {                                   // polygonal scales
    vec3 v = voro(uv * dens);
    float crack = smoothstep(0.09, 0.0, v.y - v.x);
    return vec3((1.0 - crack) * 0.45, crack * 0.3, crack * 0.55 - (1.0 - crack) * 0.12);
  }
  if (uPattern == 9) {                                   // grouped clear blisters
    vec3 v = voro(uv * dens * 0.9);
    float group = smoothstep(0.45, 0.58, fbm(uv * 2.2 + uSeed));
    float dome = smoothstep(0.4, 0.04, v.x) * group;
    return vec3(dome * 1.35, dome * 0.6, -0.3 * dome + group * 0.2);
  }
  if (uPattern == 10) {                                  // net-like mottling
    vec3 v = voro(uv * dens * 0.55);
    float net = smoothstep(0.14, 0.02, v.y - v.x);
    return vec3(0.0, net * 0.5, net * (uSign < 0.0 ? -0.5 : 0.5));
  }
  return vec3(0.0);
}

void main(){
  vec2 uv = vUv;
  vec2 q = abs(uv - 0.5); float rr = 0.14;
  float box = length(max(q - (0.5 - rr), 0.0)) - rr;
  float alpha = smoothstep(0.0, -0.012, box);
  vec3 P = pattern(uv);
  float e = 0.005;
  float hx = pattern(uv + vec2(e, 0.0)).x - pattern(uv - vec2(e, 0.0)).x;
  float hy = pattern(uv + vec2(0.0, e)).x - pattern(uv - vec2(0.0, e)).x;
  vec3 n = normalize(vec3(-hx * 5.5, -hy * 5.5, 1.0));

  vec3 skin = mix(uSkinA, uSkinB, uTone);
  skin *= 0.93 + 0.13 * noise2(uv * 64.0 + uSeed);                                  // fine grain
  skin *= 1.0 - 0.07 * smoothstep(0.72, 0.96, abs(noise2(uv * 17.0 + uSeed) - 0.5) * 2.0);   // skin lines
  vec3 col = mix(skin, uDeep, clamp(P.z, 0.0, 1.0) * 0.78);
  col = mix(col, uPearl, clamp(-P.z, 0.0, 1.0) * 0.82);
  col = mix(col, uAccent, P.y * uAccentAmt);

  vec3 L = normalize(vec3(-0.45, 0.6, 0.65));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 26.0);
  col *= 0.7 + 0.48 * diff;
  col += spec * (0.18 + 0.4 * clamp(P.x, 0.0, 1.0));
  float sheen = smoothstep(0.2, 0.9, uv.x + uv.y * 0.6 - 0.3 + sin(uTime * 0.3) * 0.2) * smoothstep(1.3, 0.9, uv.x + uv.y * 0.6);
  col += sheen * 0.05;
  float rim = smoothstep(-0.06, 0.0, box);
  col = mix(col, uPearl, rim * 0.45);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 8);
  const pattern = Math.max(0, PATTERNS.indexOf(String(params.pattern ?? 'smooth')));
  const accent = String(params.accent ?? 'blush');
  const sign = accent === 'pearl' ? -1 : accent === 'deep' ? 1 : 0;
  const accentColor = accent === 'rose' ? color('blush600') : accent === 'leaf' ? color('leaf700') : color('blush700');
  const patch = shaderPlane(3.6, 3.6, FRAG, {
    uPattern: { value: pattern },
    uTone: { value: Number(params.tone ?? 0.55) },
    uDensity: { value: Number(params.density ?? 0.5) },
    uSeed: { value: Number(params.seed ?? 0.3) * 40 },
    uSign: { value: sign },
    uAccentAmt: { value: sign === 0 ? 0.42 : 0.0 },
    uSkinA: { value: color('skin1') },
    uSkinB: { value: color('skin5') },
    uAccent: { value: accentColor },
    uDeep: { value: color('skin5').multiplyScalar(0.55) },
    uPearl: { value: color('blush100') },
  });
  // a glass slide under the patch gives it depth
  const slide = new THREE.Mesh(new THREE.BoxGeometry(4.1, 4.1, 0.14, 1, 1, 1), glass({ tint: color('rose'), opacity: 0.45, iri: 2.4 }));
  slide.position.z = -0.14;
  const group = new THREE.Group();
  group.add(slide, patch);
  scene.add(group);
  const fine = isFinePointer();
  const rot = { x: -0.32, y: 0.38 };
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 5, 5, 1.02);
    },
    update({ time, dt, pointer }) {
      const tx = still ? -0.32 : fine && pointer.inside ? -0.25 - pointer.y * 0.25 : -0.32 + Math.sin(time * 0.3) * 0.06;
      const ty = still ? 0.38 : fine && pointer.inside ? pointer.x * 0.45 : 0.38 + Math.sin(time * 0.24) * 0.12;
      rot.x = ease.damp(rot.x, tx, 4, dt);
      rot.y = ease.damp(rot.y, ty, 4, dt);
      group.rotation.set(rot.x, rot.y, 0.04);
    },
  };
};

export default factory;
