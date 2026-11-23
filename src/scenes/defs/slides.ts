/** Tests and diagnostics: glass microscope slides fanning out, each with a different stained-tissue pattern. */
import { THREE, color, glass, stageSet, fitToAspect, shaderPlane, variation, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const FRAG = /* glsl */ `
uniform float uSeed; uniform vec3 uStain;
void main(){
  vec2 p = vUv - 0.5;
  float blob = smoothstep(0.34, 0.18, length(p) + (noise2(vUv * 4.0 + uSeed) - 0.5) * 0.3);
  float tissue = noise2(vUv * 14.0 + uSeed * 3.0);
  float nuclei = smoothstep(0.7, 0.86, noise2(vUv * 38.0 + uSeed * 5.0));
  vec3 col = mix(uStain, vec3(1.0), tissue * 0.55);
  col = mix(col, uStain * 0.45, nuclei);
  gl_FragColor = vec4(col, blob * 0.9);
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, tier, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const fan = new THREE.Group();
  fan.scale.setScalar(v.scale);
  scene.add(fan);
  const stains = [color('blush'), color('rose'), color('leaf'), color('blush700'), color('blush600')];
  const n = tier === 2 ? 5 : 4;
  const slideGeo = new THREE.BoxGeometry(1.25, 3.6, 0.05);
  const slides = Array.from({ length: n }, (_, i) => {
    const pivot = new THREE.Group();
    pivot.position.y = -2.2;
    const body = new THREE.Mesh(slideGeo, glass({ tint: color('white'), opacity: 0.5, iri: 2.2 }));
    body.position.y = 2.2;
    const sample = shaderPlane(1.05, 1.05, FRAG, { uSeed: { value: i * 7.3 + v.seed * 30 }, uStain: { value: stains[(i + Math.floor(v.seed * 5)) % 5] } });
    sample.position.set(0, 2.6, 0.03);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.5), glass({ tint: v.tints[i % 3], opacity: 0.8, iri: 1 }));
    label.position.set(0, 0.9, 0.03);
    pivot.add(body, sample, label);
    pivot.position.z = i * 0.09;
    fan.add(pivot);
    return pivot;
  });
  fan.rotation.set(-0.2, 0.25, 0);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 6.2, 5.2, 1.04);
    },
    update({ time, progress }) {
      const open = still ? 0.8 : ease.out((progress - 0.1) / 0.5);
      slides.forEach((s, i) => {
        const t = i - (n - 1) / 2;
        s.rotation.z = -t * 0.3 * open;
        s.rotation.y = Math.sin(time * 0.4 * v.speed + i) * 0.04;
      });
      fan.rotation.y = 0.25 + Math.sin(time * 0.18) * 0.08;
    },
  };
};

export default factory;
