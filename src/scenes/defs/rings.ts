/** Your visit: timeline rings, concentric glass rings rotating into alignment, one per stage. */
import { THREE, color, glass, stageSet, fitToAspect, rng, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ still }) => {
  const { scene, camera } = stageSet(30, 9);
  const r = rng(0.91);
  const tints = [color('rose'), color('blush'), color('leaf'), color('white'), color('blush')];
  const identity = new THREE.Quaternion();
  const rings = tints.map((t, i) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.62 + i * 0.44, 0.07, 14, 96), glass({ tint: t, opacity: 1, iri: 2 + i * 0.2 }));
    const start = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 3, (r() - 0.5) * 3, r() * 3));
    scene.add(mesh);
    return { mesh, start };
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), glass({ tint: color('blush'), opacity: 1, iri: 2.4, glow: 0.25 }));
  scene.add(core);
  const holder = scene;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 5.2, 5.2, 1.06);
    },
    update({ time, progress }) {
      const p = still ? 0.7 : ease.clamp((progress - 0.1) / 0.55);
      rings.forEach((ring, i) => {
        const k = ease.inOut(ease.clamp(p * 5 - i)); // rings settle one after another
        ring.mesh.quaternion.copy(ring.start).slerp(identity, k);
        ring.mesh.rotateZ(time * 0.1 * (i % 2 ? 1 : -1) * (1 - k * 0.7));
        (ring.mesh.material as THREE.ShaderMaterial).uniforms.uGlow.value = k * 0.25;
      });
      holder.rotation.x = -0.5 + Math.sin(time * 0.2) * 0.05;
      holder.rotation.y = 0.35 + Math.sin(time * 0.16) * 0.1;
    },
  };
};

export default factory;
