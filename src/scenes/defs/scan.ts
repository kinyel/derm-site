/** Skin cancer care: a scanning light band over a dermoscopy-style pigment network. */
import { THREE, color, glass, stageSet, fitToAspect, shaderPlane, variation } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const FRAG = /* glsl */ `
uniform float uScan; uniform float uSeed; uniform vec3 uInk;
vec2 cell(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash21(i + g + uSeed), hash21(i + g + 17.0 + uSeed));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return vec2(d1, d2);
}
void main(){
  vec2 uv = vUv - 0.5;
  float r = length(uv);
  float lesion = smoothstep(0.42, 0.12, r + (noise2(vUv * 5.0 + uSeed) - 0.5) * 0.16); // irregular mole outline
  vec2 c = cell(vUv * 15.0);
  float net = smoothstep(0.09, 0.02, c.y - c.x);                    // pigment network lines
  float band = exp(-pow((vUv.x - uScan) * 9.0, 2.0));              // the scan band
  vec3 base = mix(uB * 0.5, uB, 0.5 + 0.5 * noise2(vUv * 3.0));
  vec3 col = mix(base, uInk, net * lesion * 0.85);
  col = mix(col, uInk * 0.7, lesion * 0.25);
  col += band * mix(uA, uC, vUv.y) * 0.6;
  col += band * net * lesion * 0.5;
  float disc = smoothstep(0.5, 0.485, r);
  gl_FragColor = vec4(col, disc * 0.95);
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 8);
  const v = variation(params);
  const scan = { value: 0.5 };
  const plane = shaderPlane(4.4, 4.4, FRAG, { uScan: scan, uSeed: { value: v.seed * 20 }, uInk: { value: color('blush700') } });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.09, 14, 96), glass({ tint: v.tints[0], opacity: 1, iri: 2.2 }));
  const cover = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), glass({ tint: color('white'), opacity: 0.18, iri: 2.8 }));
  cover.position.z = 0.12;
  const group = new THREE.Group();
  group.add(plane, rim, cover);
  group.scale.setScalar(v.scale);
  group.rotation.set(-0.25, 0.3, v.spin * 0.05);
  scene.add(group);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 5, 5, 1.04);
    },
    update({ time }) {
      scan.value = still ? 0.42 : 0.5 + Math.sin(time * 0.45 * v.speed) * 0.55;
      group.rotation.y = 0.3 + Math.sin(time * 0.2) * 0.08;
    },
  };
};

export default factory;
