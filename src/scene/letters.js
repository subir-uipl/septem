import * as THREE from 'three';
import opentype from 'opentype.js';
import frauncesUrl from '@fontsource/fraunces/files/fraunces-latin-600-normal.woff?url';

// opentype path (y down) -> three.js shapes (y up)
function toShapes(path) {
  const sp = new THREE.ShapePath();
  for (const c of path.commands) {
    if (c.type === 'M') sp.moveTo(c.x, -c.y);
    else if (c.type === 'L') sp.lineTo(c.x, -c.y);
    else if (c.type === 'Q') sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === 'C') sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  return sp.toShapes(false);
}

// The hero wordmark as thick, glossy 3D letters, each one cast in a different chocolate.
// Units are ems: the baseline is y = 0 and the word is centred on x = 0.
export async function createLetters(text, colors) {
  const font = opentype.parse(await (await fetch(frauncesUrl)).arrayBuffer());
  const width = font.getAdvanceWidth(text, 1, { kerning: true });
  const group = new THREE.Group();
  const letters = [];

  font.forEachGlyph(text, 0, 0, 1, { kerning: true }, (glyph, gx) => {
    const i = letters.length;
    const geo = new THREE.ExtrudeGeometry(toShapes(glyph.getPath(gx, 0, 1)), {
      depth: 0.16, curveSegments: 10,
      bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.02, bevelSegments: 4
    });
    // pivot each letter around its own centre so it can turn in place
    geo.computeBoundingBox();
    const c = geo.boundingBox.getCenter(new THREE.Vector3());
    geo.translate(-c.x, -c.y, -c.z);

    const color = new THREE.Color(colors[i % colors.length]);
    const mat = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18,
      sheen: 0.4, sheenRoughness: 0.5, sheenColor: color.clone().lerp(new THREE.Color('#ffffff'), 0.35)
    });
    const mesh = new THREE.Mesh(geo, mat);
    const base = new THREE.Vector3(c.x - width / 2, c.y, 0);
    mesh.position.copy(base);
    group.add(mesh);
    letters.push({ mesh, base, intro: { y: 0 }, phase: i * 1.3 });
  });

  return { group, letters, width };
}
