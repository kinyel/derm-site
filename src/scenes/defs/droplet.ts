/** Iridescent droplet that morphs gently each time a question opens (FAQ sections). */
import { THREE, color, glass, stageSet, fitToAspect, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ tier, still }) => {
  const { scene, camera } = stageSet(30, 6);
  const mat = glass({ tint: color('rose'), opacity: 0.9, iri: 2.6, wobble: 0.1 });
  const drop = new THREE.Mesh(new THREE.IcosahedronGeometry(1, tier === 2 ? 6 : 4), mat);
  scene.add(drop);
  let kick = still ? 0.35 : 0;
  // <details> toggle events do not bubble: listen in the capture phase for the whole document
  const onToggle = (e: Event) => {
    if ((e.target as HTMLElement).matches?.('details.accordion')) kick = 1;
  };
  document.addEventListener('toggle', onToggle, true);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 2.9, 2.9, 1.1);
    },
    update({ time, dt }) {
      kick = ease.damp(kick, 0, 1.6, dt);
      mat.uniforms.uWobble.value = 0.08 + kick * 0.3;
      drop.rotation.y = time * 0.15;
      drop.rotation.x = Math.sin(time * 0.3) * 0.2;
      drop.scale.setScalar(1 + kick * 0.06);
    },
    dispose() {
      document.removeEventListener('toggle', onToggle, true);
    },
  };
};

export default factory;
