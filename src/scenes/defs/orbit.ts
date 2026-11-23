/**
 * Services hub: an orbit of the category motifs on three tilted rings.
 * Hovering or focusing a category row in the list (data-motif) brings its motif forward.
 * Motif glyphs are drawn from the same icon paths that are already in the page.
 */
import { THREE, color, glass, stageSet, fitToAspect, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

function glyphTexture(d: string, stroke: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.scale(128 / 24, 128 / 24);
  g.strokeStyle = stroke;
  g.lineWidth = 1.5;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.stroke(new Path2D(d));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const factory: SceneFactory = ({ still }) => {
  const { scene, camera } = stageSet(30, 9);
  const system = new THREE.Group();
  scene.add(system);
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-orbit-rows] [data-motif]'));
  const paths = rows.length ? rows.map((r) => r.querySelector('svg path')?.getAttribute('d') ?? 'M4 12h16') : Array.from({ length: 15 }, () => 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z');
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--white').trim() || 'white';
  const tints = [color('rose'), color('blush'), color('leaf')];
  const disc = new THREE.CircleGeometry(0.42, 40);
  const rim = new THREE.TorusGeometry(0.42, 0.035, 10, 48);
  const count = paths.length;
  const items = paths.map((d, i) => {
    const g = new THREE.Group();
    const ring = i % 3;
    const face = new THREE.Mesh(disc, new THREE.MeshBasicMaterial({ map: glyphTexture(d, ink), transparent: true, depthWrite: false }));
    const back = new THREE.Mesh(disc, glass({ tint: tints[ring], opacity: 0.75, iri: 1.6 }));
    back.position.z = -0.01;
    g.add(back, face, new THREE.Mesh(rim, glass({ tint: tints[ring], opacity: 1, iri: 2 })));
    system.add(g);
    return { g, ring, a: (Math.floor(i / 3) / Math.ceil(count / 3)) * Math.PI * 2 + ring * 0.7, k: 0 };
  });
  // the three orbit rings themselves
  const radii = [1.5, 2.3, 3.1];
  radii.forEach((r, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 120), glass({ tint: tints[i], opacity: 0.6 }));
    m.rotation.x = Math.PI / 2;
    system.add(m);
  });
  system.rotation.x = 1.0;

  let active = -1;
  const enter = (i: number) => () => (active = i);
  const leave = () => (active = -1);
  const handlers = rows.map((_, i) => enter(i));
  rows.forEach((r, i) => {
    r.addEventListener('pointerenter', handlers[i]);
    r.addEventListener('focusin', handlers[i]);
    r.addEventListener('pointerleave', leave);
    r.addEventListener('focusout', leave);
  });
  const up = new THREE.Vector3();

  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 7, 5.4, 1.04);
      system.rotation.x = aspect < 0.9 ? 1.25 : 1.0; // flatter rings on tall phones
    },
    update({ time, dt }) {
      const slow = active >= 0 ? 0.15 : 1;
      items.forEach((it, i) => {
        it.a += dt * (0.1 + it.ring * 0.03) * slow * (still ? 0 : 1);
        it.k = ease.damp(it.k, i === active ? 1 : 0, 5, dt);
        const r = radii[it.ring] * (1 - it.k * 0.25);
        it.g.position.set(Math.cos(it.a) * r, it.k * 1.4, Math.sin(it.a) * r);
        it.g.scale.setScalar(1 + it.k * 0.9);
        // face the camera
        it.g.quaternion.copy(system.quaternion).invert();
        up.set(0, 0, 0);
      });
      system.rotation.z = Math.sin(time * 0.1) * 0.05;
    },
    dispose() {
      rows.forEach((r, i) => {
        r.removeEventListener('pointerenter', handlers[i]);
        r.removeEventListener('focusin', handlers[i]);
        r.removeEventListener('pointerleave', leave);
        r.removeEventListener('focusout', leave);
      });
    },
  };
};

export default factory;
