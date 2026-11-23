/** Conditions hub: a specimen wall, a grid of small skin-surface tiles rippling in depth, one per condition. */
import { THREE, color, stageSet, fitToAspect, rng } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const VERT = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vCol;
void main(){
  vCol = instanceColor;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * mat3(instanceMatrix) * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vCol;
void main(){
  vec3 n = normalize(vN);
  float f = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 2.2);
  float diff = 0.72 + 0.4 * max(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0);
  gl_FragColor = vec4(mix(vCol * diff, vec3(1.0), f * 0.55), 1.0);
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const n = Math.max(12, Math.min(96, Number(params.n ?? 48)));
  const cols = Math.ceil(Math.sqrt(n * 1.25));
  const rowsN = Math.ceil(n / cols);
  const r = rng(0.52);
  const geo = new THREE.BoxGeometry(0.52, 0.52, 0.16, 1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG }), n);
  const light = color('skin1');
  const deep = color('skin5');
  const accents = [color('blush'), color('rose'), color('leaf')];
  const c = new THREE.Color();
  const tiles = Array.from({ length: n }, (_, i) => {
    const x = ((i % cols) - (cols - 1) / 2) * 0.62;
    const y = ((rowsN - 1) / 2 - Math.floor(i / cols)) * 0.62;
    c.copy(light).lerp(deep, 0.1 + r() * 0.8);
    if (r() < 0.22) c.lerp(accents[i % 3], 0.35); // a few tiles carry a brand tint
    mesh.setColorAt(i, c);
    return { x, y, ph: r() * 6.28 };
  });
  const group = new THREE.Group();
  group.add(mesh);
  group.rotation.set(-0.42, 0.32, 0.06);
  scene.add(group);
  const m4 = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(1, 1, 1);
  const e = new THREE.Euler();
  const w = cols * 0.62;
  const h = rowsN * 0.62;
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, w + 0.6, h + 0.8, 1.04);
    },
    update({ time, pointer }) {
      const t = still ? 2.2 : time;
      const px = pointer.inside ? pointer.x * w * 0.5 : 0;
      const py = pointer.inside ? pointer.y * h * 0.5 : 0;
      tiles.forEach((tile, i) => {
        const d = Math.hypot(tile.x - px, tile.y - py);
        const z = Math.sin(d * 1.6 - t * 1.1) * 0.16 + Math.sin(t * 0.5 + tile.ph) * 0.03;
        p.set(tile.x, tile.y, z);
        e.set(Math.cos(d * 1.6 - t * 1.1) * 0.12, Math.sin(d * 1.6 - t * 1.1) * 0.12, 0);
        q.setFromEuler(e);
        m4.compose(p, q, s);
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
};

export default factory;
