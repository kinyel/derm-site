/** Stylised map of the Island (Victoria Island, Ikoyi, Lekki) shared by the "pin" (home) and "island" (location page) scenes. Not to scale. */
import { THREE } from './kit.ts';

const LAGOS_ISLAND_IKOYI: [number, number][] = [
  [-3.3, 0.55], [-2.7, 1.05], [-1.7, 1.28], [-0.6, 1.2], [0.25, 0.98], [0.55, 0.62], [0.1, 0.32], [-0.9, 0.36], [-1.8, 0.26], [-2.7, 0.28],
];
const VI_LEKKI: [number, number][] = [
  [-2.9, -0.38], [-2.3, -0.12], [-1.4, -0.04], [-0.4, -0.08], [0.6, 0.06], [1.7, 0.2], [2.9, 0.3], [3.7, 0.3], [3.7, -0.52], [2.6, -0.64], [1.4, -0.76], [0.2, -0.86], [-1.2, -0.82], [-2.4, -0.62],
];

/** Where the clinic sits on the stylised map (Oniru, at the eastern end of Victoria Island). */
export const ONIRU = new THREE.Vector2(0.2, -0.36);
/** Route starts for the location page: Lekki, Victoria Island, Ikoyi. */
export const ROUTES: { id: string; from: [number, number]; via: [number, number] }[] = [
  { id: 'lekki', from: [3.0, -0.18], via: [1.6, -0.3] },
  { id: 'victoria-island', from: [-1.9, -0.4], via: [-0.8, -0.46] },
  { id: 'ikoyi', from: [-0.5, 0.78], via: [0.3, 0.2] },
];

function shape(points: [number, number][]): THREE.Shape {
  const s = new THREE.Shape();
  const pts = points.map(([x, y]) => new THREE.Vector2(x, y));
  s.moveTo(pts[0].x, pts[0].y);
  s.splineThru([...pts.slice(1), pts[0]]);
  return s;
}

export function islandGeometries(depth = 0.12): THREE.ExtrudeGeometry[] {
  const opts = { depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 18 };
  return [new THREE.ExtrudeGeometry(shape(LAGOS_ISLAND_IKOYI), opts), new THREE.ExtrudeGeometry(shape(VI_LEKKI), opts)];
}
