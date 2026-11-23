/** Wound care: a gap in a tissue mesh knitting closed as you scroll. */
import { THREE, color, stageSet, fitToAspect, variation, ease, onLightSurface, dotTexture } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, tier, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const group = new THREE.Group();
  group.scale.setScalar(v.scale);
  scene.add(group);
  const N = tier === 2 ? 17 : 11;
  const size = 5;
  const nodes: { x: number; y: number }[] = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) nodes.push({ x: (i / (N - 1) - 0.5) * size, y: (j / (N - 1) - 0.5) * size });
  const links: [number, number][] = [];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = j * N + i;
      if (i < N - 1) links.push([a, a + 1]);
      if (j < N - 1) links.push([a, a + N]);
    }
  const pos = new Float32Array(links.length * 6);
  const col = new Float32Array(links.length * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: onLightSurface() ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false }));
  group.add(lines);
  const dots = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({ color: color('white'), map: dotTexture(), size: 0.11, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false }),
  );
  const dotPos = new Float32Array(nodes.length * 3);
  dots.geometry.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  group.add(dots);
  const calm = v.tints[0];
  const sore = color('blush');
  const moved = nodes.map(() => new THREE.Vector3());
  const heat = new Float32Array(nodes.length);
  group.rotation.set(-0.55, 0.3 + v.spin * 0.03, 0);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 5.8, 4.4, 1.02);
    },
    update({ time, progress }) {
      const open = still ? 0.45 : 1 - ease.inOut(ease.clamp((progress - 0.12) / 0.55));
      const R = 1.5 * open; // radius of the gap
      nodes.forEach((n, i) => {
        const d = Math.hypot(n.x * 0.75, n.y) || 0.001; // an oval wound
        const push = d < R ? R - d : 0;
        const k = push / d;
        const wob = Math.sin(time * 0.8 * v.speed + n.x * 2 + n.y) * 0.03;
        moved[i].set(n.x + n.x * k, n.y + n.y * k, -push * 0.35 + wob);
        heat[i] = Math.min(1, Math.max(0, (R * 1.5 - d) / (R * 1.5 || 1))) * open;
        dotPos.set([moved[i].x, moved[i].y, moved[i].z], i * 3);
      });
      links.forEach(([a, b], i) => {
        pos.set([moved[a].x, moved[a].y, moved[a].z, moved[b].x, moved[b].y, moved[b].z], i * 6);
        const ca = heat[a];
        const cb = heat[b];
        col.set([calm.r + (sore.r - calm.r) * ca, calm.g + (sore.g - calm.g) * ca, calm.b + (sore.b - calm.b) * ca, calm.r + (sore.r - calm.r) * cb, calm.g + (sore.g - calm.g) * cb, calm.b + (sore.b - calm.b) * cb], i * 6);
      });
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      dots.geometry.attributes.position.needsUpdate = true;
      group.rotation.y = 0.3 + v.spin * 0.03 + Math.sin(time * 0.2) * 0.06;
    },
  };
};

export default factory;
