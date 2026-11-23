/** Hair and scalp: follicles growing coily hair strands on scroll. */
import { THREE, color, glass, tube, v3, stageSet, fitToAspect, variation, rng, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, tier, still }) => {
  const { scene, camera } = stageSet(30, 10);
  const v = variation(params);
  const r = rng(0.12 + v.seed);
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  // a curved band of scalp
  const scalp = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 2.4, 48, 1, true, Math.PI - 0.42, 0.84), glass({ tint: color('blush'), opacity: 0.5, iri: 1 }));
  scalp.rotation.x = Math.PI / 2;
  scalp.position.set(0, -8.3, 0);
  group.add(scalp);
  const n = tier === 2 ? 9 : 5;
  const bulbGeo = new THREE.SphereGeometry(0.16, 14, 10);
  const strands = Array.from({ length: n }, (_, i) => {
    const x = ((i + 0.5) / n - 0.5) * 4.6;
    const z = (r() - 0.5) * 1.2;
    const baseY = -2.3 - Math.abs(x) * 0.08;
    const turns = 5 + r() * 3;
    const rad = 0.17 + r() * 0.1;
    const height = 3.4 + r() * 1.1;
    const lean = (r() - 0.5) * 0.9;
    const pts: THREE.Vector3[] = [];
    const steps = Math.round(turns * 10);
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const a = t * turns * Math.PI * 2;
      pts.push(v3(x + lean * t * t + Math.cos(a) * rad * Math.min(1, t * 4), baseY + t * height, z + Math.sin(a) * rad * Math.min(1, t * 4)));
    }
    const mat = glass({ tint: v.tints[i % 3], opacity: 1, iri: 1.4 });
    group.add(new THREE.Mesh(tube(pts, 0.045, tier === 2 ? steps * 3 : steps * 2, 6), mat));
    const bulb = new THREE.Mesh(bulbGeo, glass({ tint: color('blush700'), opacity: 1, iri: 0.8 }));
    bulb.position.set(x, baseY - 0.05, z);
    group.add(bulb);
    return { mat, delay: r() * 0.35 };
  });
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 5.6, 6.2, 1.02);
      camera.position.y = 0.2;
    },
    update({ time, progress }) {
      const grow = still ? 0.85 : ease.clamp((progress - 0.08) / 0.55);
      strands.forEach((s) => (s.mat.uniforms.uReveal.value = ease.out(grow * 1.35 - s.delay)));
      group.rotation.y = v.spin * 0.04 + Math.sin(time * 0.25 * v.speed) * 0.18;
    },
  };
};

export default factory;
