/* ============================================================
   METRIDIUM v2 — Scope Rotator
   Animated text rotation in the hero section.
   ============================================================ */

import { getContent } from './content-loader.js';

let timer = null;

export function initScopeRotator() {
  const content = getContent();
  const scopes = content.hero?.scope;
  if (!Array.isArray(scopes) || !scopes.length) return;

  const wrapper = document.querySelector('.scope-rotator');
  if (!wrapper) return;

  const textEl = wrapper.querySelector('.scope-line');
  const prevBtn = wrapper.querySelector('.scope-arrow--prev');
  const nextBtn = wrapper.querySelector('.scope-arrow--next');
  if (!textEl) return;

  let currentIndex = 0;
  const INTERVAL = 8000;
  const PAUSE_AFTER_MANUAL = 16000;

  const crossfadeTo = (index) => {
    textEl.classList.add('scope-line--out');
    setTimeout(() => {
      currentIndex = index;
      textEl.textContent = scopes[currentIndex];
      textEl.classList.remove('scope-line--out');
    }, 350);
  };

  const advance = (dir) => {
    const next = (currentIndex + dir + scopes.length) % scopes.length;
    crossfadeTo(next);
  };

  const startAuto = (delay) => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => advance(1), delay);
  };

  if (prevBtn) prevBtn.addEventListener('click', () => { advance(-1); startAuto(PAUSE_AFTER_MANUAL); });
  if (nextBtn) nextBtn.addEventListener('click', () => { advance(1); startAuto(PAUSE_AFTER_MANUAL); });

  wrapper.addEventListener('mouseenter', () => { if (timer) clearInterval(timer); });
  wrapper.addEventListener('mouseleave', () => { startAuto(INTERVAL); });

  startAuto(INTERVAL);
}