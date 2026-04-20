/* ============================================================
   METRIDIUM v2 — HUD Navigation
   Command palette overlay with search, accessible from all pages.
   ============================================================ */

export function initHudNav(setScene) {
  const palette = document.getElementById('cmdPalette');
  const toggleBtn = document.getElementById('cmdToggle');
  const input = document.getElementById('cmdInput');
  if (!palette || !toggleBtn) return;

  const closeBtn = palette.querySelector('.hud-close');
  const results = Array.from(palette.querySelectorAll('.cmd-result'));
  const navCards = Array.from(palette.querySelectorAll('.hud-nav-card'));
  let index = 0;
  let open = false;

  const updateSelection = () => {
    results.forEach((item, i) => item.classList.toggle('is-selected', i === index));
    if (results[index]) results[index].scrollIntoView({ block: 'nearest' });
  };

  const openPalette = () => {
    palette.classList.add('is-open');
    palette.setAttribute('aria-hidden', 'false');
    open = true;
    updateSelection();
    if (input) { input.value = ''; input.focus(); }
  };

  const closePalette = () => {
    palette.classList.remove('is-open');
    palette.setAttribute('aria-hidden', 'true');
    open = false;
  };

  toggleBtn.addEventListener('click', () => { open ? closePalette() : openPalette(); });
  if (closeBtn) closeBtn.addEventListener('click', closePalette);
  palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });

  results.forEach((item, i) => {
    item.addEventListener('click', () => {
      const action = parseInt(item.dataset.action, 10);
      if (!Number.isNaN(action) && setScene) setScene(action);
      closePalette();
    });
    item.addEventListener('mouseenter', () => { index = i; updateSelection(); });
  });

  window.addEventListener('keydown', (e) => {
    const metaK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (metaK) { e.preventDefault(); open ? closePalette() : openPalette(); }
    if (!open) return;
    if (e.key === 'Escape') closePalette();
    if (e.key === 'ArrowDown') { index = (index + 1) % results.length; updateSelection(); }
    if (e.key === 'ArrowUp') { index = (index - 1 + results.length) % results.length; updateSelection(); }
    if (e.key === 'Enter' && results[index]) results[index].click();
  });

  if (input) {
    input.addEventListener('input', () => {
      const val = input.value.toLowerCase();
      results.forEach((item) => { item.hidden = val.length > 0 && !item.innerText.toLowerCase().includes(val); });
      navCards.forEach((card) => { card.hidden = val.length > 0 && !card.innerText.toLowerCase().includes(val); });
      index = 0;
      updateSelection();
    });
  }
}