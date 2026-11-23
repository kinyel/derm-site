/**
 * Internal medicine: a glowing wave travels through a translucent glass vessel and settles
 * into a calm, even rhythm as you scroll.
 */
import { THREE, color, glass, tube, v3, stageSet, fitToAspect, shaderPlane, variation, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const FRAG = /* glsl */ `
uniform float uCalm; uniform float uSpeed;
float beat(float x){                                   // one heartbeat-like pulse
  float f = fract(x);
  return exp(-pow((f - 0.3) * 16.0, 2.0)) * 1.0 - exp(-pow((f - 0.38) * 20.0, 2.0)) * 0.45 + exp(-pow((f - 0.6) * 9.0, 2.0)) * 0.2;
}
void main(){
  float x = vUv.x;
  float t = uTime * uSpeed;
  float even = beat(x * 4.0 - t);                                         // calm, regular rhythm
  float wild = beat(x * 6.3 - t * 1.7) * 1.25 + (noise2(vec2(x * 22.0 - t * 5.0, 1.0)) - 0.5) * 0.9;
  float y = 0.5 + mix(wild, even, uCalm) * 0.3 - 0.06;
  float d = abs(vUv.y - y);
  float core = smoothstep(0.022, 0.0, d);
  float halo = exp(-d * 22.0);
  float head = exp(-pow((fract(x - t * 0.25) - 0.5) * 3.0, 2.0));          // the travelling wave front
  vec3 col = mix(uB, uA, uCalm);
  col = mix(col, uC, uCalm * head * 0.6);
  float edge = smoothstep(0.0, 0.08, x) * smoothstep(1.0, 0.92, x);
  gl_FragColor = vec4(col * (0.7 + head * 0.9) + core * 0.5, (core + halo * 0.55) * edge * (0.45 + head * 0.55));
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const calm = { value: 0 };
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  const wave = shaderPlane(7, 2.2, FRAG, { uCalm: calm, uSpeed: { value: 0.5 * v.speed } }, { additive: true });
  group.add(wave);
  const vessel = new THREE.Mesh(tube([v3(-3.6, 0, 0), v3(-1.2, 0.05, 0), v3(1.2, -0.05, 0), v3(3.6, 0, 0)], 1.05, 48, 28), glass({ tint: color('rose'), opacity: 0.4, iri: 1.6, side: THREE.BackSide }));
  const vesselFront = new THREE.Mesh(vessel.geometry, glass({ tint: color('white'), opacity: 0.3, iri: 2.2, side: THREE.FrontSide }));
  group.add(vessel, vesselFront);
  group.rotation.set(0.12, -0.32 + v.spin * 0.02, 0.04);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 7.2, 3.2, 1.02);
    },
    update({ time, progress }) {
      calm.value = still ? 0.85 : ease.inOut(ease.clamp((progress - 0.15) / 0.5));
      group.rotation.y = -0.32 + v.spin * 0.02 + Math.sin(time * 0.2) * 0.06;
    },
  };
};

export default factory;
