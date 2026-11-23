/**
 * Melanocyte passing melanin granules along its dendrites to neighbouring skin cells
 * (home "Skin of colour"). Scrolling changes the pigment density.
 */
import { THREE, color, glass, tube, v3, stageSet, fitToAspect, rng } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ count, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const group = new THREE.Group();
  scene.add(group);
  const r = rng(0.63);

  const cell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 4), glass({ tint: color('blush'), opacity: 0.9, iri: 1.6, wobble: 0.08 }));
  group.add(cell);
  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), glass({ tint: color('blush700'), opacity: 1, iri: 0.6 }));
  group.add(nucleus);

  const N = 7;
  const curves: THREE.CatmullRomCurve3[] = [];
  const neighbours: THREE.ShaderMaterial[] = [];
  const kerGeo = new THREE.IcosahedronGeometry(0.62, 3);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + r() * 0.3;
    const len = 2.1 + r() * 0.5;
    const end = v3(Math.cos(a) * len, Math.sin(a) * len * 0.92, (r() - 0.5) * 0.8);
    const mid = v3(Math.cos(a + 0.25) * len * 0.5, Math.sin(a + 0.25) * len * 0.5, (r() - 0.5) * 0.5);
    const pts = [v3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0), mid, end];
    curves.push(new THREE.CatmullRomCurve3(pts));
    group.add(new THREE.Mesh(tube(pts, 0.05, 28, 6), glass({ tint: color('blush'), opacity: 0.85, iri: 1.2 })));
    const mat = glass({ tint: color('rose'), opacity: 0.6, iri: 1.4, wobble: 0.04 });
    const ker = new THREE.Mesh(kerGeo, mat);
    ker.position.copy(end).multiplyScalar(1.22);
    ker.scale.set(1, 0.82, 0.7);
    neighbours.push(mat);
    group.add(ker);
  }

  // granules: instanced, travelling along the dendrites and settling in the neighbours
  const total = count(520);
  const grains = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: color('blush700'), transparent: true, opacity: 0.95 }), total);
  const seeds = Array.from({ length: total }, () => ({ c: Math.floor(r() * N), ph: r(), sp: 0.05 + r() * 0.07, off: v3((r() - 0.5) * 0.5, (r() - 0.5) * 0.4, (r() - 0.5) * 0.4), s: 0.6 + r() * 0.9 }));
  group.add(grains);
  const m4 = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const baseTint = color('rose');
  const deepTint = color('blush700');

  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 7, 6.4, 1.02);
    },
    update({ time, progress }) {
      const density = still ? 0.7 : 0.2 + 0.8 * Math.min(1, Math.max(0, (progress - 0.15) / 0.6));
      const n = Math.floor(total * density);
      grains.count = n;
      for (let i = 0; i < n; i++) {
        const s = seeds[i];
        const t = (s.ph + time * s.sp) % 1;
        const along = Math.min(1, t * 1.35);
        curves[s.c].getPoint(along, p);
        const settle = Math.max(0, (t * 1.35 - 1) / 0.35); // past the tip: drift into the neighbouring cell
        p.multiplyScalar(1 + settle * 0.22).addScaledVector(s.off, settle);
        sc.setScalar(s.s * (1 - settle * 0.4));
        m4.compose(p, q, sc);
        grains.setMatrixAt(i, m4);
      }
      grains.instanceMatrix.needsUpdate = true;
      neighbours.forEach((m) => (m.uniforms.uTint.value as THREE.Color).copy(baseTint).lerp(deepTint, density * 0.45));
      group.rotation.z = Math.sin(time * 0.12) * 0.08;
      group.rotation.y = Math.sin(time * 0.17) * 0.18;
      nucleus.scale.setScalar(1 + Math.sin(time * 0.9) * 0.04);
    },
  };
};

export default factory;
