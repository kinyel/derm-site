/** Men's and women's skin: rose and pink ribbons intertwining around one axis. */
import { THREE, color, glass, ribbonGeometry, v3, stageSet, fitToAspect, variation, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, tier, still }) => {
  const { scene, camera } = stageSet(30, 10);
  const v = variation(params);
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  const tones = [color('rose'), color('blush')];
  const mats = tones.map((t, i) => glass({ tint: t, opacity: 0.9, iri: 1.6 + i * 0.5 }));
  mats.forEach((m, s) => {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 48; k++) {
      const t = k / 48;
      const a = t * Math.PI * 2 * 2.4 + s * Math.PI;
      const rad = 0.75 * Math.sin(Math.PI * t) + 0.18;
      pts.push(v3(Math.cos(a) * rad, (t - 0.5) * 6.4, Math.sin(a) * rad));
    }
    const mesh = new THREE.Mesh(ribbonGeometry(pts, 0.62, tier === 2 ? 180 : 90, 1.2, (t) => 0.5 + Math.sin(Math.PI * t) * 0.5), m);
    mesh.frustumCulled = false;
    group.add(mesh);
  });
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6.8, 8), glass({ tint: color('leaf'), opacity: 0.8 }));
  group.add(axis);
  group.rotation.z = -0.22;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 3.6, 6.8, 1.02);
    },
    update({ time, progress }) {
      const k = still ? 1 : ease.out((progress - 0.05) / 0.4);
      mats.forEach((m, i) => (m.uniforms.uReveal.value = ease.clamp(k * 1.15 - i * 0.12)));
      group.rotation.y = v.spin + time * 0.22 * v.speed;
    },
  };
};

export default factory;
