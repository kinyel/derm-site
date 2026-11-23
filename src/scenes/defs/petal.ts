/** 404: a single drifting glass petal. */
import { THREE, color, glass, glowMaterial, stageSet, fitToAspect } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = () => {
  const { scene, camera } = stageSet(30, 7);
  const geo = new THREE.SphereGeometry(1, 36, 22);
  geo.scale(0.7, 0.1, 1.5);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + Math.pow(pos.getZ(i), 2) * 0.16); // gentle curl
  geo.computeVertexNormals();
  const petal = new THREE.Mesh(geo, glass({ tint: color('blush'), opacity: 0.9, iri: 2.4 }));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), glowMaterial(color('rose'), 0.2));
  glow.position.z = -2;
  scene.add(glow, petal);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 4, 4, 1.05);
    },
    update({ time }) {
      petal.position.set(Math.sin(time * 0.3) * 0.5, Math.sin(time * 0.45) * 0.35, 0);
      petal.rotation.set(0.5 + Math.sin(time * 0.35) * 0.5, time * 0.25, Math.sin(time * 0.28) * 0.4);
    },
  };
};

export default factory;
