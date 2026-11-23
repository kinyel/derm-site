/** Laser and light: a beam refracting through a glass prism into rose, pink and leaf beams. */
import { THREE, color, glass, light, stageSet, fitToAspect, variation, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  const prism = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 1.5, 3), glass({ tint: color('white'), opacity: 0.6, iri: 3 }));
  prism.rotation.x = Math.PI / 2;
  prism.rotation.y = Math.PI / 6;
  group.add(prism);
  const beamGeo = new THREE.PlaneGeometry(1, 1);
  beamGeo.translate(0.5, 0, 0); // grow from the start point
  const beam = (tone: THREE.Color, opacity: number) => {
    const m = new THREE.Mesh(beamGeo, light(tone, opacity));
    group.add(m);
    return m;
  };
  const incoming = beam(color('white'), 0.9);
  incoming.position.set(-3.6, -0.25, 0);
  incoming.scale.set(3.2, 0.06, 1);
  incoming.rotation.z = 0.08;
  const outs = [color('rose'), color('blush'), color('leaf')].map((c) => {
    const m = beam(c, 0.85);
    m.position.set(0.45, 0.02, 0);
    return m;
  });
  const glows = outs.map((o) => {
    const g = beam((o.material as THREE.MeshBasicMaterial).color, 0.18);
    g.position.copy(o.position);
    return g;
  });
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 7.4, 4.6, 1.02);
    },
    update({ time, progress }) {
      const spread = 0.08 + (still ? 0.2 : ease.clamp((progress - 0.1) / 0.6) * 0.3);
      outs.forEach((o, i) => {
        const a = (i - 1) * spread - 0.14 + Math.sin(time * 0.5 * v.speed + i) * 0.006;
        o.rotation.z = a;
        o.scale.set(3.6, 0.05 + i * 0.008, 1);
        glows[i].rotation.z = a;
        glows[i].scale.set(3.6, 0.26, 1);
      });
      prism.rotation.z = Math.sin(time * 0.3 * v.speed) * 0.05 + v.spin * 0.02;
      (incoming.material as THREE.MeshBasicMaterial).opacity = 0.8 + Math.sin(time * 1.3) * 0.1;
    },
  };
};

export default factory;
