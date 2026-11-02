import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BAR } from './bar.js';

const COCOA = '#2b1308', CREAM = '#fff3e3', GOLD = '#e6c27a';
const SLEEVE = '#1c0b04';   // the sleeve body is a touch darker so it reads as rich cocoa under bright light
const INK = '#120502';      // printed cocoa, pre-darkened to allow for the studio lighting

// A square gift box: a cream tray with two rows of four slots (seven bars plus a note card)
// and a printed outer sleeve that slides over it.
// Local frame: x = width, y = up, z = depth (front = +z). The tray floor sits at y = 0.
const COLS = 4, ROWS = 2, DIV = 0.12, WALL = 0.1, FLOOR = 0.08;
const IW = COLS * BAR.W + (COLS + 1) * DIV, ID = ROWS * BAR.BOX_L + (ROWS + 1) * DIV;
const TW = IW + 2 * WALL, TD = ID + 2 * WALL, TH = 0.5;
const SL = TW + 0.04, SK = 0.06;               // sleeve length and wall thickness
const SH = TH + 0.03, SD = TD + 0.03;          // sleeve inner height and depth
const CARD_SLOT = 7;                           // bottom-right slot holds the note card

const slotX = i => -IW / 2 + DIV + BAR.W / 2 + (i % COLS) * (BAR.W + DIV);
const slotZ = i => -ID / 2 + DIV + BAR.BOX_L / 2 + Math.floor(i / COLS) * (BAR.BOX_L + DIV);

export const GIFT = {
  TW, TD, TH,
  SLOT_Y: FLOOR + 0.12,                        // bar origin height so its carton rests on the liner
  slotX, slotZ
};

// world pose of a bar lying in slot `b` of a box at pose G ({ x, y, z, rx, s }):
// label up, top of the bar towards the back of the box
export function slotOf(G, b) {
  const c = Math.cos(G.rx), s = Math.sin(G.rx), ly = GIFT.SLOT_Y, lz = slotZ(b);
  return {
    x: G.x + G.s * slotX(b), y: G.y + G.s * (ly * c - lz * s), z: G.z + G.s * (ly * s + lz * c),
    rx: G.rx - Math.PI / 2, ry: 0, rz: 0, s: G.s
  };
}

// ---------- printed artwork ----------
const MARK = [[12, 1], [20.6, 5.14], [22.72, 14.45], [16.77, 21.91], [7.23, 21.91], [1.28, 14.45], [3.4, 5.14]];
function heptagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 7;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}
function drawMark(ctx, cx, cy, size, colors, hole) {
  const k = size / 24;
  MARK.forEach((p, i) => {
    const q = MARK[(i + 1) % 7];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (p[0] - 12) * k, cy + (p[1] - 12) * k);
    ctx.lineTo(cx + (q[0] - 12) * k, cy + (q[1] - 12) * k);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(cx, cy, 3.4 * k, 0, Math.PI * 2);
  ctx.fillStyle = hole;
  ctx.fill();
}
function goldGradient(ctx, x0, x1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, '#c9994f');
  g.addColorStop(0.45, '#f6dfa6');
  g.addColorStop(1, '#c9994f');
  return g;
}
// thin gold rule with a small diamond in the middle
function ornament(ctx, cx, y, half) {
  ctx.fillRect(cx - half, y - 1, half - 18, 2);
  ctx.fillRect(cx + 18, y - 1, half - 18, 2);
  ctx.beginPath();
  ctx.moveTo(cx, y - 9); ctx.lineTo(cx + 9, y); ctx.lineTo(cx, y + 9); ctx.lineTo(cx - 9, y);
  ctx.closePath();
  ctx.fill();
}
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// sleeve top: cocoa with a tonal heptagon pattern, a gold double frame and the gold wordmark
function sleeveTop(colors) {
  return canvasTexture(1600, Math.round(1600 * (SD + 2 * SK) / SL), (ctx, W, H) => {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255, 228, 190, .07)';
    ctx.lineWidth = 2;
    for (let y = 0, row = 0; y < H + 40; y += 46, row++) {
      for (let x = row % 2 ? 23 : 0; x < W + 40; x += 46) {
        heptagon(ctx, x, y, 11);
        ctx.stroke();
      }
    }

    const gold = goldGradient(ctx, 0, W);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(56, 56, W - 112, H - 112);

    // cocoa medallion behind the lockup, ringed in gold
    const cx = W / 2, cy = H / 2;
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(cx, cy, 470, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 470, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 452, 0, Math.PI * 2); ctx.stroke();

    drawMark(ctx, cx, cy - 230, 150, colors, INK);
    ctx.fillStyle = goldGradient(ctx, cx - 320, cx + 320);
    ctx.textAlign = 'center';
    ctx.font = 'italic 600 210px Fraunces';
    ctx.fillText('Septem', cx, cy + 50);
    ctx.font = '600 34px Inter';
    ctx.letterSpacing = '18px';
    ctx.fillText('THE BOX OF SEVEN', cx + 9, cy + 135);
    ornament(ctx, cx, cy + 190, 230);
    ctx.font = 'italic 400 38px Fraunces';
    ctx.letterSpacing = '1px';
    ctx.globalAlpha = 0.75;
    ctx.fillText('Seven bars · Hand-tempered', cx, cy + 262);
    ctx.globalAlpha = 1;

    // corner flourishes
    ctx.fillStyle = gold;
    for (const [x, y] of [[96, 96], [W - 96, 96], [96, H - 96], [W - 96, H - 96]]) {
      ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 14); ctx.lineTo(x - 14, y); ctx.closePath(); ctx.fill();
    }
  });
}

// sleeve front: cocoa band with a gold line of text
function sleeveFront() {
  return canvasTexture(1600, 104, (ctx, W, H) => {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = goldGradient(ctx, W / 2 - 500, W / 2 + 500);
    ctx.textAlign = 'center';
    ctx.font = '600 32px Inter';
    ctx.letterSpacing = '14px';
    ctx.fillText('SEPTEM  ·  CRAFT CHOCOLATE  ·  EST. 2026', W / 2 + 7, H / 2 + 11);
  });
}

// the tray's front edge, visible while the sleeve is off
function trayFront() {
  return canvasTexture(1600, 96, (ctx, W, H) => {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COCOA;
    ctx.textAlign = 'center';
    ctx.font = '600 34px Inter';
    ctx.letterSpacing = '16px';
    ctx.fillText('THE BOX OF SEVEN', W / 2 + 8, H / 2 + 12);
  });
}

// the note card that fills the eighth slot
function noteCard(colors) {
  return canvasTexture(560, Math.round(560 * BAR.BOX_L / BAR.W), (ctx, W, H) => {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, W - 52, H - 52);
    drawMark(ctx, W / 2, 230, 96, colors, CREAM);

    ctx.textAlign = 'center';
    ctx.fillStyle = COCOA;
    ctx.font = 'italic 600 84px Fraunces';
    ctx.fillText('Seven', W / 2, 470);
    ctx.fillText('ways to', W / 2, 560);
    const g = ctx.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0);
    colors.forEach((c, i) => g.addColorStop(i / 6, c));
    ctx.fillStyle = g;
    ctx.fillText('melt.', W / 2, 650);

    ctx.fillStyle = COCOA;
    ctx.globalAlpha = 0.6;
    ctx.font = '600 20px Inter';
    ctx.letterSpacing = '6px';
    ctx.fillText('HAND-TEMPERED', W / 2 + 3, 770);
    ctx.fillText('IN SMALL BATCHES', W / 2 + 3, 806);
    ctx.globalAlpha = 1;
    ctx.font = 'italic 400 30px Fraunces';
    ctx.letterSpacing = '0px';
    ctx.fillText('With love, the Septem kitchen', W / 2, H - 120);
  });
}

export function createGiftBox(products) {
  const colors = products.map(p => p.bg);
  const cocoa = new THREE.MeshPhysicalMaterial({ color: SLEEVE, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.35 });
  const paper = new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.85 });
  const gold = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.28 });
  // dim the studio reflections on the printed card so the dark cocoa stays rich instead of milky
  const print = tex => new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, envMapIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: -1 });
  const rb = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, r);

  const group = new THREE.Group();
  const place = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

  // tray: cream card, gold dividers forming the eight slots
  const tray = new THREE.Group();
  place(tray, rb(TW, FLOOR, TD), paper, 0, FLOOR / 2, 0);
  place(tray, rb(TW, TH, WALL), paper, 0, TH / 2, TD / 2 - WALL / 2);
  place(tray, rb(TW, TH, WALL), paper, 0, TH / 2, -TD / 2 + WALL / 2);
  place(tray, rb(WALL, TH, ID), paper, TW / 2 - WALL / 2, TH / 2, 0);
  place(tray, rb(WALL, TH, ID), paper, -TW / 2 + WALL / 2, TH / 2, 0);
  const colDiv = rb(DIV, 0.36, ID, 0.01), rowDiv = rb(IW, 0.36, DIV, 0.01);
  for (let k = 0; k <= COLS; k++) place(tray, colDiv, gold, -IW / 2 + DIV / 2 + k * (BAR.W + DIV), FLOOR + 0.18, 0);
  for (let k = 0; k <= ROWS; k++) place(tray, rowDiv, gold, 0, FLOOR + 0.18, -ID / 2 + DIV / 2 + k * (BAR.BOX_L + DIV));
  place(tray, new THREE.PlaneGeometry(TW - 0.12, TH - 0.12), print(trayFront()), 0, TH / 2, TD / 2 + 0.002);

  // the note card lying in the eighth slot
  const card = place(tray, new THREE.BoxGeometry(BAR.W - 0.06, 0.04, BAR.BOX_L - 0.06), paper, slotX(CARD_SLOT), FLOOR + 0.02, slotZ(CARD_SLOT));
  const cardFace = new THREE.Mesh(new THREE.PlaneGeometry(BAR.W - 0.08, BAR.BOX_L - 0.08), print(noteCard(colors)));
  cardFace.rotation.x = -Math.PI / 2;   // faces up, reads front-to-back like the bars
  cardFace.position.y = 0.022;
  card.add(cardFace);
  group.add(tray);

  // outer sleeve: four printed walls, open at both ends, slides along x
  const sleeve = new THREE.Group();
  const yTop = SH + SK / 2 - 0.015, yBot = -SK / 2 - 0.015, zFront = SD / 2 + SK / 2;
  place(sleeve, rb(SL, SK, SD + 2 * SK), cocoa, 0, yTop, 0);
  place(sleeve, rb(SL, SK, SD + 2 * SK), cocoa, 0, yBot, 0);
  place(sleeve, rb(SL, SH, SK), cocoa, 0, SH / 2 - 0.015, zFront);
  place(sleeve, rb(SL, SH, SK), cocoa, 0, SH / 2 - 0.015, -zFront);
  const top = place(sleeve, new THREE.PlaneGeometry(SL - 0.04, SD + 2 * SK - 0.04), print(sleeveTop(colors)), 0, yTop + SK / 2 + 0.002, 0);
  top.rotation.x = -Math.PI / 2;   // faces up, artwork reads front-to-back
  place(sleeve, new THREE.PlaneGeometry(SL - 0.04, SH - 0.04), print(sleeveFront()), 0, SH / 2 - 0.015, zFront + SK / 2 + 0.002);
  group.add(sleeve);

  // G: pose + sleeve (0 = off to the right, 1 = closed). awayX: how far "off" is, in local units. peek: 0..1
  function apply(G, awayX, peek) {
    group.position.set(G.x, G.y, G.z);
    group.rotation.set(G.rx, 0, 0);
    group.scale.setScalar(G.s);
    sleeve.position.x = (1 - G.sleeve) * awayX + peek * TW * 0.42;
    sleeve.visible = G.sleeve > 0.001;
  }

  return { group, sleeve, apply };
}
