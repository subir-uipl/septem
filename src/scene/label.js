import * as THREE from 'three';

const CREAM = '#fbf3e6';
const W = 726, H = 1331;   // matches the label plane's aspect (1.8 x 3.3)

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else line = test;
  }
  ctx.fillText(line, x, y);
}

function heptagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 7;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

// text set around a circle, centred on the top
function circleText(ctx, text, cx, cy, r) {
  const chars = [...text], step = (Math.PI * 2) / chars.length;
  chars.forEach((ch, i) => {
    const a = -Math.PI / 2 + i * step;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

function drawFront(ctx, p) {
  // faint tone-on-tone heptagon pattern across the whole face
  ctx.strokeStyle = 'rgba(255, 246, 232, .07)';
  ctx.lineWidth = 2;
  for (let y = 0, row = 0; y < H + 40; y += 52, row++) {
    for (let x = row % 2 ? 26 : 0; x < W + 40; x += 52) {
      heptagon(ctx, x, y, 12);
      ctx.stroke();
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 3;
  heptagon(ctx, W / 2, 100, 20);
  ctx.stroke();
  ctx.font = '600 32px Inter';
  ctx.letterSpacing = '14px';
  ctx.fillText('SEPTEM', W / 2 + 7, 176);

  // cocoa seal: double ring, origin and type set around it, cocoa percentage in the flavour colour
  const cx = W / 2, cy = 480, R = 200;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R - 62, 0, Math.PI * 2); ctx.stroke();
  ctx.font = '600 24px Inter';
  ctx.letterSpacing = '0px';
  circleText(ctx, ` SINGLE ORIGIN · ${p.origin.toUpperCase()} · ${p.type.toUpperCase()} ·`, cx, cy, R - 40);
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.bg;
  ctx.font = 'italic 600 128px Fraunces';
  ctx.fillText(`${p.cocoa}%`, cx, cy + 34);
  ctx.fillStyle = CREAM;
  ctx.font = '600 20px Inter';
  ctx.letterSpacing = '8px';
  ctx.fillText('COCOA', cx + 4, cy + 80);

  ctx.letterSpacing = '0px';
  ctx.font = 'italic 600 132px Fraunces';
  ctx.fillText(p.name, W / 2, 880);

  ctx.font = '600 28px Inter';
  ctx.letterSpacing = '7px';
  ctx.globalAlpha = 0.85;
  ctx.fillText(p.flavor.toUpperCase(), W / 2 + 3, 950);
  ctx.letterSpacing = '1px';
  ctx.font = 'italic 400 34px Fraunces';
  ctx.globalAlpha = 0.7;
  ctx.fillText(p.notes.join(' · '), W / 2, 1040);

  ctx.globalAlpha = 0.35;
  ctx.fillRect(70, 1180, W - 140, 2);
  ctx.globalAlpha = 1;

  ctx.font = '500 26px Inter';
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'left';
  ctx.fillText(`${p.cocoa}% ${p.type}`, 70, 1245);
  ctx.textAlign = 'right';
  ctx.fillText('70 g', W - 70, 1245);
}

function drawBack(ctx, p, rand) {
  ctx.textAlign = 'left';
  ctx.fillStyle = CREAM;
  ctx.font = '600 24px Inter';
  ctx.letterSpacing = '10px';
  ctx.fillText('SEPTEM', 70, 110);

  ctx.letterSpacing = '0px';
  ctx.font = 'italic 600 64px Fraunces';
  ctx.fillText(p.name, 70, 200);

  ctx.font = '600 20px Inter';
  ctx.letterSpacing = '4px';
  ctx.globalAlpha = 0.7;
  ctx.fillText('INGREDIENTS', 70, 290);
  ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';
  ctx.font = '400 26px Inter';
  wrapText(ctx, `Cocoa mass, cocoa butter, cane sugar, ${p.flavor.toLowerCase().replace('&', 'and')}, sunflower lecithin. ${p.cocoa}% cocoa solids. Origin: ${p.origin}.`, 70, 340, W - 140, 38);

  // barcode
  let x = 70;
  for (let i = 0; i < 44; i++) {
    const w = 2 + Math.floor(rand() * 3) * 2;
    ctx.fillRect(x, 1060, w, 110);
    x += w + 3 + Math.floor(rand() * 3);
  }
  ctx.font = '500 20px Inter';
  ctx.globalAlpha = 0.75;
  ctx.fillText('Hand-tempered in small batches', 70, 1250);
  ctx.globalAlpha = 1;
}

export function makeLabel(p, index, all, side, rand) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (side === 'front') drawFront(ctx, p, index, all);
  else drawBack(ctx, p, rand);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
