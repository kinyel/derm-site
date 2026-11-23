/** Foot skin care: a glowing contour footprint in pressure-map style. */
import { THREE, glass, stageSet, fitToAspect, shaderPlane, variation, color } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const FRAG = /* glsl */ `
uniform float uWalk; uniform float uSeed;
float ell(vec2 p, vec2 c, vec2 r){ return length((p - c) / r) - 1.0; }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
void main(){
  vec2 p = (vUv - 0.5) * vec2(1.0, 1.5);
  float d = ell(p, vec2(0.0, -0.46), vec2(0.15, 0.17));                // heel
  d = smin(d, ell(p, vec2(0.03, -0.12), vec2(0.1, 0.26)), 0.35);       // arch
  d = smin(d, ell(p, vec2(0.0, 0.2), vec2(0.2, 0.17)), 0.3);           // ball
  float toes = ell(p, vec2(-0.13, 0.5), vec2(0.07, 0.085));
  toes = min(toes, ell(p, vec2(-0.02, 0.535), vec2(0.045, 0.06)));
  toes = min(toes, ell(p, vec2(0.065, 0.525), vec2(0.04, 0.055)));
  toes = min(toes, ell(p, vec2(0.135, 0.49), vec2(0.036, 0.05)));
  toes = min(toes, ell(p, vec2(0.19, 0.44), vec2(0.032, 0.045)));
  d = min(d, toes);
  float inside = smoothstep(0.02, -0.02, d);
  float depth = clamp(-d, 0.0, 1.0);
  float lines = smoothstep(0.82, 0.98, abs(fract(depth * 5.5 + uSeed) - 0.5) * 2.0);  // contour lines
  float wave = exp(-pow((p.y - uWalk) * 3.2, 2.0));                    // pressure travels heel → toe
  vec3 col = mix(uA, uB, clamp(depth * 1.6, 0.0, 1.0));
  col = mix(col, uC, wave * 0.7);
  float a = inside * (0.16 + lines * 0.75 + wave * 0.4 * depth * 2.0) + smoothstep(0.03, 0.0, abs(d)) * 0.8;
  gl_FragColor = vec4(col * (0.7 + wave * 0.6), clamp(a, 0.0, 1.0));
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 8);
  const v = variation(params);
  const walk = { value: 0 };
  const plane = shaderPlane(4, 6, FRAG, { uWalk: walk, uSeed: { value: v.seed } }, { additive: true });
  const pad = new THREE.Mesh(new THREE.CapsuleGeometry(1.75, 2.6, 6, 28), glass({ tint: color('white'), opacity: 0.22, iri: 2 }));
  pad.scale.z = 0.05;
  pad.position.z = -0.2;
  const group = new THREE.Group();
  group.add(pad, plane);
  group.scale.setScalar(v.scale);
  group.rotation.set(-0.3, 0.2, -0.12 + v.spin * 0.02);
  scene.add(group);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 4.2, 6.4, 1.02);
    },
    update({ time }) {
      walk.value = still ? 0.15 : ((time * 0.22 * v.speed) % 1.6) - 0.8;
      group.rotation.y = 0.2 + Math.sin(time * 0.22) * 0.08;
    },
  };
};

export default factory;
