/** Floating glass speech bubbles drifting slowly beside the real question links (home "Learn"). */
import { THREE, color, glass, stageSet, fitToAspect, rng } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ tier }) => {
  const { scene, camera } = stageSet(30, 9);
  const r = rng(0.48);
  const tints = [color('rose'), color('blush'), color('leaf'), color('white'), color('blush')];
  const body = new THREE.SphereGeometry(1, 28, 20);
  const tail = new THREE.ConeGeometry(0.22, 0.5, 14);
  const bubbles = Array.from({ length: tier === 2 ? 5 : 3 }, (_, i) => {
    const g = new THREE.Group();
    const mat = glass({ tint: tints[i], opacity: 0.8, iri: 1.8 });
    const b = new THREE.Mesh(body, mat);
    b.scale.set(1, 0.66, 0.42);
    const t = new THREE.Mesh(tail, mat);
    t.position.set(i % 2 ? 0.45 : -0.45, -0.68, 0);
    t.rotation.z = i % 2 ? -2.6 : 2.6;
    g.add(b, t);
    const s = 0.55 + r() * 0.5;
    g.scale.setScalar(s);
    const home = new THREE.Vector3((r() - 0.5) * 4.2, (r() - 0.5) * 2.6, (r() - 0.5) * 1.5);
    scene.add(g);
    return { g, home, ph: r() * 6.28, sp: 0.25 + r() * 0.2 };
  });
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 6, 4.2, 1.05);
    },
    update({ time }) {
      bubbles.forEach((b) => {
        b.g.position.set(b.home.x + Math.sin(time * b.sp + b.ph) * 0.18, b.home.y + Math.cos(time * b.sp * 0.8 + b.ph) * 0.22, b.home.z);
        b.g.rotation.set(Math.sin(time * b.sp * 0.6 + b.ph) * 0.12, Math.sin(time * b.sp * 0.5) * 0.3, Math.sin(time * b.sp * 0.7 + b.ph) * 0.06);
      });
    },
  };
};

export default factory;
