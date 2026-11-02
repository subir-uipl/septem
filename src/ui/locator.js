import { gsap } from 'gsap';

// Coarse outline of the contiguous United States (lon, lat), clockwise from the Pacific Northwest.
// It only needs to be good enough to decide which dots of the dot-matrix map are "inside".
const US = [
  [-124.7, 48.4], [-123.0, 49.0], [-95.2, 49.0], [-94.8, 49.4], [-89.6, 48.0], [-84.8, 46.5], [-83.5, 46.0],
  [-82.4, 43.0], [-83.1, 42.0], [-79.0, 42.9], [-76.5, 43.6], [-75.0, 45.0], [-71.5, 45.0], [-70.0, 46.7],
  [-69.2, 47.4], [-67.8, 47.1], [-67.0, 44.8], [-70.2, 43.7], [-70.6, 42.6], [-70.0, 41.8], [-71.9, 41.3],
  [-74.0, 40.6], [-74.1, 39.6], [-75.0, 38.8], [-75.9, 37.0], [-75.5, 35.2], [-77.9, 33.9], [-79.9, 32.7],
  [-81.4, 30.4], [-80.0, 26.7], [-80.4, 25.2], [-81.1, 25.1], [-81.8, 26.1], [-82.8, 27.9], [-83.6, 29.9],
  [-85.4, 29.7], [-87.3, 30.4], [-89.4, 30.2], [-89.2, 29.1], [-91.3, 29.3], [-93.8, 29.7], [-94.8, 29.3],
  [-97.2, 27.8], [-97.2, 25.9], [-99.5, 27.5], [-101.4, 29.8], [-103.0, 29.0], [-104.5, 29.6], [-106.5, 31.8],
  [-108.2, 31.8], [-108.2, 31.3], [-111.1, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-118.4, 33.8], [-120.6, 34.5],
  [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.8], [-124.4, 40.4], [-124.2, 42.0], [-124.0, 46.2]
];

const LON0 = -125.5, LAT0 = 49.8, KX = Math.cos(38 * Math.PI / 180);
const SCALE = 20;   // svg units per degree of latitude
const project = (lon, lat) => [(lon - LON0) * KX * SCALE, (LAT0 - lat) * SCALE];
const W = (-66.3 - LON0) * KX * SCALE, H = (LAT0 - 24.4) * SCALE;

function inside(lon, lat) {
  let hit = false;
  for (let i = 0, j = US.length - 1; i < US.length; j = i++) {
    const [xi, yi] = US[i], [xj, yj] = US[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export function initLocator({ stores, regions, colors, onSelect }) {
  const svg = document.getElementById('usMap');
  const list = document.getElementById('storeList');
  const card = document.getElementById('storeCard');
  const filters = document.getElementById('storeFilters');
  svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);

  // dot-matrix map: a grid of dots, kept where they fall inside the outline
  const step = 0.62, dots = [];
  for (let lat = LAT0 - step / 2; lat > 24.4; lat -= step) {
    for (let lon = LON0 + step / 2; lon < -66.3; lon += step / KX) {
      if (!inside(lon, lat)) continue;
      const [x, y] = project(lon, lat);
      dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2"/>`);
    }
  }

  const pins = stores.map((s, i) => {
    const [x, y] = project(s.lon, s.lat), c = colors[i % colors.length];
    return `<g class="pin${s.flagship ? ' pin--flag' : ''}" data-i="${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" style="--c:${c}" tabindex="0" role="button" aria-label="${s.name}, ${s.city}">
      <circle class="pin__ring" r="13"/><circle class="pin__dot" r="${s.flagship ? 9 : 7}"/>
    </g>`;
  });
  svg.innerHTML = `<g class="map__dots">${dots.join('')}</g><g class="map__pins">${pins.join('')}</g>`;

  list.innerHTML = stores.map((s, i) => `
    <li><button data-i="${i}" style="--c:${colors[i % colors.length]}">
      <i></i><span><b>${s.city}</b>${s.name}</span><em>${s.state}</em>
    </button></li>`).join('');
  filters.innerHTML = regions.map((r, i) => `<button data-r="${r.id}"${i ? '' : ' class="is-on"'}>${r.label}</button>`).join('');

  const pinEls = [...svg.querySelectorAll('.pin')];
  const itemEls = [...list.querySelectorAll('button')];
  let current = -1;

  function select(i) {
    if (i === current) return;
    current = i;
    const s = stores[i], c = colors[i % colors.length];
    pinEls.forEach((p, j) => p.classList.toggle('is-on', j === i));
    itemEls.forEach((b, j) => b.classList.toggle('is-on', j === i));
    card.style.setProperty('--c', c);
    card.innerHTML = `
      <p class="card__tag">${s.flagship ? 'Our kitchen' : 'Stockist'}</p>
      <h4>${s.name}</h4>
      <p>${s.address}<br>${s.city}, ${s.state}</p>
      <p class="card__hours">${s.hours}</p>
      <a href="#stockists">Get directions →</a>`;
    // pin position as a fraction of the map, so the card can sit next to it
    const [x, y] = project(s.lon, s.lat);
    const fx = x / W, fy = y / H;
    card.classList.toggle('is-left', fx > 0.6);
    card.style.left = `${fx * 100}%`;
    card.style.top = `${fy * 100}%`;
    gsap.fromTo(card, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out' });
    onSelect?.(s);
  }

  const pick = e => {
    const el = e.target.closest('[data-i]');
    if (el) select(Number(el.dataset.i));
  };
  svg.addEventListener('mouseover', pick);
  svg.addEventListener('click', pick);
  list.addEventListener('mouseover', pick);
  list.addEventListener('focusin', pick);

  filters.addEventListener('click', e => {
    const btn = e.target.closest('[data-r]');
    if (!btn) return;
    const region = regions.find(r => r.id === btn.dataset.r);
    [...filters.children].forEach(b => b.classList.toggle('is-on', b === btn));
    const shown = stores.map(s => !region.test || region.test(s));
    pinEls.forEach((p, i) => p.classList.toggle('is-dim', !shown[i]));
    itemEls.forEach((b, i) => { b.parentElement.hidden = !shown[i]; });
    if (!shown[current]) select(shown.indexOf(true));
  });

  select(stores.findIndex(s => s.flagship));
}
