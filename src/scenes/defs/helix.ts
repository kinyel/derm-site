/** Aesthetic treatments: a collagen triple helix that twists tighter as you scroll. */
import { THREE, glass, tube, v3, stageSet, fitToAspect, variation, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, tier, still }) => {
  const { scene, camera } = stageSet(30, 10);
  const v = variation(params);
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  const mats = v.tints.map((t, i) => glass({ tint: t, opacity: 0.95, iri: 1.6 + i * 0.3 }));
  const strands = mats.map((m) => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m);
    group.add(mesh);
    return mesh;
  });
  const segs = tier === 2 ? 110 : 64;
  let built = -1;
  const build = (twist: number) => {
    strands.forEach((mesh, s) => {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 40; k++) {
        const t = k / 40;
        const a = t * twist * Math.PI * 2 + (s / 3) * Math.PI * 2;
        const rad = 0.62 - twist * 0.035; // tighter twist draws the strands together
        pts.push(v3(Math.cos(a) * rad, (t - 0.5) * 6.2, Math.sin(a) * rad));
      }
      mesh.geometry.dispose();
      mesh.geometry = tube(pts, 0.17, segs, 8);
    });
    built = twist;
  };
  group.rotation.z = 0.32;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 3.6, 6.6, 1.02);
    },
    update({ time, progress }) {
      const twist = 1.6 + (still ? 1.6 : ease.inOut(ease.clamp((progress - 0.1) / 0.6)) * 3.2);
      if (Math.abs(twist - built) > 0.03) build(twist);
      group.rotation.y = v.spin + time * 0.18 * v.speed;
    },
  };
};

export default factory;
