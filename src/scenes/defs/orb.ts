/**
 * Book appointment: an orb that fills rose → pink → leaf as the form groups are completed.
 * The form script writes the completed share to stage.dataset.fill (0…1).
 */
import { THREE, color, glass, stageSet, fitToAspect, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const VERT = /* glsl */ `varying vec3 vP; varying vec3 vN; varying vec3 vV;
void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FRAG = /* glsl */ `uniform float uFill; uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; varying vec3 vP; varying vec3 vN; varying vec3 vV;
void main(){
  float level = mix(-0.98, 0.98, uFill) + sin(vP.x * 5.0 + uTime * 1.4) * 0.03 + sin(vP.z * 4.0 - uTime) * 0.02;
  if (vP.y > level) discard;
  vec3 col = uFill < 0.5 ? mix(uA, uB, uFill * 2.0) : mix(uB, uC, (uFill - 0.5) * 2.0);
  float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.0);
  float surface = smoothstep(0.08, 0.0, level - vP.y);
  col = mix(col, vec3(1.0), f * 0.35 + surface * 0.5);
  gl_FragColor = vec4(col, 0.92);
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ stage, still }) => {
  const { scene, camera } = stageSet(30, 6);
  const fill = { value: 0 };
  const liquid = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 48, 36),
    new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uFill: fill, uTime: { value: 0 }, uA: { value: color('rose') }, uB: { value: color('blush') }, uC: { value: color('leaf') } },
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), glass({ tint: color('white'), opacity: 0.5, iri: 2.6 }));
  scene.add(liquid, shell);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 2.3, 2.3, 1.08);
    },
    update({ time, dt }) {
      const target = still ? 0.62 : Math.max(0.06, Number(stage.dataset.fill ?? 0));
      fill.value = ease.damp(fill.value, target, 3, dt);
      shell.rotation.y = time * 0.2;
      liquid.rotation.z = Math.sin(time * 0.7) * 0.05;
    },
  };
};

export default factory;
