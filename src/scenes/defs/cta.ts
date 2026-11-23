/** Closing CTA: the hero's ribbons return and curve around the button area (bookend to the hero). */
import { THREE, color, glass, glowMaterial, ribbonGeometry, frustumAt, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const PATHS: [number, number, number][][] = [
  [[-1.3, 0.62, -1.0], [-0.5, 0.78, -0.8], [0.25, 0.34, -0.6], [0.14, -0.36, -0.4], [-0.6, -0.62, -0.3], [-1.3, -0.3, -0.3]],
  [[1.3, 0.8, -1.2], [0.62, 0.4, -1.0], [0.34, -0.2, -0.8], [0.72, -0.76, -0.6], [1.3, -0.9, -0.5]],
  [[-1.3, -0.92, -0.6], [-0.3, -0.84, -0.5], [0.5, -0.56, -0.4], [1.3, -0.2, -0.4]],
];

const factory: SceneFactory = ({ tier, still }) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.z = 7;
  const tints = [color('blush'), color('white'), color('rose')];
  const n = tier === 2 ? 3 : 2;
  const mats = Array.from({ length: n }, (_, i) => glass({ tint: tints[i], opacity: 0.75, iri: 1.6 + i * 0.3 }));
  const meshes = mats.map((m) => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMaterial(color('blush'), 0.42));
  glow.position.z = -3;
  scene.add(glow);
  const group = scene;

  return {
    scene,
    camera,
    resize(aspect) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const { hw, hh } = frustumAt(camera);
      meshes.forEach((mesh, i) => {
        mesh.geometry.dispose();
        mesh.geometry = ribbonGeometry(
          PATHS[i].map((p) => new THREE.Vector3(p[0] * hw, p[1] * hh, p[2])),
          (0.3 - i * 0.05) * Math.min(hw, hh * 1.5),
          tier === 2 ? 120 : 60,
          0.4 + i * 0.25,
        );
      });
      glow.scale.setScalar(Math.max(hw, hh) * 2.4);
      glow.position.set(hw * 0.5, hh * 0.2, -3);
    },
    update({ time, progress }) {
      const k = still ? 1 : ease.out(progress * 2.4);
      mats.forEach((m, i) => (m.uniforms.uReveal.value = ease.clamp(k * 1.2 - i * 0.1)));
      group.rotation.z = Math.sin(time * 0.1) * 0.01;
    },
  };
};

export default factory;
