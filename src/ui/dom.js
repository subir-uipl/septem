import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const pad = n => String(n).padStart(2, '0');

export function renderProducts(products) {
  document.getElementById('products').innerHTML = products.map((p, i) => `
    <section class="panel product${i % 2 ? ' product--flip' : ''}" id="${p.id}" data-index="${i}">
      <div class="layer-back"><span class="product__num">${pad(p.no)}</span></div>
      <div class="layer-front product__front">
        <div class="product__panel">
          <p class="eyebrow" data-r>No. ${p.no} · ${p.cocoa}% ${p.type}</p>
          <h2 class="product__name" data-split>${p.name}</h2>
          <p class="product__flavor" data-r>${p.flavor.replace('&', '&amp;')}</p>
          <p class="product__desc" data-r>${p.desc}</p>
          <ul class="notes" data-r>${p.notes.map(n => `<li>${n}</li>`).join('')}</ul>
          <dl class="stats" data-r>
            <div><dt>Cocoa</dt><dd>${p.cocoa}%</dd></div>
            <div><dt>Origin</dt><dd>${p.origin}</dd></div>
            <div><dt>Weight</dt><dd>70 g</dd></div>
          </dl>
          <div class="buy" data-r>
            <span class="price">$9</span>
            <button class="btn" data-add="${p.name}" data-color="${p.bg}">Add to bag <svg class="ico"><use href="#arrow-right"/></svg></button>
          </div>
        </div>
      </div>
    </section>`).join('');
}

// wrap each character so headings can rise in letter by letter
function split(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(' ')
    .map(w => `<span class="w" aria-hidden="true">${[...w].map(c => `<span class="c">${c}</span>`).join('')}</span>`)
    .join(' ');
}

export function initReveals(snap) {
  document.querySelectorAll('[data-split]').forEach(split);
  if (snap) return;

  // the box section's copy is revealed by the master timeline instead
  document.querySelectorAll('.product').forEach(sec => {
    gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 60%', end: 'bottom 40%', toggleActions: 'play reverse play reverse' } })
      .from(sec.querySelectorAll('[data-split] .c'), { yPercent: 115, rotate: 6, duration: 1, stagger: 0.04, ease: 'expo.out' })
      .from(sec.querySelectorAll('[data-r]'), { y: 34, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' }, '<0.15');
  });

  // the big numerals drift against the scroll
  document.querySelectorAll('.product').forEach(sec => {
    gsap.fromTo(sec.querySelector('.product__num'), { yPercent: -18 }, {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
}

export function heroIntro(bars, word) {
  // the chocolate letters drop in one by one with a soft bounce, then the boxes rise onto the shelf
  word.letters.forEach((l, i) => {
    l.intro.y = 3;
    gsap.to(l.intro, { y: 0, duration: 1.6, ease: 'elastic.out(1, 0.55)', delay: 0.15 + i * 0.08 });
  });
  bars.forEach((bar, b) => {
    Object.assign(bar.intro, { y: -5, ry: 1.6, sc: 0.7 });
    gsap.to(bar.intro, { y: 0, ry: 0, sc: 1, duration: 1.7, ease: 'expo.out', delay: 0.55 + Math.abs(b - 3) * 0.1 });
  });
  gsap.from('.hero [data-r]', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 1 });
}

export function initUI({ lenis, products, onIndexHover }) {
  // flavour swatches, hero index and footer marquee all come from the same data as the sections
  const swatches = document.getElementById('swatches');
  swatches.innerHTML = products.map(p => `<a href="#${p.id}" style="--c:${p.bg}" aria-label="${p.name}"><span>${p.name}</span></a>`).join('');
  const heroIndex = document.getElementById('heroIndex');
  heroIndex.innerHTML = products.map(p => `<a href="#${p.id}" style="--c:${p.bg}"><i></i><b>${pad(p.no)}</b><span>${p.name}</span></a>`).join('');
  const indexLinks = [...heroIndex.children];
  indexLinks.forEach((a, i) => {
    a.addEventListener('mouseenter', () => onIndexHover(i));
    a.addEventListener('mouseleave', () => onIndexHover(-1));
  });
  const names = products.map(p => `<span style="color:${p.bg}">${p.name}</span><i>✦</i>`).join('');
  document.querySelector('.footer__track').innerHTML = names + names;   // doubled for a seamless loop

  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else target.scrollIntoView({ behavior: 'smooth' });
  }));

  const dots = [...swatches.children];
  document.querySelectorAll('.panel').forEach(sec => {
    const idx = sec.dataset.index === undefined ? -1 : Number(sec.dataset.index);
    ScrollTrigger.create({
      trigger: sec, start: 'top center', end: 'bottom center',
      onToggle: self => { if (self.isActive) dots.forEach((d, i) => d.classList.toggle('is-active', i === idx)); }
    });
  });

  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toast = document.getElementById('toast');
  let hideTimer;
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    toast.querySelector('span').textContent = `${btn.dataset.add} added to your bag`;
    toast.querySelector('i').style.background = btn.dataset.color;
    gsap.fromTo(toast, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)', overwrite: true });
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => gsap.to(toast, { autoAlpha: 0, y: 20, duration: 0.35 }), 2200);
  });

  const form = document.querySelector('.news');
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.querySelector('button').textContent = 'Subscribed ✓';
  });

  // lets the 3D hover light up the matching index entry
  return {
    setHot: i => indexLinks.forEach((a, j) => a.classList.toggle('is-hot', j === i))
  };
}
