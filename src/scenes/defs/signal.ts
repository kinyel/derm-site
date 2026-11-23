/** Contact: signal ripples spreading from the call, WhatsApp and email cards (which sit above this stage). */
import { THREE, stageSet, shaderPlane, frustumAt } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const FRAG = /* glsl */ `
uniform vec2 uSrc[3]; uniform float uAspect;
void main(){
  vec3 col = vec3(0.0); float a = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 d = (vUv - uSrc[i]) * vec2(uAspect, 1.0);
    float r = length(d);
    float wave = sin(r * 26.0 - uTime * 1.6 - float(i) * 2.1);
    float ring = smoothstep(0.86, 1.0, wave) * exp(-r * 2.6);
    vec3 tone = i == 0 ? uA : (i == 1 ? uC : uB);
    col += tone * ring; a += ring;
  }
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * 0.55);
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ stage }) => {
  const { scene, camera } = stageSet(30, 5);
  const src = [new THREE.Vector2(0.2, 0.5), new THREE.Vector2(0.5, 0.5), new THREE.Vector2(0.8, 0.5)];
  const aspectU = { value: 3 };
  const plane = shaderPlane(1, 1, FRAG, { uSrc: { value: src }, uAspect: aspectU }, { additive: true });
  scene.add(plane);
  const host = stage.parentElement ?? stage;
  return {
    scene,
    camera,
    resize(aspect) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const { hw, hh } = frustumAt(camera);
      plane.scale.set(hw * 2, hh * 2, 1);
      aspectU.value = aspect;
      // centre each ripple on its card
      const sr = stage.getBoundingClientRect();
      Array.from(host.querySelectorAll<HTMLElement>('[data-signal-source]'))
        .slice(0, 3)
        .forEach((el, i) => {
          const r = el.getBoundingClientRect();
          src[i].set((r.left + r.width / 2 - sr.left) / sr.width, 1 - (r.top + r.height / 2 - sr.top) / sr.height);
        });
    },
    update() {},
  };
};

export default factory;
