/**
 * Glass face-and-body figure with five hotspots (home "Find your concern").
 * Each hotspot mirrors an HTML link (a[data-hotspot]) in the same section: hovering either one
 * highlights the other, and clicking a hotspot follows the real link (rule 4.1).
 */
import { THREE, color, glass, light, stageSet, fitToAspect, ease, sectionOf } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const SPOTS: { id: string; pos: [number, number, number] }[] = [
  { id: 'scalp', pos: [0, 3.05, 0.25] },
  { id: 'face', pos: [0, 2.5, 0.5] },
  { id: 'body', pos: [0, 1.0, 0.5] },
  { id: 'hands-nails', pos: [1.32, -0.35, 0.2] },
  { id: 'feet', pos: [0.36, -3.0, 0.4] },
];

const factory: SceneFactory = ({ stage, still }) => {
  const { scene, camera } = stageSet(30, 12);
  const fig = new THREE.Group();
  scene.add(fig);
  const body = glass({ tint: color('rose'), opacity: 0.7, iri: 1.6 });
  const part = (geo: THREE.BufferGeometry, x: number, y: number, z = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, body);
    m.position.set(x, y, z);
    m.rotation.z = rz;
    fig.add(m);
    return m;
  };
  // head, neck, torso (lathe), arms, legs, feet: an abstract mannequin, no anatomy
  const head = part(new THREE.SphereGeometry(0.5, 32, 24), 0, 2.6);
  head.scale.set(0.86, 1.06, 0.9);
  part(new THREE.CylinderGeometry(0.16, 0.2, 0.36, 16), 0, 2.0);
  const profile = [
    [0.0, 1.85], [0.52, 1.8], [0.74, 1.6], [0.7, 1.1], [0.56, 0.55], [0.5, 0.2], [0.6, -0.15], [0.62, -0.45], [0.3, -0.62], [0.0, -0.64],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const torso = part(new THREE.LatheGeometry(profile, 32), 0, 0);
  torso.scale.z = 0.62;
  const arm = new THREE.CapsuleGeometry(0.14, 1.75, 6, 12);
  part(arm, -1.0, 0.72, 0, -0.22);
  part(arm, 1.0, 0.72, 0, 0.22);
  const hand = new THREE.SphereGeometry(0.17, 14, 10);
  part(hand, -1.28, -0.34);
  part(hand, 1.28, -0.34);
  const leg = new THREE.CapsuleGeometry(0.2, 2.0, 6, 12);
  part(leg, -0.32, -1.72, 0, -0.03);
  part(leg, 0.32, -1.72, 0, 0.03);
  const foot = new THREE.SphereGeometry(0.22, 14, 10);
  const f1 = part(foot, -0.36, -3.0, 0.14);
  const f2 = part(foot, 0.36, -3.0, 0.14);
  f1.scale.set(0.8, 0.5, 1.5);
  f2.scale.set(0.8, 0.5, 1.5);

  // hotspots: a bright core, a pulsing ring and a larger invisible hit target
  const hits: THREE.Mesh[] = [];
  const spots = SPOTS.map((s) => {
    const g = new THREE.Group();
    g.position.set(...s.pos);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), light(color('white'), 0.95));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 40), light(color('blush'), 0.9));
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    hit.userData.id = s.id;
    g.add(core, ring, hit);
    fig.add(g);
    hits.push(hit);
    return { ...s, g, ring, k: 0 };
  });

  const section = sectionOf(stage);
  const areas = Array.from(section.querySelectorAll<HTMLElement>('[data-area]'));
  let active: string | null = null;
  const setActive = (id: string | null) => {
    if (id === active) return;
    active = id;
    areas.forEach((a) => a.classList.toggle('is-active', a.dataset.area === id));
  };
  const onEnter = (e: Event) => setActive((e.currentTarget as HTMLElement).dataset.area ?? null);
  const onLeave = () => setActive(null);
  areas.forEach((a) => {
    a.addEventListener('pointerenter', onEnter);
    a.addEventListener('focusin', onEnter);
    a.addEventListener('pointerleave', onLeave);
    a.addEventListener('focusout', onLeave);
  });
  const leaveStage = () => setActive(null);
  stage.addEventListener('pointerleave', leaveStage);

  const ray = new THREE.Raycaster();
  let turn = 0;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 3.6, 7.2, 1.04);
    },
    pick(ndc) {
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(hits, false)[0];
      const id = (hit?.object.userData.id as string | undefined) ?? null;
      setActive(id);
      return id ? `/conditions/#area-${id}` : null;
    },
    update({ time, dt }) {
      const idx = spots.findIndex((s) => s.id === active);
      const target = idx < 0 ? Math.sin(time * 0.3) * 0.18 : (spots[idx].pos[0] > 0.5 ? -0.21 : 0.21) * (idx === 3 ? 1 : 0.4);
      turn = ease.damp(turn, still ? 0.15 : target, 3, dt);
      fig.rotation.y = turn;
      spots.forEach((s, i) => {
        s.k = ease.damp(s.k, s.id === active ? 1 : 0, 6, dt);
        const pulse = 1 + Math.sin(time * 2 + i * 1.3) * 0.12;
        s.ring.scale.setScalar(pulse * (1 + s.k * 0.9));
        (s.ring.material as THREE.MeshBasicMaterial).opacity = 0.55 + s.k * 0.45;
        s.g.quaternion.copy(camera.quaternion); // rings always face the viewer
        s.g.rotation.y -= fig.rotation.y;
      });
    },
    dispose() {
      areas.forEach((a) => {
        a.removeEventListener('pointerenter', onEnter);
        a.removeEventListener('focusin', onEnter);
        a.removeEventListener('pointerleave', onLeave);
        a.removeEventListener('focusout', onLeave);
      });
      stage.removeEventListener('pointerleave', leaveStage);
    },
  };
};

export default factory;
