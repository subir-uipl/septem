import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from '../utils/rng.js';

// Shared geometry / material caches so seven flavours stay cheap.
const geoCache = {}, matCache = {};
const geo = (key, make) => geoCache[key] || (geoCache[key] = make());
const mat = (key, opts) => matCache[key] || (matCache[key] = new THREE.MeshPhysicalMaterial({ roughness: 0.45, ...opts }));

function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.24);
  s.bezierCurveTo(0.17, -0.12, 0.17, 0.14, 0, 0.26);
  s.bezierCurveTo(-0.17, 0.14, -0.17, -0.12, 0, -0.24);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 20 });
  g.center();
  return g;
}
const cubeGeo = () => geo('cube', () => new RoundedBoxGeometry(0.26, 0.26, 0.26, 3, 0.06));

// One small model per ingredient, built from primitives.
const MAKERS = {
  raspberry() {
    const g = new THREE.Group();
    const d = geo('drupe', () => new THREE.SphereGeometry(0.052, 12, 10));
    const m = mat('raspberry', { color: '#a3082a', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.2 });
    const n = 26;
    for (let i = 0; i < n; i++) {
      const y = 1 - ((i + 0.5) / n) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
      const s = new THREE.Mesh(d, m);
      s.position.set(Math.cos(th) * r * 0.12, y * 0.15, Math.sin(th) * r * 0.12);
      g.add(s);
    }
    return g;
  },
  petal() {
    return new THREE.Mesh(
      geo('petal', () => { const s = new THREE.SphereGeometry(0.21, 24, 14); s.scale(1, 0.13, 0.78); return s; }),
      mat('petal', { color: '#ffb3c6', roughness: 0.6, sheen: 1, sheenColor: new THREE.Color('#fff0f4') })
    );
  },
  mango() {
    return new THREE.Mesh(cubeGeo(), mat('mango', { color: '#ffc93a', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.2 }));
  },
  chili() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(geo('chili', () => new THREE.CapsuleGeometry(0.06, 0.36, 6, 16)), mat('chili', { color: '#d8200c', roughness: 0.18, clearcoat: 1 }));
    body.rotation.z = 0.3;
    const stem = new THREE.Mesh(geo('stem', () => new THREE.CylinderGeometry(0.018, 0.028, 0.11, 8)), mat('stem', { color: '#3d8b2c' }));
    stem.position.set(-0.075, 0.27, 0);
    stem.rotation.z = 0.55;
    g.add(body, stem);
    return g;
  },
  honeycomb() {
    const g = new THREE.Group();
    const h = geo('hex', () => new THREE.CylinderGeometry(0.1, 0.1, 0.08, 6));
    const m = mat('honey', { color: '#e8950a', roughness: 0.15, clearcoat: 1 });
    for (const [x, z] of [[0, 0], [0.173, 0], [0.0866, 0.15]]) {
      const c = new THREE.Mesh(h, m);
      c.position.set(x, 0, z);
      g.add(c);
    }
    return g;
  },
  salt() {
    return new THREE.Mesh(geo('salt', () => new THREE.BoxGeometry(0.085, 0.085, 0.085)), mat('salt', { color: '#fffdf6', roughness: 0.22, clearcoat: 1 }));
  },
  leaf() {
    return new THREE.Mesh(geo('leaf', leafGeometry), mat('leaf', { color: '#b9e769', roughness: 0.45, side: THREE.DoubleSide }));
  },
  yuzu() {
    const g = new THREE.Group();
    const rind = new THREE.Mesh(geo('rind', () => new THREE.CylinderGeometry(0.17, 0.17, 0.045, 36)), mat('rind', { color: '#ffd21f', roughness: 0.35, clearcoat: 0.6 }));
    const flesh = new THREE.Mesh(geo('flesh', () => new THREE.CylinderGeometry(0.15, 0.15, 0.05, 36)), mat('flesh', { color: '#fff3a6', roughness: 0.3, clearcoat: 1 }));
    g.add(rind, flesh);
    return g;
  },
  mint() {
    return new THREE.Mesh(geo('leaf', leafGeometry), mat('mint', { color: '#a7f3d0', roughness: 0.4, side: THREE.DoubleSide }));
  },
  nib() {
    return new THREE.Mesh(
      geo('nib', () => { const d = new THREE.DodecahedronGeometry(0.075, 0); d.scale(1, 0.6, 0.85); return d; }),
      mat('nib', { color: '#4a2414', roughness: 0.7 })
    );
  },
  blueberry() {
    const g = new THREE.Group();
    const b = new THREE.Mesh(geo('berry', () => new THREE.SphereGeometry(0.115, 24, 18)), mat('blueberry', { color: '#1e2063', roughness: 0.5, sheen: 1, sheenColor: new THREE.Color('#8f97ff') }));
    const crown = new THREE.Mesh(geo('crown', () => new THREE.TorusGeometry(0.03, 0.012, 8, 16)), mat('crown', { color: '#14153f', roughness: 0.7 }));
    crown.rotation.x = Math.PI / 2;
    crown.position.y = 0.108;
    g.add(b, crown);
    return g;
  },
  lavender() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo('lstem', () => new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6)), mat('lstem', { color: '#7f8f6a' })));
    const bud = geo('bud', () => { const s = new THREE.SphereGeometry(0.032, 10, 8); s.scale(1, 1.5, 1); return s; });
    const m = mat('bud', { color: '#c3b1ff', roughness: 0.5 });
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(bud, m), a = i * 2.2;
      s.position.set(Math.cos(a) * 0.025, 0.03 + i * 0.022, Math.sin(a) * 0.025);
      g.add(s);
    }
    return g;
  },
  ube() {
    return new THREE.Mesh(cubeGeo(), mat('ube', { color: '#c792f5', roughness: 0.3, clearcoat: 0.8 }));
  },
  currant() {
    const g = new THREE.Group();
    const s = geo('currant', () => new THREE.SphereGeometry(0.065, 18, 14));
    const m = mat('currant', { color: '#2b0c3c', roughness: 0.12, clearcoat: 1 });
    for (const [x, y] of [[0, 0], [0.11, 0.03], [0.05, 0.1]]) {
      const c = new THREE.Mesh(s, m);
      c.position.set(x, y, 0);
      g.add(c);
    }
    return g;
  }
};

// A cloud of a flavour's ingredients that drifts around its bar while that bar is on stage.
export function createIngredients(p, index, count = 16) {
  const group = new THREE.Group();
  const rand = rng(500 + index);
  const items = [];
  for (let k = 0; k < count; k++) {
    const obj = MAKERS[p.ingredients[k % 2]]();
    group.add(obj);
    const ang = (k / count) * Math.PI * 2 + rand() * 0.35;
    const rad = 1.75 + rand() * 1.35;
    items.push({
      obj,
      off: new THREE.Vector3(Math.cos(ang) * rad * 1.05, Math.sin(ang) * rad * 1.1, (rand() - 0.5) * 2.4),
      base: 1.3 + rand() * 0.9,
      spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(1.1),
      rot: new THREE.Euler(rand() * 6.3, rand() * 6.3, rand() * 6.3),
      phase: rand() * 6.3
    });
  }
  group.visible = false;

  const st = { p: 0 };   // presence 0..1, driven by the scroll timeline

  // center = the bar's resting pose; side = which way the text panel is (keep it clear)
  function update(time, center) {
    const pv = st.p;
    group.visible = pv > 0.002;
    if (!group.visible) return;
    const textSide = center.x >= 0 ? -1 : 1;
    const spread = (0.55 + 0.45 * pv) * (center.s / 0.95);
    for (const it of items) {
      const towardText = Math.sign(it.off.x) === textSide;
      it.obj.position.set(
        center.x + it.off.x * spread * (towardText ? 0.55 : 1),
        center.y + it.off.y * spread + Math.sin(time * 0.9 + it.phase) * 0.08,
        it.off.z * spread
      );
      it.obj.rotation.set(it.rot.x + time * it.spin.x, it.rot.y + time * it.spin.y, it.rot.z + time * it.spin.z);
      it.obj.scale.setScalar(it.base * pv * Math.max(0.6, center.s / 0.95));
    }
  }

  return { group, st, update };
}
