import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from '../utils/rng.js';

// The bar stands upright: x = width, y = length, z = thickness (chocolate faces +z).
// A full-height carton hides the chocolate; `out` (0..1) slides the foil-wrapped bar up out of it.
export const BAR = {
  W: 1.8, L: 3.3, T: 0.1,
  COLS: 3, ROWS: 6, GAP: 0.06,
  BOX_L: 3.42, BOX_T: 0.36,
  OUT: 1.5,        // how far the chocolate slides out at out = 1
  FOIL_L: 2.2,     // the foil covers the lower part of the chocolate
  BARE: 0.85       // chocolate showing above the foil
};
const CW = BAR.W / BAR.COLS, CH = BAR.L / BAR.ROWS;          // cell pitch
const SEG_Z = BAR.T / 2 + 0.04;                              // segment centre
const SEG_FRONT = SEG_Z + 0.06;
const BOX_Z = 0.06;
const FOIL_Y = BAR.L / 2 - BAR.BARE - BAR.FOIL_L / 2;         // foil centre, relative to the chocolate
const PIECE = { r: 0, c: 2 };                                // the corner that snaps off

let G = null;
function geometries() {
  if (G) return G;
  // crinkled foil: flat box with jittered normals so it catches light unevenly
  const foil = new THREE.BoxGeometry(BAR.W + 0.04, BAR.FOIL_L, 0.28, 28, 34, 1);
  const n = foil.attributes.normal, r = rng(7), v = new THREE.Vector3();
  for (let i = 0; i < n.count; i++) {
    v.set(n.getX(i) + (r() - 0.5) * 0.4, n.getY(i) + (r() - 0.5) * 0.4, n.getZ(i) + (r() - 0.5) * 0.4).normalize();
    n.setXYZ(i, v.x, v.y, v.z);
  }
  G = {
    tile: new RoundedBoxGeometry(CW, CH, BAR.T, 2, 0.012),
    seg: new RoundedBoxGeometry(CW - BAR.GAP, CH - BAR.GAP, 0.12, 4, 0.045),
    box: new RoundedBoxGeometry(BAR.W + 0.1, BAR.BOX_L, BAR.BOX_T, 3, 0.035),
    label: new THREE.PlaneGeometry(BAR.W, BAR.BOX_L - 0.12),
    bit: new THREE.IcosahedronGeometry(0.032, 0),
    foil
  };
  return G;
}

const foilMat = new THREE.MeshPhysicalMaterial({ color: '#e2bd72', metalness: 1, roughness: 0.3 });
const cellPos = (r, c) => new THREE.Vector3(-BAR.W / 2 + CW / 2 + c * CW, BAR.L / 2 - CH / 2 - r * CH, 0);

export function createBar(p, frontTex, backTex, index) {
  const g = geometries();
  const rand = rng(100 + index);

  const chocMat = new THREE.MeshPhysicalMaterial({
    color: p.choc, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.28,
    sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color(p.choc).lerp(new THREE.Color('#ffffff'), 0.3)
  });
  const boxMat = new THREE.MeshPhysicalMaterial({ color: p.deep, roughness: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.6 });
  const labelMat = tex => new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -1 });

  const group = new THREE.Group();     // origin = centre of the box
  const inner = new THREE.Group();     // the chocolate, slides along y
  group.add(inner);

  // chocolate: one tile + raised segment per cell, so the corner piece can break away cleanly
  let piece = null;
  const pieceBase = new THREE.Vector3();
  for (let r = 0; r < BAR.ROWS; r++) {
    for (let c = 0; c < BAR.COLS; c++) {
      const cell = new THREE.Group();
      cell.position.copy(cellPos(r, c));
      const seg = new THREE.Mesh(g.seg, chocMat);
      seg.position.z = SEG_Z;
      cell.add(new THREE.Mesh(g.tile, chocMat), seg);
      inner.add(cell);
      if (r === PIECE.r && c === PIECE.c) { piece = cell; pieceBase.copy(cell.position); }
    }
  }

  // inclusions scattered over the segment faces
  const bits = new THREE.InstancedMesh(g.bit, new THREE.MeshStandardMaterial({ color: p.bits, roughness: 0.5 }), 34);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
  for (let i = 0; i < bits.count;) {
    const r = Math.floor(rand() * BAR.ROWS), c = Math.floor(rand() * BAR.COLS);
    if (r === PIECE.r && c === PIECE.c) continue;
    const at = cellPos(r, c);
    at.x += (rand() - 0.5) * (CW - 0.16);
    at.y += (rand() - 0.5) * (CH - 0.16);
    at.z = SEG_FRONT + 0.004;
    e.set(rand() * 6.3, rand() * 6.3, rand() * 6.3);
    const k = 0.6 + rand() * 0.9;
    m4.compose(at, q.setFromEuler(e), sc.set(k, k * 0.7, k));
    bits.setMatrixAt(i++, m4);
  }
  inner.add(bits);

  const foil = new THREE.Mesh(g.foil, foilMat);
  foil.position.z = BOX_Z;
  group.add(foil);

  // the printed carton
  const box = new THREE.Group();
  box.position.z = BOX_Z;
  const front = new THREE.Mesh(g.label, labelMat(frontTex));
  front.position.z = BAR.BOX_T / 2 + 0.003;
  const back = new THREE.Mesh(g.label, labelMat(backTex));
  back.position.z = -(BAR.BOX_T / 2 + 0.003);
  back.rotation.y = Math.PI;
  box.add(new THREE.Mesh(g.box, boxMat), front, back);
  group.add(box);

  // animated state written by the scroll timeline, applied every frame
  const st = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, out: 0, snap: 0 };
  const intro = { y: 0, ry: 0, sc: 1 };   // load-in offsets: rise, spin, scale

  // `out` can be raised above the timeline value, e.g. while the bar is hovered
  function apply(out = st.out) {
    inner.position.y = out * BAR.OUT;
    foil.position.y = inner.position.y + FOIL_Y - out * 0.15;   // the foil lags a little behind the chocolate
    const k = st.snap;
    piece.position.set(pieceBase.x + 0.45 * k, pieceBase.y + 0.6 * k, pieceBase.z + 0.75 * k);
    piece.rotation.set(0.8 * k, -0.9 * k, 0.5 * k);
  }

  return { group, st, intro, apply };
}
