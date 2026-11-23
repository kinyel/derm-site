/** Glass pin dropping once onto a stylised outline of the Island, then idling (home "Visit us"). */
import { THREE, color, glass, light, stageSet, fitToAspect, ease } from '../kit.ts';
import { islandGeometries, ONIRU } from '../map.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ tier, still }) => {
  const { scene, camera } = stageSet(30, 10);
  const map = new THREE.Group();
  scene.add(map);
  const land = glass({ tint: color('rose'), opacity: 0.75, iri: 1.3 });
  islandGeometries().forEach((g) => map.add(new THREE.Mesh(g, land)));
  map.rotation.x = -0.72;

  const pin = new THREE.Group();
  const pinMat = glass({ tint: color('blush'), opacity: 0.95, iri: 2.2, glow: 0.15 });
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), pinMat);
  headM.position.z = 0.95;
  const stem = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.75, 20), pinMat);
  stem.rotation.x = -Math.PI / 2;
  stem.position.z = 0.42;
  pin.add(headM, stem);
  pin.position.set(ONIRU.x, ONIRU.y, 0.14);
  map.add(pin);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 48), light(color('blush'), 0.8));
  ring.position.set(ONIRU.x, ONIRU.y, 0.17);
  if (tier === 2) map.add(ring);

  let t0 = -1;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 7.6, 2.9, 1.02);
    },
    update({ time, progress }) {
      // drop once when the stage is well inside the viewport
      if (t0 < 0 && (progress > 0.22 || still)) t0 = still ? -10 : time;
      const k = t0 < 0 && !still ? 0 : ease.out((time - t0) / 0.8);
      pin.position.z = 0.14 + (1 - k) * 2.6 + (k >= 1 ? Math.sin(time * 1.4) * 0.04 : 0);
      pin.visible = t0 >= 0 || still;
      const pulse = (time * 0.5) % 1;
      ring.scale.setScalar(1 + pulse * 2.4);
      (ring.material as THREE.MeshBasicMaterial).opacity = k >= 1 ? (1 - pulse) * 0.7 : 0;
      map.rotation.z = Math.sin(time * 0.15) * 0.05;
    },
  };
};

export default factory;
