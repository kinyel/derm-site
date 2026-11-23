/** Nail care: a layered keratin nail-plate cross-section rotating on scroll. */
import { THREE, color, glass, stageSet, fitToAspect, variation } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  const tints = [color('white'), v.tints[0], color('white'), v.tints[1], color('blush')];
  // five curved plates stacked like the layers of a nail, then the nail bed underneath
  tints.forEach((t, i) => {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.2 - i * 0.09, 2.2 - i * 0.09, 3.2 - i * 0.12, 48, 1, true, -0.75, 1.5), glass({ tint: t, opacity: 0.7 - i * 0.06, iri: 2.4 - i * 0.3 }));
    plate.position.z = -2.0 + i * 0.02;
    group.add(plate);
  });
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 3.0, 48, 1, false, -0.7, 1.4), glass({ tint: color('blush'), opacity: 0.55, iri: 0.8 }));
  bed.position.z = -1.95;
  group.add(bed);
  const lunula = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), glass({ tint: color('white'), opacity: 0.8, iri: 1.2 }));
  lunula.scale.set(1, 0.5, 0.12);
  lunula.position.set(0, -1.5, 0.27);
  group.add(lunula);
  group.rotation.x = -0.25;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 4.4, 4.4, 1.06);
    },
    update({ time, progress }) {
      group.rotation.y = (still ? 0.5 : (progress - 0.5) * 2.2) + v.spin * 0.03 + Math.sin(time * 0.3 * v.speed) * 0.06;
      group.rotation.x = -0.25 + Math.sin(time * 0.22) * 0.04;
    },
  };
};

export default factory;
