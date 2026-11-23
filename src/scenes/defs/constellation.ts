/** FAQ: a constellation in which each question is a point of light, clustered by topic. */
import { THREE, color, stageSet, fitToAspect, rng, ease, onLightSurface, dotTexture } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const groups = Math.max(3, Math.min(8, Number(params.groups ?? 6)));
  const r = rng(0.44);
  const tones = [color('rose'), color('blush'), color('leaf')];
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main .faq'));
  const pts: number[] = [];
  const cols: number[] = [];
  const cluster: number[] = [];
  const linkPos: number[] = [];
  const linkCluster: number[] = [];
  for (let g = 0; g < groups; g++) {
    const a = (g / groups) * Math.PI * 2 + 0.4;
    const cx = Math.cos(a) * 2.1;
    const cy = Math.sin(a) * 1.7;
    const count = sections[g]?.querySelectorAll('details').length ?? 5;
    const local: THREE.Vector3[] = [];
    for (let i = 0; i < Math.max(3, count); i++) {
      const p = new THREE.Vector3(cx + (r() - 0.5) * 1.5, cy + (r() - 0.5) * 1.3, (r() - 0.5) * 1.2);
      local.push(p);
      pts.push(p.x, p.y, p.z);
      cols.push(1, 1, 1);
      cluster.push(g);
    }
    for (let i = 1; i < local.length; i++) {
      linkPos.push(local[i - 1].x, local[i - 1].y, local[i - 1].z, local[i].x, local[i].y, local[i].z);
      linkCluster.push(g);
    }
  }
  const blending = onLightSurface() ? THREE.NormalBlending : THREE.AdditiveBlending;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.26, map: dotTexture(), vertexColors: true, transparent: true, opacity: 0.95, sizeAttenuation: true, depthWrite: false, blending }));
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPos, 3));
  linkGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(linkPos.length).fill(1), 3));
  const links = new THREE.LineSegments(linkGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, blending }));
  const group = new THREE.Group();
  group.add(links, stars);
  scene.add(group);

  // the cluster whose FAQ group is on screen brightens
  let active = 0;
  const io = new IntersectionObserver(
    (entries) => {
      const hit = entries.filter((e) => e.isIntersecting).pop();
      if (hit) active = Math.max(0, sections.indexOf(hit.target as HTMLElement)) % groups;
    },
    { rootMargin: '-35% 0px -35% 0px' },
  );
  sections.forEach((s) => io.observe(s));
  const level = new Array(groups).fill(0.35);
  const c = new THREE.Color();

  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 6.4, 5.2, 1.02);
    },
    update({ time, dt }) {
      const current = sections.length ? active : Math.floor(time / 3) % groups;
      for (let g = 0; g < groups; g++) level[g] = ease.damp(level[g], g === current || still ? 1 : 0.32, 4, dt);
      const colAttr = geo.attributes.color as THREE.BufferAttribute;
      cluster.forEach((g, i) => {
        c.copy(tones[g % 3]).multiplyScalar(level[g] * (0.85 + Math.sin(time * 2 + i) * 0.15));
        colAttr.setXYZ(i, c.r, c.g, c.b);
      });
      colAttr.needsUpdate = true;
      const lc = linkGeo.attributes.color as THREE.BufferAttribute;
      linkCluster.forEach((g, i) => {
        c.copy(tones[g % 3]).multiplyScalar(level[g] * 0.6);
        lc.setXYZ(i * 2, c.r, c.g, c.b);
        lc.setXYZ(i * 2 + 1, c.r, c.g, c.b);
      });
      lc.needsUpdate = true;
      group.rotation.y = Math.sin(time * 0.12) * 0.25;
      group.rotation.x = Math.sin(time * 0.1) * 0.1;
    },
    dispose() {
      io.disconnect();
    },
  };
};

export default factory;
