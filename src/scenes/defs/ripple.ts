/** Dermatology pharmacy: a glass droplet falling into liquid; ripples expand as you scroll. */
import { THREE, color, glass, stageSet, fitToAspect, shaderPlane, variation, ease } from '../kit.ts';
import type { SceneFactory } from '../engine.ts';

const FRAG = /* glsl */ `
uniform float uSpread; uniform float uImpact;
void main(){
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float rings = sin((r - uSpread) * 34.0) * exp(-abs(r - uSpread) * 5.0) * uImpact;
  rings += sin((r - uSpread * 0.55) * 30.0) * exp(-abs(r - uSpread * 0.55) * 7.0) * uImpact * 0.6;
  float pool = smoothstep(1.0, 0.75, r);
  vec3 col = mix(uA, uB, clamp(r + rings * 0.6, 0.0, 1.0));
  col = mix(col, uC, smoothstep(0.6, 1.0, r) * 0.6);
  col += max(rings, 0.0) * 0.7;
  gl_FragColor = vec4(col, pool * (0.42 + abs(rings) * 0.55));
  #include <colorspace_fragment>
}`;

const factory: SceneFactory = ({ params, still }) => {
  const { scene, camera } = stageSet(30, 9);
  const v = variation(params);
  const spread = { value: 0 };
  const impact = { value: 0 };
  const pool = shaderPlane(6, 6, FRAG, { uSpread: spread, uImpact: impact });
  pool.rotation.x = -Math.PI / 2 + 0.42;
  pool.position.y = -1.2;
  const dropGeo = new THREE.SphereGeometry(0.42, 28, 22);
  const p = dropGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y > 0) p.setXYZ(i, p.getX(i) * (1 - y * 0.9), y * 1.9, p.getZ(i) * (1 - y * 0.9)); // teardrop tip
  }
  dropGeo.computeVertexNormals();
  const drop = new THREE.Mesh(dropGeo, glass({ tint: v.tints[0], opacity: 0.95, iri: 2.6 }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.05, 10, 96), glass({ tint: color('white'), opacity: 0.8, iri: 2 }));
  rim.rotation.x = Math.PI / 2 + 0.42 - Math.PI;
  rim.position.y = -1.2;
  const group = new THREE.Group();
  group.add(pool, drop, rim);
  group.scale.setScalar(v.scale);
  scene.add(group);
  return {
    scene,
    camera,
    resize(aspect) {
      fitToAspect(camera, aspect, 6.2, 5.2, 1.02);
    },
    update({ time, progress }) {
      const p0 = still ? 0.6 : ease.clamp((progress - 0.1) / 0.6);
      const fall = ease.clamp(p0 / 0.3); // first third: the drop falls
      const after = ease.clamp((p0 - 0.3) / 0.7); // then the ripples expand
      drop.position.y = 2.2 - fall * fall * 3.2;
      drop.scale.setScalar(1 - after * 0.999);
      drop.visible = after < 0.25;
      spread.value = after * 0.95;
      impact.value = fall >= 1 ? 1 - after * 0.55 : 0;
      group.rotation.y = v.spin * 0.05 + Math.sin(time * 0.2 * v.speed) * 0.1;
    },
  };
};

export default factory;
