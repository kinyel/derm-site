/**
 * Skin cross-section (home "What we treat"): epidermis, dermis, fat, follicle, sweat gland,
 * nail edge, blood vessels. The active pillar's layer glows and the model turns to it.
 * Pillar rows in the DOM carry data-pillar="<layer>"; hover, focus or scroll sets the active one.
 */
import { THREE, color, glass, light, tube, v3, stageSet, fitToAspect, ease, sectionOf, rng } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const TURN: Record<string, number> = { surface: 0.15, barrier: -0.1, epidermis: 0.35, melanocytes: -0.35, follicle: 0.6, dermis: -0.55, fat: 0.3, vessels: -0.7 };

const factory: SceneFactory = ({ stage, tier, count, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const model = new THREE.Group();
  scene.add(model);
  const parts: Record<string, THREE.ShaderMaterial[]> = {};
  const add = (layer: string, mesh: THREE.Mesh) => {
    (parts[layer] ??= []).push(mesh.material as THREE.ShaderMaterial);
    model.add(mesh);
    return mesh;
  };
  const W = 3.2;
  const D = 2.0;
  const slab = (h: number) => new THREE.BoxGeometry(W, h, D, 1, 1, 1);

  // layers (top → bottom)
  const epi = add('epidermis', new THREE.Mesh(slab(0.42), glass({ tint: color('rose'), opacity: 0.8, iri: 1.2 })));
  epi.position.y = 1.29;
  const derm = add('dermis', new THREE.Mesh(slab(1.5), glass({ tint: color('blush'), opacity: 0.55, iri: 0.9 })));
  derm.position.y = 0.33;
  const fat = add('fat', new THREE.Mesh(slab(1.0), glass({ tint: color('leaf'), opacity: 0.6, iri: 0.8 })));
  fat.position.y = -0.92;
  // surface sheen (barrier / consultations)
  const top = add('surface', new THREE.Mesh(new THREE.PlaneGeometry(W * 0.98, D * 0.98), glass({ tint: color('white'), opacity: 0.25, iri: 2.4 })));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 1.51;
  (parts.barrier ??= []).push(top.material as THREE.ShaderMaterial);

  // fat lobules
  const r = rng(0.21);
  const lob = new THREE.SphereGeometry(1, 14, 10);
  for (let i = 0; i < count(9); i++) {
    const m = add('fat', new THREE.Mesh(lob, glass({ tint: color('leaf'), opacity: 0.5, iri: 1 })));
    m.position.set((r() - 0.5) * W * 0.8, -0.92 + (r() - 0.5) * 0.5, (r() - 0.5) * D * 0.7);
    m.scale.setScalar(0.2 + r() * 0.14);
  }
  // melanocytes along the base of the epidermis
  const dot = new THREE.SphereGeometry(0.07, 10, 8);
  for (let i = 0; i < count(10); i++) {
    const m = add('melanocytes', new THREE.Mesh(dot, glass({ tint: color('blush700'), opacity: 1, iri: 0.6 })));
    m.position.set(-W / 2 + 0.25 + (i / (count(10) - 1 || 1)) * (W - 0.5), 1.1, D / 2 - 0.02);
  }
  // hair follicle + shaft, and the nail edge on the far corner
  const folliclePath = [v3(0.55, -0.35, 0.3), v3(0.5, 0.2, 0.3), v3(0.62, 0.9, 0.3), v3(0.7, 1.5, 0.3)];
  add('follicle', new THREE.Mesh(tube(folliclePath, 0.13, 32, 10), glass({ tint: color('rose'), opacity: 0.9, iri: 1.6 })));
  const bulb = add('follicle', new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), glass({ tint: color('rose'), opacity: 0.9 })));
  bulb.position.set(0.55, -0.4, 0.3);
  add('follicle', new THREE.Mesh(tube([v3(0.7, 1.5, 0.3), v3(0.86, 2.0, 0.34), v3(1.2, 2.45, 0.4)], 0.045, 24, 8), glass({ tint: color('white'), opacity: 1, iri: 0.6 })));
  const nail = add('follicle', new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.7), glass({ tint: color('white'), opacity: 0.85, iri: 2.6 })));
  nail.position.set(-1.05, 1.56, -0.5);
  nail.rotation.z = 0.05;
  // sweat gland: coil + duct
  const coil: THREE.Vector3[] = [];
  for (let i = 0; i <= 26; i++) {
    const a = (i / 26) * Math.PI * 5;
    coil.push(v3(-0.75 + Math.cos(a) * 0.16, -0.3 + (i / 26) * 0.35, 0.45 + Math.sin(a) * 0.16));
  }
  coil.push(v3(-0.72, 0.6, 0.45), v3(-0.78, 1.5, 0.45));
  add('dermis', new THREE.Mesh(tube(coil, 0.045, 90, 6), glass({ tint: color('white'), opacity: 0.9, iri: 1.2 })));
  // blood vessels
  const vesselTints = [color('blush'), color('rose'), color('blush'), color('rose'), color('blush')];
  for (let i = 0; i < count(5); i++) {
    const z = -D / 2 + 0.3 + i * 0.36;
    const pts = [v3(-W / 2, -0.38 + Math.sin(i) * 0.08, z), v3(-0.8, -0.3 + Math.cos(i * 2) * 0.12, z + 0.1), v3(0.2, -0.42, z - 0.08), v3(W / 2, -0.33 + Math.sin(i * 3) * 0.1, z)];
    add('vessels', new THREE.Mesh(tube(pts, 0.05, 40, 6), glass({ tint: vesselTints[i], opacity: 1, iri: 0.8 })));
  }
  // pulse of light that travels the vessels when internal medicine is active
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), light(color('blush'), 0));
  model.add(pulse);

  model.rotation.set(0.32, -0.5, 0);
  const glow: Record<string, number> = {};

  /* DOM hooks: which pillar is active */
  const section = sectionOf(stage);
  const rows = Array.from(section.querySelectorAll<HTMLElement>('[data-pillar]'));
  let active = rows[0]?.dataset.pillar ?? 'surface';
  let hoverLock = 0;
  const setActive = (row: HTMLElement) => {
    active = row.dataset.pillar!;
    rows.forEach((x) => x.classList.toggle('is-active', x === row));
  };
  const io = new IntersectionObserver(
    (entries) => {
      if (performance.now() < hoverLock) return;
      const hit = entries.filter((e) => e.isIntersecting).pop();
      if (hit) setActive(hit.target as HTMLElement);
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  const onEnter = (e: Event) => {
    hoverLock = performance.now() + 1200;
    setActive(e.currentTarget as HTMLElement);
  };
  rows.forEach((row) => {
    io.observe(row);
    row.addEventListener('pointerenter', onEnter);
    row.addEventListener('focusin', onEnter);
  });
  if (rows[0]) setActive(rows[0]);
  if (still) active = 'dermis';

  let turn = -0.5;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 5.2, 5.4, 1.05);
    },
    update({ time, dt }) {
      for (const [layer, mats] of Object.entries(parts)) {
        const target = layer === active ? 0.55 : 0;
        glow[layer] = ease.damp(glow[layer] ?? 0, target, 5, dt);
        mats.forEach((m) => (m.uniforms.uGlow.value = Math.max(m.uniforms.uGlow.value * 0, glow[layer])));
      }
      // shared materials (surface/barrier) take the stronger of their two layers
      (top.material as THREE.ShaderMaterial).uniforms.uGlow.value = Math.max(glow.surface ?? 0, glow.barrier ?? 0);
      turn = ease.damp(turn, TURN[active] ?? 0, 2.2, dt);
      model.rotation.y = turn + Math.sin(time * 0.25) * 0.06;
      model.rotation.x = 0.32 + Math.sin(time * 0.2) * 0.02;
      const on = glow.vessels ?? 0;
      (pulse.material as THREE.MeshBasicMaterial).opacity = on * 1.2;
      const k = (time * 0.35) % 1;
      pulse.position.set(-W / 2 + k * W, -0.36 + Math.sin(k * 9) * 0.06, 0.1);
      void tier;
    },
    dispose() {
      io.disconnect();
      rows.forEach((row) => {
        row.removeEventListener('pointerenter', onEnter);
        row.removeEventListener('focusin', onEnter);
      });
    },
  };
};

export default factory;
