/**
 * Visit path (home "Your visit"): a glass path through five nodes; a light orb travels it,
 * scrubbed by scroll, and each node lights as its HTML step is reached.
 * Node positions are read from the real step elements, so path and steps always line up.
 */
import { THREE, color, glass, light, tube, v3, stageSet, ease, sectionOf, frustumAt } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ stage, still }) => {
  const { scene, camera } = stageSet(20, 10);
  const section = sectionOf(stage);
  const steps = Array.from(section.querySelectorAll<HTMLElement>('[data-step]'));
  const n = Math.max(steps.length, 2);
  const nodeGeo = new THREE.SphereGeometry(1, 20, 14);
  const nodes = Array.from({ length: n }, () => {
    const m = new THREE.Mesh(nodeGeo, glass({ tint: color('rose'), opacity: 0.95, iri: 1.8 }));
    scene.add(m);
    return { m, lit: 0 };
  });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), light(color('white'), 0.95));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), light(color('blush'), 0.35));
  scene.add(orb, halo);
  let line: THREE.Mesh | undefined;
  let pts: THREE.Vector3[] = [];
  let unit = 0.2;

  return {
    scene,
    camera,
    resize(aspect, width, height) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const { hw, hh } = frustumAt(camera);
      const sr = stage.getBoundingClientRect();
      const vertical = height > width;
      // world position of each step's number circle (44px circle at the start of each step)
      pts = steps.map((el) => {
        const r = el.getBoundingClientRect();
        const cx = vertical ? 0.5 : (r.left + 22 - sr.left) / sr.width;
        const cy = vertical ? (r.top + 22 - sr.top) / sr.height : 0.5;
        return v3((cx * 2 - 1) * hw, -(cy * 2 - 1) * hh, 0);
      });
      if (pts.length < 2) pts = [v3(-hw * 0.9, 0, 0), v3(hw * 0.9, 0, 0)];
      unit = (vertical ? hw : hh) * 0.5;
      if (line) {
        scene.remove(line);
        line.geometry.dispose();
      }
      line = new THREE.Mesh(tube(pts, unit * 0.16, 80, 8), glass({ tint: color('rose'), opacity: 0.55, iri: 1.2 }));
      line.renderOrder = -1;
      scene.add(line);
      nodes.forEach((nd, i) => nd.m.position.copy(pts[Math.min(i, pts.length - 1)]));
    },
    update({ progress, dt, time }) {
      if (!pts.length) return;
      const t = still ? 0.55 : ease.clamp((progress - 0.22) / 0.42);
      const f = t * (pts.length - 1);
      const i = Math.min(Math.floor(f), pts.length - 2);
      orb.position.lerpVectors(pts[i], pts[i + 1], ease.inOut(f - i));
      halo.position.copy(orb.position);
      orb.scale.setScalar(unit * 0.5);
      halo.scale.setScalar(unit * (1.25 + Math.sin(time * 2) * 0.1));
      nodes.forEach((nd, k) => {
        const on = f >= k - 0.05 ? 1 : 0;
        nd.lit = ease.damp(nd.lit, on, 6, dt);
        nd.m.scale.setScalar(unit * (0.62 + nd.lit * 0.28));
        (nd.m.material as THREE.ShaderMaterial).uniforms.uGlow.value = nd.lit * 0.6;
        steps[k]?.classList.toggle('is-reached', on === 1);
      });
    },
  };
};

export default factory;
