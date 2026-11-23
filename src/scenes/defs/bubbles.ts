/** Children's skin: soft pastel bubbles with slow, gentle physics. */
import { THREE, glass, stageSet, fitToAspect, variation, rng } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ params, count }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const r = rng(0.77 + v.seed);
  const geo = new THREE.SphereGeometry(1, 28, 20);
  const n = count(14);
  const bounds = { x: 2.6, y: 2.2 };
  const balls = Array.from({ length: n }, (_, i) => {
    const radius = 0.28 + r() * 0.5;
    const mesh = new THREE.Mesh(geo, glass({ tint: v.tints[i % 3], opacity: 0.75, iri: 2.0 + r() }));
    mesh.scale.setScalar(radius * v.scale);
    scene.add(mesh);
    return { mesh, radius: radius * v.scale, p: new THREE.Vector3((r() - 0.5) * 4.4, (r() - 0.5) * 3.6, (r() - 0.5) * 1.2), vel: new THREE.Vector3((r() - 0.5) * 0.25, (r() - 0.5) * 0.25, 0), ph: r() * 6.28 };
  });
  const d = new THREE.Vector3();
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 6.4, 5.2, 1.02);
      bounds.x = aspect > 1 ? 2.8 : 2.2;
      bounds.y = aspect > 1 ? 2.1 : 2.6;
    },
    update({ time, dt, pointer }) {
      const step = Math.min(dt, 0.033) * v.speed;
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i];
        a.vel.y += Math.sin(time * 0.5 + a.ph) * 0.02 * step; // buoyancy drift
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j];
          d.subVectors(a.p, b.p);
          const dist = d.length() || 0.001;
          const overlap = a.radius + b.radius - dist;
          if (overlap > 0) {
            d.multiplyScalar((overlap / dist) * 0.5); // soft push apart
            a.vel.addScaledVector(d, 0.9 * step * 20);
            b.vel.addScaledVector(d, -0.9 * step * 20);
          }
        }
        if (pointer.inside) {
          d.set(pointer.x * bounds.x, pointer.y * bounds.y, 0).sub(a.p);
          const dist = d.length();
          if (dist < 1.4) a.vel.addScaledVector(d, -0.25 * step * (1.4 - dist));
        }
        if (Math.abs(a.p.x) > bounds.x) a.vel.x -= Math.sign(a.p.x) * 0.6 * step;
        if (Math.abs(a.p.y) > bounds.y) a.vel.y -= Math.sign(a.p.y) * 0.6 * step;
        a.vel.multiplyScalar(0.995);
        a.vel.clampLength(0, 0.5);
        a.p.addScaledVector(a.vel, step);
        a.mesh.position.copy(a.p);
      }
    },
  };
};

export default factory;
