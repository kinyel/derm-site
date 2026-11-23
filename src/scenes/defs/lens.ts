/** Consultations: a dermatoscope lens magnifying a skin-texture surface as it follows pointer / scroll. */
import { THREE, color, glass, stageSet, fitToAspect, shaderPlane, variation, ease, isFinePointer } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const FRAG = /* glsl */ `
uniform vec2 uLens; uniform float uRadius; uniform float uSeed;
float skin(vec2 p){
  float lines = abs(noise2(p * 9.0 + uSeed) - 0.5) * 2.0;           // fine skin lines
  float cells = noise2(p * 26.0 + 3.0 + uSeed);
  float pores = smoothstep(0.78, 0.9, noise2(p * 44.0 + uSeed * 7.0));
  return clamp(0.55 + lines * 0.3 + cells * 0.2 - pores * 0.5, 0.0, 1.0);
}
void main(){
  vec2 uv = vUv;
  float d = distance(uv, uLens);
  float inside = 1.0 - smoothstep(uRadius - 0.01, uRadius, d);
  vec2 zoomed = uLens + (uv - uLens) * 0.38;                       // magnified view inside the lens
  float s = mix(skin(uv), skin(zoomed), inside);
  vec3 base = mix(uB * 0.55, uA, s);
  base = mix(base, uC, smoothstep(0.75, 1.0, s) * 0.35);
  base += inside * 0.08;
  float edge = smoothstep(0.5, 0.46, distance(uv, vec2(0.5)));                 // a round sample of skin
  gl_FragColor = vec4(base, edge * mix(0.5, 0.95, inside));
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 8);
  const v = variation(params);
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  const lens = new THREE.Vector2(0.5, 0.5);
  const plane = shaderPlane(5, 5, FRAG, { uLens: { value: lens }, uRadius: { value: 0.2 }, uSeed: { value: v.seed * 10 } });
  plane.rotation.z = v.spin * 0.1;
  group.add(plane);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 14, 64), glass({ tint: v.tints[0], opacity: 1, iri: 2.2 }));
  const glassDisc = new THREE.Mesh(new THREE.CircleGeometry(1.0, 48), glass({ tint: color('white'), opacity: 0.25, iri: 2.6 }));
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.5, 12), glass({ tint: v.tints[1], opacity: 1, iri: 1.4 }));
  handle.position.set(1.25, -1.25, 0);
  handle.rotation.z = Math.PI / 4;
  const tool = new THREE.Group();
  tool.add(ring, glassDisc, handle);
  tool.position.z = 0.35;
  group.add(tool);
  const fine = isFinePointer();
  const pos = new THREE.Vector2(0.5, 0.5);

  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 5.4, 5.4, 1.02);
    },
    update({ time, dt, progress, pointer }) {
      // follows the pointer on desktop, a slow figure-of-eight + scroll on touch
      const tx = still ? 0.56 : fine && pointer.inside ? pointer.x * 0.3 + 0.5 : 0.5 + Math.sin(time * 0.35 * v.speed) * 0.22;
      const ty = still ? 0.52 : fine && pointer.inside ? pointer.y * 0.3 + 0.5 : 0.3 + progress * 0.4 + Math.sin(time * 0.7 * v.speed) * 0.08;
      const off = Math.hypot(tx - 0.5, ty - 0.5);
      const keep = off > 0.3 ? 0.3 / off : 1; // keep the lens over the sample
      pos.x = ease.damp(pos.x, 0.5 + (tx - 0.5) * keep, 4, dt);
      pos.y = ease.damp(pos.y, 0.5 + (ty - 0.5) * keep, 4, dt);
      lens.copy(pos);
      tool.position.set((pos.x - 0.5) * 5, (pos.y - 0.5) * 5, 0.35);
    },
  };
};

export default factory;
