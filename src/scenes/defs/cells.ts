/** Clinical dermatology: a field of skin cells; inflamed (deep pink) cells calm to soft rose as you scroll. */
import { THREE, color, stageSet, fitToAspect, variation, rng, ease } from '../kit.ts';
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
  float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.0);
  vec3 col = mix(vCol * 0.75, vec3(1.0), f * 0.65);
  gl_FragColor = vec4(col, 0.55 + f * 0.45);
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, count, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const r = rng(0.31 + v.seed);
  const cols = 9;
  const rowsN = count(8) < 8 ? 6 : 8;
  const total = cols * rowsN;
  const geo = new THREE.CylinderGeometry(0.36, 0.36, 0.16, 6);
  geo.rotateX(Math.PI / 2);
  const mesh = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false }), total);
  const calm = v.seed > 0.66 && params.variant ? color('leaf') : color('rose');
  const hot = color('blush');
  const warm = color('blush700');
  const cells = Array.from({ length: total }, (_, i) => {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    return {
      x: (cx - (cols - 1) / 2) * 0.68 + (cy % 2 ? 0.34 : 0),
      y: (cy - (rowsN - 1) / 2) * 0.59,
      inflamed: r() < 0.38,
      w: r(),
      ph: r() * 6.28,
    };
  });
  mesh.setColorAt(0, calm);
  const group = new THREE.Group();
  group.add(mesh);
  group.scale.setScalar(v.scale);
  group.rotation.set(-0.45, 0.25 + v.spin * 0.05, 0.1);
  scene.add(group);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const c = new THREE.Color();

  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 6.2, 4.6, 1.02);
    },
    update({ time, progress }) {
      const heal = still ? 0.45 : ease.clamp((progress - 0.15) / 0.55);
      cells.forEach((cell, i) => {
        const fever = cell.inflamed ? 1 - ease.inOut(ease.clamp((heal * 1.4 - cell.w * 0.9) / 0.5)) : 0;
        const swell = 1 + fever * (0.22 + Math.sin(time * 2.2 + cell.ph) * 0.06);
        p.set(cell.x, cell.y, fever * 0.2 + Math.sin(time * 0.6 * v.speed + cell.ph) * 0.03);
        s.set(swell, swell, 1 + fever * 0.8);
        m4.compose(p, q, s);
        mesh.setMatrixAt(i, m4);
        c.copy(calm).lerp(fever > 0.6 ? warm : hot, fever * 0.9);
        mesh.setColorAt(i, c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  };
};

export default factory;
