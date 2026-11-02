import { gsap } from 'gsap';
import { BAR } from '../scene/bar.js';
import { GIFT, slotOf } from '../scene/giftbox.js';

const PROPS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 's'];

// Every pose is computed from the current viewport, so it stays right after a resize.
export function makeLayout(stage) {
  const mobile = () => window.innerWidth < 820;
  const V = () => stage.view();
  const HALF = BAR.BOX_L / 2;   // centre-to-floor of a standing box, before scaling

  // hero: the seven closed boxes stand on a shelf in front of the 3D letters.
  // Desktop is one gently curved row; mobile staggers them into two rows to fit.
  const display = b => {
    const k = b - 3;
    if (mobile()) {
      const front = b % 2 === 0, s = 0.26;
      return { x: k * 0.33, y: -0.55 + (front ? 0 : 0.42) + HALF * s, z: front ? 0.6 : -0.2, rx: 0.04, ry: 0, rz: 0, s };
    }
    const s = 0.46;
    return { x: k * 1.2, y: -1.3 + HALF * s, z: 0.6 - k * k * 0.05, rx: 0.04, ry: -k * 0.07, rz: 0, s };
  };

  // the 3D letters: baseline height, depth and overall width
  const word = () => {
    const { w } = V();
    return mobile() ? { y: 1.15, z: -1.6, width: w * 0.9 } : { y: 1.1, z: -1.9, width: Math.min(w * 0.68, 8.4) };
  };

  // product section: box on the opposite side to the text, turned towards it
  const rest = b => {
    const { w, h } = V(), side = b % 2 === 0 ? 1 : -1;
    if (mobile()) return { x: 0, y: h * 0.1, z: 0, rx: 0.1, ry: -0.4, rz: 0.06, s: 0.54 };
    return { x: side * Math.min(w * 0.22, 3.2), y: -0.55, z: 0, rx: 0.1, ry: -side * 0.42, rz: side * 0.06, s: 0.88 };
  };

  const below = b => { const r = rest(b), { h } = V(); return { ...r, y: -h / 2 - 4.2, ry: r.ry - 2.4, rz: r.rz + 0.5 }; };
  const above = b => { const r = rest(b), { h } = V(); return { ...r, y: h / 2 + 4.2, ry: r.ry + 2.4, rz: r.rz - 0.4 }; };

  // the gift box, tilted towards the camera so we look down into it.
  // Desktop: large, on the right half (the copy sits on the left). Mobile: below the copy.
  const RX = 0.95, LOW = Math.sin(RX) * GIFT.TD / 2, HIGH = Math.cos(RX) * (GIFT.TH + 0.1) + LOW;
  const gift = () => {
    const { w, h } = V();
    if (mobile()) {
      const s = Math.min(w * 0.82 / GIFT.TW, h * 0.4 / (LOW + HIGH));
      return { x: 0, y: -h / 2 + h * 0.08 + LOW * s, z: 0, rx: RX, s };
    }
    // kept a little smaller than the half-width: perspective enlarges the box's near corner
    const s = Math.min(w * 0.37 / GIFT.TW, h * 0.66 / (LOW + HIGH));
    return { x: w * 0.215, y: (LOW - HIGH) / 2 * s, z: 0, rx: RX, s };
  };
  // each bar starts above the screen, straight over its slot and a little in front, then falls in
  const dropFrom = b => {
    const sl = slotOf(gift(), b), { h } = V();
    return { x: sl.x, y: h / 2 + 2.6, z: sl.z + 1.4, rx: 0.3, ry: (b % 2 ? 1 : -1) * 0.45, rz: (b % 3 - 1) * 0.25, s: sl.s };
  };

  return { display, word, rest, below, above, gift, dropFrom };
}

// turn a layout into function-based tween values (re-evaluated on ScrollTrigger refresh)
const pose = (fn, b, extra = {}) => {
  const o = { ...extra };
  for (const k of PROPS) o[k] = () => fn(b)[k];
  return o;
};
/*
  One scrubbed timeline drives the whole page. Time is measured in viewports scrolled:
  t = 0 is the hero, t = 1..7 are the bars, t = 8 is the box section reaching the top.
  The box section is 200vh with sticky content, so t = 8..9 plays while it stays pinned:
  the seven bars fall into the gift box one by one, then the sleeve slides over it.
*/
export function buildTimeline({ bars, ings, theme, gift, layout, products, cream, snap }) {
  const L = layout;
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      endTrigger: '#box',
      end: 'bottom bottom',
      scrub: snap ? true : 0.9,
      invalidateOnRefresh: true
    }
  });

  bars.forEach((bar, b) => {
    const st = bar.st, s = b + 1;

    tl.set(st, pose(L.display, b, { out: 0, snap: 0 }), 0);

    // arrive
    if (b === 0) {
      tl.to(st, { ...pose(L.rest, b), duration: 0.75, ease: 'power3.inOut' }, 0.15);
    } else {
      tl.to(st, { ...pose(L.below, b), duration: 0.5, ease: 'power2.in' }, 0.1 + b * 0.035);
      tl.to(st, { ...pose(L.rest, b), duration: 0.7, ease: 'power3.out' }, s - 0.8);
    }

    // on stage: slide the chocolate out of its box, snap the corner off, turn slowly
    tl.to(st, { out: 1, duration: 0.45, ease: 'power2.out' }, s - 0.45);
    tl.to(st, { snap: 1, duration: 0.4, ease: 'back.out(1.7)' }, s - 0.25);
    tl.to(st, { ry: () => L.rest(b).ry + 0.4, duration: 0.25, ease: 'none' }, s - 0.1);

    // leave upwards
    tl.to(st, { ...pose(L.above, b), duration: 0.65, ease: 'power2.in' }, s + 0.15);

    // packing: wait off-screen above the slot (chocolate back in its box), then fall in, one after another
    tl.set(st, { ...pose(L.dropFrom, b), out: 0, snap: 0 }, 7.9);
    tl.fromTo(bar.pack, { v: 0 }, { v: 1, duration: 0.2, ease: 'power2.in' }, 8.02 + b * 0.075);

    // floating ingredients and section colour
    tl.to(ings[b].st, { p: 1, duration: 0.45, ease: 'power2.out' }, s - 0.5);
    tl.to(ings[b].st, { p: 0, duration: 0.4, ease: 'power2.in' }, s + 0.2);
    tl.to(theme, { bg: products[b].bg, ink: products[b].ink, duration: 0.4, ease: 'none' }, s - 0.55);
  });

  tl.to(theme, { bg: cream.bg, ink: cream.ink, duration: 0.4, ease: 'none' }, 7.4);

  // copy appears as the section arrives; the pack below it never crosses it
  tl.fromTo('.box__title .c', { yPercent: 115 }, { yPercent: 0, duration: 0.25, stagger: 0.015, ease: 'expo.out' }, 7.5);
  tl.fromTo('.box [data-r]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.05, ease: 'power3.out' }, 7.6);

  // with all seven inside, the sleeve slides over the tray from the right
  tl.fromTo(gift, { sleeve: 0 }, { sleeve: 1, duration: 0.24, ease: 'power3.inOut' }, 8.7);

  tl.set({}, {}, 9);   // pad to exactly nine viewports
  return tl;
}
