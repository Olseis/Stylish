/* Mo.Co Fashion — carga los JSON de /data y pinta cada página */
(() => {
  'use strict';

  const page = document.body.dataset.page;
  const root = document.getElementById('content');
  const searchInput = document.getElementById('search');

  /* ---------- utilidades ---------- */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const norm = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const rarClass = r => (r ? 'r-' + norm(r).replace(/[^a-z]/g, '') : '');
  const load = async name => {
    const res = await fetch('data/' + name + '.json');
    if (!res.ok) throw new Error(name + '.json: ' + res.status);
    return res.json();
  };

  function showError(err) {
    const box = el('div', 'error');
    box.append(
      el('strong', null, 'The data could not be loaded.'),
      el('br'),
      document.createTextNode('Open the site through a local server instead of double-clicking the file: run '),
      el('code', null, 'python -m http.server'),
      document.createTextNode(' inside the fashion folder and visit http://localhost:8000. (' + err.message + ')')
    );
    root.replaceChildren(box);
  }

  /* ---------- tarjeta ---------- */
  // opts: {title, sub[], source, rarity, image, levels[], alt}
  function card(o) {
    const hasImg = !!o.image;
    const c = el(hasImg ? 'button' : 'div', 'card ' + rarClass(o.rarity));
    if (hasImg) c.type = 'button';
    if (hasImg) {
      const t = el('div', 'thumb');
      const img = new Image();
      img.src = o.image;
      img.alt = o.title || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      t.append(img);
      c.append(t);
    }
    if (o.levels && o.levels.length) {
      const l = el('div', 'levels');
      o.levels.forEach(src => {
        const i = new Image();
        i.src = src; i.alt = ''; i.loading = 'lazy';
        l.append(i);
      });
      c.append(l);
    }
    const m = el('div', 'meta');
    m.append(el('strong', null, o.title || '—'));
    (o.sub || []).filter(Boolean).forEach(s => m.append(el('span', 'sub', s)));
    if (o.source) m.append(el('span', 'src', o.source));
    if (o.rarity) m.append(el('span', 'rar ' + rarClass(o.rarity), o.rarity));
    c.append(m);
    c.dataset.rarity = o.rarity || '';
    c.dataset.text = norm([o.title, ...(o.sub || []), o.source, o.rarity, o.group].join(' '));
    c._info = o;
    return c;
  }

  function group(title, note, cards, gridClass) {
    const g = el('section', 'group');
    const head = el('div', 'group-head');
    head.append(el('h2', null, title));
    if (note) head.append(el('p', null, note));
    const grid = el('div', 'grid' + (gridClass ? ' ' + gridClass : ''));
    grid.append(...cards);
    g.append(head, grid);
    return g;
  }

  /* ---------- visor ampliado ---------- */
  const dlg = document.createElement('dialog');
  dlg.innerHTML = '<button class="viewer-close" type="button">Close</button><div class="viewer-img"><img alt=""></div><div class="viewer-body"></div>';
  document.body.append(dlg);
  dlg.querySelector('.viewer-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  function openViewer(o) {
    const img = dlg.querySelector('img');
    img.src = o.image; img.alt = o.title || '';
    const body = dlg.querySelector('.viewer-body');
    body.replaceChildren(el('h3', null, o.title || ''));
    [...(o.sub || []), o.source, o.rarity].filter(Boolean).forEach(t => body.append(el('p', null, t)));
    dlg.showModal();
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('button.card');
    if (c && c._info) openViewer(c._info);
  });

  /* ---------- barra de herramientas + filtros ---------- */
  let cards = [], groups = [], activeRarity = 'all', countEl = null, tabFilter = null;

  function buildToolbar(title, rarities) {
    const bar = el('div', 'toolbar');
    bar.append(el('h1', null, title));
    const chips = el('div', 'chips');
    const opts = ['all', ...rarities];
    opts.forEach(r => {
      const b = el('button', 'chip', r === 'all' ? 'All' : r);
      b.type = 'button';
      b.setAttribute('aria-pressed', r === 'all' ? 'true' : 'false');
      b.addEventListener('click', () => {
        activeRarity = r;
        chips.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        applyFilters();
      });
      chips.append(b);
    });
    countEl = el('span', 'count');
    countEl.setAttribute('aria-live', 'polite');
    bar.append(chips, countEl);
    return bar;
  }

  function applyFilters() {
    const q = norm(searchInput ? searchInput.value.trim() : '');
    let shown = 0;
    cards.forEach(c => {
      const ok = (activeRarity === 'all' || c.dataset.rarity === activeRarity) &&
                 (!q || c.dataset.text.includes(q));
      c.hidden = !ok;
    });
    groups.forEach(g => {
      const n = g.querySelectorAll('.card:not([hidden])').length;
      const inTab = !tabFilter || tabFilter(g);
      g.hidden = n === 0 || !inTab;
      if (!g.hidden) shown += n;
    });
    if (countEl) countEl.textContent = shown + ' item' + (shown === 1 ? '' : 's');
    const prev = root.querySelector('.empty');
    if (prev) prev.remove();
    if (shown === 0) root.append(el('p', 'empty', 'No results. Try another search or clear the rarity filter.'));
  }
  if (searchInput) searchInput.addEventListener('input', applyFilters);

  function finish(title, sections) {
    const rarities = [...new Set(cards.map(c => c.dataset.rarity).filter(Boolean))];
    const order = ['Basic', 'Epic', 'Legendary'];
    rarities.sort((a, b) => (order.indexOf(a) + 99 * (order.indexOf(a) < 0)) - (order.indexOf(b) + 99 * (order.indexOf(b) < 0)));
    root.replaceChildren(buildToolbar(title, rarities));
    root.append(...sections);
    applyFilters();
  }

  /* ---------- páginas ---------- */
  async function renderSets(file, title) {
    const data = await load(file);
    const sections = data.sets.map(s => {
      const cs = s.items.map(it => card({
        title: it.piece || it.variant, sub: it.piece ? [it.variant] : [],
        source: it.source, rarity: it.rarity, image: it.image, group: s.name
      }));
      cards.push(...cs);
      const g = group(s.name, s.note, cs);
      groups.push(g);
      return g;
    });
    finish(title, sections);
  }

  async function renderRides() {
    const data = await load('rides');
    const sections = data.species.map(sp => {
      const cs = sp.variants.map(v => card({
        title: v.name || v.model, sub: [v.name ? v.model : null, v.collection],
        source: v.source, rarity: v.rarity, image: v.image, group: sp.name
      }));
      cards.push(...cs);
      const g = group(sp.name, null, cs);
      groups.push(g);
      return g;
    });
    finish('Rides', sections);
  }

  async function renderWeapons() {
    const data = await load('weapons');
    const by = new Map();
    data.items.forEach(i => { if (!by.has(i.weapon)) by.set(i.weapon, []); by.get(i.weapon).push(i); });
    const sections = [...by].map(([w, items]) => {
      const cs = items.map(i => card({
        title: i.name, sub: [i.variant, i.collection], source: i.source,
        rarity: i.rarity, image: i.image, group: w
      }));
      cards.push(...cs);
      const g = group(w, null, cs);
      groups.push(g);
      return g;
    });
    finish('Weapon Skins', sections);
  }

  async function renderDecorations() {
    const [data, titles] = await Promise.all([load('decorations'), load('titles')]);
    const xp = new Map(titles.titles.map(t => [norm(t.title), t.cosmetic_xp]));
    const sections = data.sections.map(sec => {
      const cs = sec.items.map(i => {
        const lines = (i.name || '').split('\n').map(s => s.trim()).filter(Boolean);
        const sub = lines.slice(1);
        if (sec.name === 'Titles' && xp.has(norm(lines[0]))) sub.push(xp.get(norm(lines[0])) + ' Cosmetic XP');
        return card({
          title: lines[0], sub, source: i.source, rarity: i.rarity, image: i.image,
          levels: i.extra_images, group: sec.name
        });
      });
      cards.push(...cs);
      const hasImg = sec.items.some(i => i.image);
      const g = group(sec.name, sec.name === 'Titles' ? titles.total_cosmetic_xp + ' total Cosmetic XP' : null,
        cs, hasImg ? (sec.name === 'Banners' ? 'wide' : '') : 'text');
      g.dataset.section = sec.name;
      groups.push(g);
      return g;
    });
    const wanted = () => decodeURIComponent(location.hash.slice(1)) || data.sections[0].name;
    tabFilter = g => g.dataset.section === wanted();
    const tabs = el('div', 'tabs');
    data.sections.forEach(sec => {
      const b = el('a', 'chip', sec.name);
      b.href = '#' + encodeURIComponent(sec.name);
      b.style.display = 'flex'; b.style.alignItems = 'center'; b.style.textDecoration = 'none';
      tabs.append(b);
    });
    const syncTabs = () => {
      tabs.querySelectorAll('a').forEach(a => a.setAttribute('aria-pressed', String(a.textContent === wanted())));
      applyFilters();
    };
    finish('Profile Decorations', [tabs, ...sections]);
    window.addEventListener('hashchange', syncTabs);
    syncTabs();
  }

  const pages = {
    hats: () => renderSets('hats', 'Hats'),
    outfits: () => renderSets('outfits', 'Outfits'),
    rides: renderRides,
    weapons: renderWeapons,
    decorations: renderDecorations
  };
  if (pages[page]) pages[page]().catch(showError);
})();
