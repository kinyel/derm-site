/** Skin surgery: a curved thread stitching a soft seam closed as you scroll. */
import { THREE, color, glass, tube, v3, stageSet, fitToAspect, variation, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  const slab = new THREE.CapsuleGeometry(0.55, 4.6, 8, 20);
  slab.rotateZ(Math.PI / 2);
  const upper = new THREE.Mesh(slab, glass({ tint: v.tints[1], opacity: 0.7, iri: 1.2 }));
  const lower = new THREE.Mesh(slab, glass({ tint: v.tints[0], opacity: 0.7, iri: 1.2 }));
  group.add(upper, lower);
  // the thread loops over the seam: up, across, down, along
  const pts: THREE.Vector3[] = [];
  const stitches = 7;
  for (let i = 0; i < stitches; i++) {
    const x = (i / (stitches - 1) - 0.5) * 4.4;
    pts.push(v3(x - 0.16, -0.62, 0.5), v3(x - 0.05, 0, 0.78), v3(x + 0.06, 0.62, 0.5), v3(x + 0.2, 0.2, -0.3), v3(x + 0.34, -0.5, -0.2));
  }
  const threadMat = glass({ tint: color('white'), opacity: 1, iri: 1, glow: 0.15 });
  group.add(new THREE.Mesh(tube(pts, 0.035, 320, 6), threadMat));
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.7, 10), glass({ tint: color('white'), opacity: 1, iri: 2.6 }));
  group.add(needle);
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const tip = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  group.rotation.set(-0.5, 0.35 + v.spin * 0.03, 0.08);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 6.2, 3.6, 1.04);
    },
    update({ time, progress }) {
      const k = still ? 0.62 : ease.clamp((progress - 0.12) / 0.55);
      threadMat.uniforms.uReveal.value = k;
      const gap = 0.5 - k * 0.16; // the seam draws closed
      upper.position.y = gap + 0.42;
      lower.position.y = -gap - 0.42;
      curve.getPoint(Math.min(k, 0.999), tip);
      curve.getPoint(Math.min(k + 0.01, 1), ahead);
      needle.position.copy(tip);
      needle.lookAt(group.localToWorld(ahead.clone()));
      needle.rotateX(Math.PI / 2);
      needle.visible = k > 0.01 && k < 0.99;
      group.rotation.y = 0.35 + v.spin * 0.03 + Math.sin(time * 0.25 * v.speed) * 0.06;
    },
  };
};

export default factory;
