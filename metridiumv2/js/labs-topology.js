/* ============================================================
   METRIDIUM v2 — Labs Topology
   FLIP-animated constellation mesh.
   
   Default: centered grid. 
   Focused: selected tile enlarged and centered, others orbit
   around it in rings — connected close, near further, dimmed
   at the periphery. All transitions are FLIP-animated.
   
   Connections use deterministic organic curves per pair.
   ============================================================ */

const ANIM_MS = 400;
const FLIP_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const pairCurveMap = new Map();
let pairIdx = 0;
function pairCurve(key) {
  if (!pairCurveMap.has(key)) { pairCurveMap.set(key, pairIdx % 5); pairIdx++; }
  return pairCurveMap.get(key);
}

function initTopology() {
  const container = document.getElementById('techApproaches');
  if (!container) return;
  const nodes = Array.from(container.querySelectorAll('.topo-node'));
  if (!nodes.length) return;

  const svg = container.querySelector('.topo-svg');
  const detailPanel = document.getElementById('topoDetail');
  let selectedId = null;
  let animating = false;

  const findNode = (id) => nodes.find((n) => n.dataset.topoId === id);
  const getConns = (id) => (findNode(id)?.dataset.topoConnections || '').split(',').filter(Boolean);

  /* ── Layout constants ── */
  const GAP = 18;
  const TILE_W = 210;
  const TILE_H = 128;
  const FOCUS_W = 255;
  const FOCUS_H = 150;

  /* ── Degree ── */
  const deg = (id) => {
    if (!selectedId) return -1;
    if (id === selectedId) return 3;
    const sc = getConns(selectedId);
    if (sc.includes(id)) return 2;
    const nc = getConns(id);
    if (nc.some((c) => sc.includes(c))) return 1;
    return 0;
  };

  /* ── Layout: grid when unfocused, orbit when focused ── */
  const computeLayout = () => {
    const cw = container.clientWidth;
    const cx = cw / 2;

    const isMobile = cw < 520;
    const cols = isMobile ? 2 : cw < 800 ? 3 : 4;
    const tileW = isMobile ? (cw - GAP * (cols + 1)) / cols : TILE_W;
    const tileH = isMobile ? 88 : TILE_H;
    const focusW = isMobile ? tileW : FOCUS_W;
    const focusH = isMobile ? 108 : FOCUS_H;

    const items = nodes.map((node) => {
      const id = node.dataset.topoId;
      const d = deg(id);
      const isSelected = id === selectedId;
      return { id, node, w: isSelected ? focusW : tileW, h: isSelected ? focusH : tileH, isSelected, degree: d, x: 0, y: 0 };
    });

    if (!selectedId) {
      /* ── Default grid layout, rows centered ── */
      let x = 0, y = 0, rowW = 0, row = [], maxY = 0;
      items.forEach((item) => {
        const needed = rowW + (row.length ? GAP : 0) + item.w + GAP;
        if (row.length >= cols || (row.length > 0 && needed > cw)) {
          const rw = row.reduce((s, i) => s + i.w, 0) + GAP * (row.length - 1);
          const ox = (cw - rw) / 2;
          row.forEach((i, j) => { i.x = ox + j * (i.w + GAP); i.y = y; });
          y += tileH + GAP;
          maxY = Math.max(maxY, y);
          row = []; rowW = 0;
        }
        row.push(item);
        rowW += item.w + (row.length > 1 ? GAP : 0);
      });
      if (row.length) {
        const rw = row.reduce((s, i) => s + i.w, 0) + GAP * (row.length - 1);
        const ox = (cw - rw) / 2;
        row.forEach((i, j) => { i.x = ox + j * (i.w + GAP); i.y = y; });
        maxY = Math.max(maxY, y + tileH);
      }
      return { items, height: maxY + GAP };
    }

    /* ── Focused: selected tile centered, others orbit in rows ── */
    const sel = items.find((i) => i.isSelected);
    const others = items.filter((i) => !i.isSelected);
    const connected = others.filter((i) => i.degree === 2);
    const near = others.filter((i) => i.degree === 1);
    const dimmed = others.filter((i) => i.degree === 0);

    if (isMobile) {
      /* ── Mobile: selected on top, then connected, near, dimmed in grid rows ── */
      sel.x = (cw - sel.w) / 2;
      sel.y = 0;
      let cursorY = sel.h + GAP;

      const placeBlock = (tiles) => {
        if (!tiles.length) return;
        const tCols = tiles.length <= 2 ? tiles.length : cols;
        let lx = GAP, row = 0;
        tiles.forEach((item, i) => {
          if (i > 0 && i % tCols === 0) { lx = GAP; cursorY += tileH + GAP; row++; }
          item.x = lx;
          item.y = cursorY;
          lx += item.w + GAP;
        });
        cursorY += tileH + GAP;
      };
      placeBlock(connected);
      placeBlock(near);
      placeBlock(dimmed);
      const maxY = items.reduce((m, i) => Math.max(m, i.y + i.h), 0);
      return { items, height: maxY + GAP };
    }

    /* ── Desktop orbit layout ── 
       Selected tile centered. Other tiles arranged in rows
       above and below, grouped by degree. Rows auto-wrap
       if they exceed container width. Every row is centered
       on cx. No overlaps possible by construction. */

    sel.x = cx - sel.w / 2;
    sel.y = 0;

    // Stable deterministic sort by id within each group
    connected.sort((a, b) => a.id.localeCompare(b.id));
    near.sort((a, b) => a.id.localeCompare(b.id));
    dimmed.sort((a, b) => a.id.localeCompare(b.id));

    // Split connected tiles: half above, half below the selected tile
    const connAboveCount = Math.ceil(connected.length / 2);
    const connAbove = connected.slice(0, connAboveCount);
    const connBelow = connected.slice(connAboveCount);

    // near and dimmed go below
    const belowTiles = [...connBelow, ...near, ...dimmed];

    const maxRowW = cw - GAP * 2;

    // Shared: wrap tiles into rows that fit within maxRowW
    const wrapTiles = (tiles) => {
      const rows = [];
      let row = [], rowW = 0;
      tiles.forEach((t) => {
        const needed = row.length ? rowW + GAP + t.w : t.w;
        if (needed > maxRowW && row.length) {
          rows.push(row);
          row = [t]; rowW = t.w;
        } else {
          row.push(t); rowW = needed;
        }
      });
      if (row.length) rows.push(row);
      return rows;
    };

    const centerRowAt = (r, y) => {
      const rw = r.reduce((s, t) => s + t.w, 0) + GAP * (r.length - 1);
      let x = cx - rw / 2;
      r.forEach((t) => { t.x = x; t.y = y; x += t.w + GAP; });
    };

    // Place above-rows: stack upward from bottomY
    const placeRowsAbove = (tiles, bottomY) => {
      if (!tiles.length) return;
      const rows = wrapTiles(tiles);
      let y = bottomY - GAP - tileH;
      for (let ri = rows.length - 1; ri >= 0; ri--) {
        centerRowAt(rows[ri], y);
        y -= tileH + GAP;
      }
    };

    // Place below-rows: stack downward from topY
    const placeRowsBelow = (tiles, topY) => {
      if (!tiles.length) return;
      const rows = wrapTiles(tiles);
      let y = topY;
      rows.forEach((r) => { centerRowAt(r, y); y += tileH + GAP; });
    };

    // Place connected-above tiles above the selected tile
    placeRowsAbove(connAbove, sel.y);

    // Place connected-below + near + dimmed below the selected tile
    placeRowsBelow(belowTiles, sel.y + sel.h + GAP);

    // Normalize: ensure no tiles are off-screen (negative Y or X)
    const minY = items.reduce((m, i) => Math.min(m, i.y), Infinity);
    if (minY < 0) {
      const shift = -minY + GAP;
      items.forEach((i) => { i.y += shift; });
    }

    const minX = items.reduce((m, i) => Math.min(m, i.x), Infinity);
    if (minX < GAP) {
      const offset = GAP - minX;
      items.forEach((i) => { i.x += offset; });
    }

    const finalMaxY = items.reduce((m, i) => Math.max(m, i.y + i.h), 0);
    return { items, height: finalMaxY + GAP };
  };

  /* ── States ── */
  const applyStates = () => {
    nodes.forEach((node) => {
      const d = deg(node.dataset.topoId);
      node.classList.remove('is-focused', 'is-connected', 'is-near', 'is-dimmed');
      if (d === 3) node.classList.add('is-focused');
      else if (d === 2) node.classList.add('is-connected');
      else if (d === 1) node.classList.add('is-near');
      else if (d >= 0 && selectedId) node.classList.add('is-dimmed');
    });
  };

  /* ── FLIP ── */
  const measureRects = () => {
    const cr = container.getBoundingClientRect();
    const map = new Map();
    nodes.forEach((n) => {
      const r = n.getBoundingClientRect();
      map.set(n, { left: r.left - cr.left, top: r.top - cr.top, width: r.width, height: r.height });
    });
    return map;
  };

  const applyLayout = (result) => {
    lastLayoutItems = result.items;
    container.style.height = result.height + 'px';
    result.items.forEach((item) => {
      item.node.style.left = item.x + 'px';
      item.node.style.top = item.y + 'px';
      item.node.style.width = item.w + 'px';
      item.node.style.height = item.h + 'px';
      item.node.style.zIndex = item.isSelected ? 10 : item.degree === 2 ? 5 : item.degree === 1 ? 3 : 1;
    });
  };

  const flipAnimate = (oldRects) => {
    const newRects = measureRects();
    const active = [];

    nodes.forEach((node) => {
      const old = oldRects.get(node);
      const cur = newRects.get(node);
      if (!old || !cur) return;

      const dx = old.left - cur.left;
      const dy = old.top - cur.top;
      const sx = old.width / Math.max(cur.width, 1);
      const sy = old.height / Math.max(cur.height, 1);

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;

      node.style.transformOrigin = 'top left';
      node.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      node.style.willChange = 'transform';
      active.push(node);
    });

    if (active.length) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          active.forEach((node) => {
            node.style.transition = `transform ${ANIM_MS}ms ${FLIP_EASE}, border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease, opacity 0.4s ease, filter 0.4s ease`;
            node.style.transform = '';
          });
        });
      });
    }

    animating = true;
    setTimeout(() => {
      animating = false;
      active.forEach((n) => { n.style.transition = ''; n.style.transformOrigin = ''; n.style.willChange = ''; });
      drawConnections();
    }, ANIM_MS + 80);
  };

  /* ── Connections ── */
  let lastLayoutItems = null;
  const drawConnections = () => {
    const lg = svg?.querySelector('.topo-lines');
    if (!lg) return;
    lg.innerHTML = '';

    const items = lastLayoutItems;
    if (!items) return;

    const itemMap = new Map(items.map((i) => [i.id, i]));
    const drawn = new Set();

    items.forEach((item) => {
      const conns = (item.node.dataset.topoConnections || '').split(',').filter(Boolean);
      const nid = item.id;

      conns.forEach((tid) => {
        const pk = [nid, tid].sort().join('|');
        if (drawn.has(pk)) return;
        drawn.add(pk);

        const target = itemMap.get(tid);
        if (!target) return;

        const x1 = item.x + item.w / 2;
        const y1 = item.y + item.h / 2;
        const x2 = target.x + target.w / 2;
        const y2 = target.y + target.h / 2;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = -dy / dist;
        const ny = dx / dist;

        const ci = pairCurve(pk);
        const offsets = [0, 30, -30, 55, -55];
        const curveAmt = offsets[ci];

        const cx = (x1 + x2) * 0.5 + nx * curveAmt;
        const cy = (y1 + y2) * 0.5 + ny * curveAmt;

        const nd = deg(nid);
        const td = deg(tid);
        const ld = Math.max(nd, td);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`);
        path.dataset.from = nid;
        path.dataset.to = tid;
        path.classList.add('topo-line');
        if (selectedId) {
          if (ld >= 2) path.classList.add('topo-line--active');
          else if (ld === 1) path.classList.add('topo-line--near');
          else path.classList.add('topo-line--dim');
        }
        lg.appendChild(path);
      });
    });
  };

  /* ── Selection ── */
  const updateSelection = (newId, scroll) => {
    const oldRects = measureRects();
    selectedId = newId;
    applyStates();
    const result = computeLayout();
    applyLayout(result);
    flipAnimate(oldRects);
    if (scroll) {
      const sn = findNode(selectedId);
      if (sn) setTimeout(() => sn.scrollIntoView({ behavior: 'smooth', block: 'center' }), ANIM_MS * 0.25);
    }
  };

  /* ── Detail panel ── */
  const showDetail = (data) => {
    if (!detailPanel) return;
    const d = data.detail;
    if (!d) { detailPanel.classList.remove('is-open'); return; }
    const sc = data.status ? ' topo-node__status--' + data.status.toLowerCase().replace(/[\s\/]+/g, '') : '';

    let ch = '';
    const conns = data.connections || [];
    if (conns.length) {
      ch = '<div class="topo-detail__connections">';
      conns.forEach((cid) => {
        const c = (window.MetridiumContent?.techApproaches || []).find((t) => t.id === cid);
        if (c) ch += `<button class="topo-connection-btn" data-topo-goto="${c.id}"><span class="topo-connection-dot"></span><span class="topo-connection-label">${c.tag}</span><span class="topo-connection-title">${c.title}</span></button>`;
      });
      ch += '</div>';
    }

    detailPanel.innerHTML = `<div class="topo-detail__inner">
      <button class="topo-detail__close" aria-label="Close">&times;</button>
      <span class="topo-detail__tag ${sc}">${data.tag}</span>
      <h3 class="topo-detail__title">${data.title}</h3>
      ${data.status ? `<span class="topo-detail__status ${sc}">${data.status}</span>` : ''}
      <p class="topo-detail__summary">${d.summary}</p>
      ${d.points?.length ? `<ul class="topo-detail__points">${d.points.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
      ${ch}
      ${d.relations ? `<p class="topo-detail__relations"><strong>Connections:</strong> ${d.relations}</p>` : ''}
      ${data.link ? `<a class="topo-detail__link" href="${data.link}" target="_blank" rel="noopener noreferrer">Visit</a>` : ''}
    </div>`;
    detailPanel.classList.add('is-open');

    detailPanel.querySelectorAll('.topo-connection-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); handleNodeClick(findNode(btn.dataset.topoGoto)); });
    });
    detailPanel.querySelector('.topo-detail__close')?.addEventListener('click', clearFocus);
  };

  const clearFocus = () => { updateSelection(null, false); if (detailPanel) detailPanel.classList.remove('is-open'); };

  const handleNodeClick = (node) => {
    if (!node) return;
    const id = node.dataset.topoId;
    if (selectedId === id) { clearFocus(); return; }
    updateSelection(id, true);
    const item = (window.MetridiumContent?.techApproaches || []).find((t) => t.id === id);
    if (item) showDetail(item);
  };

  /* ── Events ── */
  nodes.forEach((node) => {
    node.addEventListener('click', () => handleNodeClick(node));
    node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNodeClick(node); } });
  });
  container.addEventListener('click', (e) => { if (e.target === container || e.target === svg) clearFocus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && selectedId) clearFocus(); });

  /* ── Init ── */
  container.style.position = 'relative';
  nodes.forEach((n) => {
    n.style.position = 'absolute';
    n.style.margin = '0';
    n.style.opacity = '0';
  });
  applyLayout(computeLayout());

  /* Staggered entry animation */
  nodes.forEach((n, i) => {
    n.style.animationDelay = (i * 60) + 'ms';
    n.classList.add('is-entering');
  });
  requestAnimationFrame(drawConnections);

  /* Clean up entry animation after it completes */
  const totalEntryMs = nodes.length * 60 + 500;
  setTimeout(() => {
    nodes.forEach((n) => {
      n.classList.remove('is-entering');
      n.style.animationDelay = '';
      n.style.opacity = '';
    });
  }, totalEntryMs);

  let rt;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { const o = measureRects(); applyLayout(computeLayout()); flipAnimate(o); }, 80); };
  window.addEventListener('resize', onResize);
  new ResizeObserver(onResize).observe(container);
  if (document.fonts) document.fonts.ready.then(() => { applyLayout(computeLayout()); drawConnections(); });
}

export { initTopology };