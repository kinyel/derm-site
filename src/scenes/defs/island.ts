/** Location page: stylised map of the Island with glowing routes from Lekki, Victoria Island and Ikoyi into Oniru. */
import { THREE, color, glass, light, tube, v3, stageSet, fitToAspect, ease } from '../kit.ts';
import { islandGeometries, ONIRU, ROUTES } from '../map.ts';
import type { SceneFactory } from '../engine.ts';

const factory: SceneFactory = ({ still }) => {
  const { scene, camera } = stageSet(30, 10);
  const map = new THREE.Group();
  scene.add(map);
  const land = glass({ tint: color('rose'), opacity: 0.7, iri: 1.3 });
  islandGeometries().forEach((g) => map.add(new THREE.Mesh(g, land)));
  const tones = [color('leaf'), color('blush'), color('rose')];
  const routes = ROUTES.map((route, i) => {
    const mat = glass({ tint: tones[i], opacity: 1, iri: 0.6, glow: 0.9 });
    const pts = [v3(route.from[0], route.from[1], 0.22), v3(route.via[0], route.via[1], 0.3), v3(ONIRU.x, ONIRU.y, 0.22)];
    map.add(new THREE.Mesh(tube(pts, 0.035, 48, 6), mat));
    const start = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), light(tones[i], 0.9));
    start.position.copy(pts[0]);
    map.add(start);
    return mat;
  });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), glass({ tint: color('blush'), opacity: 1, iri: 2, glow: 0.8 }));
  beacon.position.set(ONIRU.x, ONIRU.y, 0.26);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 48), light(color('blush'), 0.8));
  ring.position.set(ONIRU.x, ONIRU.y, 0.2);
  map.add(beacon, ring);
  map.rotation.x = -0.82;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 7.6, 3.4, 1.02);
    },
    update({ time, progress }) {
      const p = still ? 1 : ease.clamp((progress - 0.08) / 0.45);
      routes.forEach((m, i) => (m.uniforms.uReveal.value = ease.out(p * 1.6 - i * 0.25)));
      const pulse = (time * 0.5) % 1;
      ring.scale.setScalar(1 + pulse * 2.2);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * 0.7;
      map.rotation.z = Math.sin(time * 0.14) * 0.06;
    },
  };
};

export default factory;
