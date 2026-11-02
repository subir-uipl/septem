import './styles/main.scss';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { PRODUCTS, CREAM } from './data/products.js';
import { createStage } from './scene/stage.js';
import { createBar, BAR } from './scene/bar.js';
import { makeLabel } from './scene/label.js';
import { createIngredients } from './scene/ingredients.js';
import { createFloorShadow } from './scene/floorShadow.js';
import { createLetters } from './scene/letters.js';
import { createGiftBox, slotOf, GIFT } from './scene/giftbox.js';
import { makeLayout, buildTimeline } from './scroll/timeline.js';
import { renderProducts, initReveals, initUI, heroIntro } from './ui/dom.js';
import { initLocator } from './ui/locator.js';
import { STORES, REGIONS } from './data/stores.js';
import { rng } from './utils/rng.js';

gsap.registerPlugin(ScrollTrigger);

// ?snap skips smoothing and intro animations, so screenshots land on exact poses
const SNAP = new URLSearchParams(location.search).has('snap');
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// each hero letter is cast in a different chocolate from the range
const LETTER_CHOCOLATE = ['#c45a72', '#3f1e12', '#b37532', '#93ad58', '#5c2e1c', '#9a73b8'];
const HOVER_OUT = 0.75;   // how far a hovered box pushes its chocolate out

// the box labels are drawn on canvas, so the web fonts must be ready first
function loadFonts() {
  const faces = ['italic 600 100px Fraunces', 'italic 400 34px Fraunces', '600 100px Fraunces', '500 30px Inter', '600 30px Inter'];
  return Promise.race([
    Promise.all(faces.map(f => document.fonts.load(f))),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);
}

async function init() {
  renderProducts(PRODUCTS);
  await loadFonts();

  const stage = createStage(document.querySelector('.webgl'));
  const layout = makeLayout(stage);

  const word = await createLetters('Septem', LETTER_CHOCOLATE);
  stage.scene.add(word.group);

  // invisible, fixed hover zone per box (covering the box and the space its chocolate rises into),
  // so lifting the chocolate never pulls the hover target out from under the cursor
  const hitGeo = new THREE.BoxGeometry(BAR.W + 0.2, BAR.BOX_L + HOVER_OUT * BAR.OUT + 0.1, 0.5);
  hitGeo.translate(0, (HOVER_OUT * BAR.OUT) / 2, 0);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  const bars = PRODUCTS.map((p, i) => {
    const bar = createBar(p, makeLabel(p, i, PRODUCTS, 'front'), makeLabel(p, i, PRODUCTS, 'back', rng(900 + i)), i);
    Object.assign(bar.st, layout.display(i));
    bar.shadow = createFloorShadow();
    bar.hit = new THREE.Mesh(hitGeo, hitMat);
    bar.hit.userData.bar = i;
    bar.hover = 0;
    bar.pack = { v: 0 };   // 0 = posed by the timeline, 1 = lying in its gift-box slot
    stage.scene.add(bar.group, bar.shadow, bar.hit);
    return bar;
  });
  const ings = PRODUCTS.map((p, i) => {
    const ing = createIngredients(p, i);
    stage.scene.add(ing.group);
    return ing;
  });
  const theme = { ...CREAM };

  const giftBox = createGiftBox(PRODUCTS);
  const gift = { ...layout.gift(), sleeve: 0 };   // pose is set every frame; the timeline only drives `sleeve`
  const giftShadow = createFloorShadow();
  let giftPeek = 0;
  stage.scene.add(giftBox.group, giftShadow);

  let lenis = null;
  if (!SNAP && !REDUCED) {
    lenis = new Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToProduct = i => {
    const target = document.getElementById(PRODUCTS[i].id);
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else target.scrollIntoView({ behavior: 'smooth' });
  };

  initReveals(SNAP);   // splits headings into letters first; the timeline animates the box title's letters
  const tl = buildTimeline({ bars, ings, theme, gift, layout, products: PRODUCTS, cream: CREAM, snap: SNAP });
  let indexHover = -1;
  const ui = initUI({ lenis, products: PRODUCTS, onIndexHover: i => { indexHover = i; } });
  initLocator({ stores: STORES, regions: REGIONS, colors: PRODUCTS.map(p => p.bg) });

  // pointer: camera parallax everywhere, box hover in the hero
  const mouse = { x: 0, y: 0, moved: false }, eased = { x: 0, y: 0 };
  const ndc = new THREE.Vector2(), raycaster = new THREE.Raycaster();
  let hovered = -1;
  if (!SNAP) {
    window.addEventListener('pointermove', e => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      ndc.set(mouse.x * 2, -mouse.y * 2);
      mouse.moved = true;
    });
    window.addEventListener('click', e => {
      if (hovered < 0 || e.target.closest('a, button, input, form')) return;
      scrollToProduct(hovered);
    });
  }

  const nameTag = document.getElementById('cursorTag');
  const tagPos = { x: 0, y: 0 }, tagAnchor = new THREE.Vector3();
  let tagFor = -1;

  const root = document.documentElement;
  const glowEl = document.getElementById('glow'), spotEl = document.getElementById('spot');
  const spot = { x: 72 };
  const navEl = document.getElementById('nav'), footerEl = document.getElementById('footer');
  const box = document.getElementById('box');
  const swatches = document.getElementById('swatches');
  const shadowTint = new THREE.Color();

  gsap.ticker.add(time => {
    const t = SNAP ? 0 : time;
    eased.x += (mouse.x - eased.x) * 0.06;
    eased.y += (mouse.y - eased.y) * 0.06;

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--ink', theme.ink);
    stage.hemi.color.set(theme.bg);
    stage.hemi.groundColor.copy(stage.hemi.color).multiplyScalar(0.45);
    shadowTint.copy(stage.hemi.color).multiplyScalar(0.3);   // shadows take on the section colour

    const { w, h } = stage.view();
    const heroWeight = Math.max(0, 1 - tl.time() / 0.3);     // 1 in the hero, 0 once you scroll away

    // background layers: blooms in the cream sections, a spotlight behind the bar in the coloured ones
    const boxWeight = Math.min(1, Math.max(0, (tl.time() - 7.35) / 0.45));
    const cream = Math.max(heroWeight, boxWeight);
    glowEl.style.opacity = cream;
    glowEl.style.visibility = cream > 0.001 ? '' : 'hidden';   // blurred blooms are costly to composite, even when transparent
    spotEl.style.opacity = 1 - cream;
    const onStage = Math.min(6, Math.max(0, Math.round(tl.time()) - 1));
    spot.x += ((onStage % 2 === 0 ? 72 : 28) - spot.x) * 0.06;
    spotEl.style.setProperty('--sx', spot.x + '%');

    // the camera drifts with the pointer, so the letters, the boxes and the shelf separate in depth
    const drift = 0.25 + 0.75 * heroWeight;
    stage.camera.position.set(eased.x * 0.9 * drift, -eased.y * 0.6 * drift, 11);
    stage.camera.lookAt(0, 0, 0);

    // 3D letters: float, lean towards the pointer, and step forward when the pointer passes over them
    const wl = layout.word(), wscale = wl.width / word.width;
    word.group.visible = tl.time() < 1.4;
    word.group.position.set(0, wl.y + tl.time() * h * 1.05, wl.z);
    word.group.scale.setScalar(wscale);
    const pointerEm = (eased.x * w) / wscale;
    word.letters.forEach((l, i) => {
      const near = mouse.moved ? Math.exp(-((pointerEm - l.base.x) ** 2) / 0.3) * heroWeight : 0;
      const bob = Math.sin(t * 0.9 + l.phase) * 0.025;
      l.mesh.position.set(l.base.x, l.base.y + l.intro.y + bob + tl.time() * i * 0.06, near * 0.3);
      l.mesh.rotation.set(-eased.y * 0.3 + Math.sin(t * 0.7 + l.phase) * 0.04, eased.x * 0.45 + near * 0.3, 0);
    });

    // which box is under the pointer (hero only), tested against the fixed hover zones
    hovered = -1;
    if (heroWeight > 0.6 && mouse.moved) {
      bars.forEach(bar => {
        const { st } = bar;
        bar.hit.position.set(st.x, st.y, st.z);
        bar.hit.rotation.set(st.rx, st.ry, st.rz);
        bar.hit.scale.setScalar(st.s);
        bar.hit.updateMatrixWorld();
      });
      raycaster.setFromCamera(ndc, stage.camera);
      const hit = raycaster.intersectObjects(bars.map(b => b.hit), false)[0];
      if (hit) hovered = hit.object.userData.bar;
    }
    const hot = indexHover >= 0 ? indexHover : hovered;
    document.body.style.cursor = hovered >= 0 ? 'pointer' : '';
    ui.setHot(hot);

    // the pack rides up with the box section (exactly one viewport per unit of t), then stays put while pinned
    Object.assign(gift, layout.gift());
    gift.y -= Math.max(0, 8 - tl.time()) * h;

    bars.forEach((bar, b) => {
      const { st, intro, shadow } = bar;
      bar.hover += ((b === hot ? 1 : 0) - bar.hover) * 0.1;
      const pk = bar.pack.v, free = 1 - pk;
      let s = st.s * intro.sc;
      const bob = Math.sin(t * 1.1 + b * 0.9) * 0.05 * free;
      let x = st.x, y = st.y + intro.y + bob + bar.hover * 0.08 * st.s, z = st.z;
      let rx = st.rx + eased.y * 0.08 * free;
      let ry = (st.ry + intro.ry) * (1 - bar.hover * 0.7) + Math.sin(t * 0.6 + b) * 0.06 * heroWeight * (1 - bar.hover);
      let rz = st.rz;
      if (pk > 0) {
        const sl = slotOf(gift, b);
        x += (sl.x - x) * pk; y += (sl.y - y) * pk; z += (sl.z - z) * pk;
        rx += (sl.rx - rx) * pk; ry += (sl.ry - ry) * pk; rz += (sl.rz - rz) * pk;
        s += (sl.s - s) * pk;
      }

      bar.group.position.set(x, y, z);
      bar.group.rotation.set(rx, ry, rz);
      bar.group.scale.setScalar(s);
      bar.group.visible = Math.abs(y) < h / 2 + 2.6;   // skip boxes parked off-screen
      bar.apply(Math.max(st.out, bar.hover * HOVER_OUT));   // hovering slides the chocolate out of its box

      // contact shadow on the "floor" under the box: smaller and lighter the higher it floats
      const k = Math.max(0.35, 1 - bob * 2.5);
      shadow.position.set(st.x, st.y - (BAR.BOX_L / 2 + 0.2) * s, st.z - 0.3);
      shadow.scale.set(2.5 * st.s * k, 0.36 * st.s * k, 1);
      shadow.material.color.copy(shadowTint);
      shadow.material.opacity = 0.55 * k * Math.min(1, Math.max(0, 1 + intro.y / 3)) * free;
      shadow.visible = bar.group.visible;
    });
    ings.forEach((ing, b) => ing.update(t, layout.rest(b)));

    // pack: only exists in the box section. Once closed, hovering slides the sleeve back for a peek
    giftBox.group.visible = tl.time() > 6.9 && gift.y + 3 * gift.s > -h / 2 - 0.5;
    let overGift = false;
    if (tl.time() > 8.9 && mouse.moved) {
      raycaster.setFromCamera(ndc, stage.camera);
      overGift = raycaster.intersectObject(giftBox.group, true).length > 0;
    }
    giftPeek += ((overGift ? 1 : 0) - giftPeek) * 0.08;
    giftBox.apply(gift, GIFT.TW + (w / 2) / gift.s + 1.5, giftPeek);
    giftShadow.visible = giftBox.group.visible;
    giftShadow.position.set(gift.x, gift.y - 1.7 * gift.s, gift.z - 0.6);
    giftShadow.scale.set(GIFT.TW * gift.s * 0.92, 0.9 * gift.s, 1);
    giftShadow.material.color.copy(shadowTint);
    giftShadow.material.opacity = 0.5;

    // name tag centred just above the chocolate that's sliding out, kept inside the viewport
    if (hot >= 0) {
      const p = PRODUCTS[hot], bar = bars[hot];
      if (hot !== tagFor) {
        nameTag.querySelector('i').style.background = p.bg;
        nameTag.querySelector('span').textContent = `No. ${p.no} · ${p.name}`;
        nameTag.querySelector('small').textContent = p.flavor;
      }
      const g = bar.group, out = Math.max(bar.st.out, bar.hover * HOVER_OUT);
      tagAnchor.set(g.position.x, g.position.y + (BAR.L / 2 + out * BAR.OUT + 0.25) * g.scale.y, g.position.z).project(stage.camera);
      const tw = nameTag.offsetWidth, th = nameTag.offsetHeight;
      const tx = Math.min(Math.max((tagAnchor.x * 0.5 + 0.5) * window.innerWidth - tw / 2, 16), window.innerWidth - tw - 16);
      const ty = Math.max((-tagAnchor.y * 0.5 + 0.5) * window.innerHeight - th - 10, 90);
      const snap = tagFor < 0;   // appear in place rather than sliding in from the last spot
      tagPos.x = snap ? tx : tagPos.x + (tx - tagPos.x) * 0.25;
      tagPos.y = snap ? ty : tagPos.y + (ty - tagPos.y) * 0.25;
      nameTag.style.transform = `translate3d(${tagPos.x}px, ${tagPos.y}px, 0)`;
    }
    tagFor = hot;
    nameTag.classList.toggle('is-on', hot >= 0);

    // past the last section the 3D layer scrolls up with the page instead of sitting under the footer
    const overflow = Math.max(0, window.scrollY + window.innerHeight - (box.offsetTop + box.offsetHeight));
    stage.renderer.domElement.style.transform = overflow ? `translate3d(0, ${-overflow}px, 0)` : '';
    swatches.style.opacity = overflow > 60 || heroWeight > 0.5 ? 0 : '';
    navEl.classList.toggle('is-dark', footerEl.getBoundingClientRect().top < 40);   // the hero has its own index

    // once the footer covers the whole screen there is nothing to draw
    if (overflow < window.innerHeight) stage.renderer.render(stage.scene, stage.camera);
  });

  const loader = document.getElementById('loader');
  if (SNAP) {
    loader.remove();
    return;
  }
  gsap.to(loader, { autoAlpha: 0, duration: 0.7, ease: 'power2.out', onComplete: () => loader.remove() });
  heroIntro(bars, word);
}

init();
