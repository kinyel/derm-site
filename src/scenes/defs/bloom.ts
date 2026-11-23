/** About: a bloom of 20 glass petals that unfold one by one on scroll, one per year of experience. */
import { THREE, color, glass, stageSet, fitToAspect, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ still }) => {
  const { scene, camera } = stageSet(30, 9);
  const flower = new THREE.Group();
  scene.add(flower);
  const geo = new THREE.SphereGeometry(1, 24, 14);
  geo.scale(0.34, 0.06, 1);
  geo.translate(0, 0, 1); // hinge at the base
  const tints = [color('blush'), color('rose'), color('leaf'), color('white')];
  const rings = [5, 7, 8];
  const petals: { pivot: THREE.Group; ring: number; i: number }[] = [];
  let n = 0;
  rings.forEach((count, ring) => {
    for (let k = 0; k < count; k++, n++) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (k / count) * Math.PI * 2 + ring * 0.4;
      const hinge = new THREE.Group();
      const petal = new THREE.Mesh(geo, glass({ tint: tints[n % 4], opacity: 0.85, iri: 1.8 }));
      petal.scale.setScalar(0.72 + ring * 0.3);
      hinge.add(petal);
      pivot.add(hinge);
      flower.add(pivot);
      petals.push({ pivot: hinge, ring, i: n });
    }
  });
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), glass({ tint: color('blush'), opacity: 1, iri: 2.4, glow: 0.2 }));
  flower.add(heart);
  flower.rotation.x = 0.95;

  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 4.6, 4.2, 1.06);
    },
    update({ time, progress }) {
      const p = still ? 0.8 : ease.clamp((progress - 0.12) / 0.55);
      petals.forEach((pt) => {
        const open = ease.out(p * 20 - pt.i + 1); // one after another
        const closed = -1.35 + pt.ring * 0.08;
        const opened = -0.62 + pt.ring * 0.26;
        pt.pivot.rotation.x = closed + (opened - closed) * open + Math.sin(time * 0.6 + pt.i) * 0.015;
      });
      flower.rotation.y = time * 0.06;
    },
  };
};

export default factory;
