/* ============================================================
   METRIDIUM v2 — Anemone Pointer Interaction
   Performance-optimized: cached rects, throttled updates,
   only recomputes layout on scroll/resize.
   ============================================================ */

const FLOATING_POINTER = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 };
const pointerState = { active: false, x: FLOATING_POINTER.x, y: FLOATING_POINTER.y };

document.addEventListener('mousemove', (e) => {
  pointerState.x = e.clientX;
  pointerState.y = e.clientY;
  pointerState.active = true;
});

export function initAnemoneInteraction() {
  const anemones = Array.from(document.querySelectorAll('.scene--seafloor .anemone, .labs-garden .anemone'));
  if (!anemones.length) return;

  const metas = anemones.map((el) => ({
    el,
    state: { tilt: 0, lift: 0, glow: 0 },
    rect: null,
  }));

  const MAX_DIST = 420;
  const easing = { tilt: 0.08, lift: 0.1, glow: 0.07 };

  let rafPending = false;
  let rectsDirty = true;

  const invalidateRects = () => { rectsDirty = true; };

  window.addEventListener('resize', invalidateRects);
  window.addEventListener('scroll', invalidateRects, { passive: true });

  const refreshRects = () => {
    metas.forEach((meta) => {
      meta.rect = meta.el.getBoundingClientRect();
    });
    rectsDirty = false;
  };

  refreshRects();

  const tick = () => {
    rafPending = false;
    if (rectsDirty) refreshRects();

    const px = pointerState.active ? pointerState.x : FLOATING_POINTER.x;
    const py = pointerState.active ? pointerState.y : FLOATING_POINTER.y;

    let anyChanged = false;

    for (let i = 0; i < metas.length; i++) {
      const { el, state, rect } = metas[i];
      if (!rect) continue;

      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.35;
      const dx = px - centerX;
      const dy = py - centerY;
      const dist = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - Math.min(dist, MAX_DIST) / MAX_DIST);

      const targetTilt = (dx / rect.width) * 3.2 * influence;
      const targetLift = -9 * influence - Math.max(0, dy / 1600);
      const targetGlow = influence * 0.75;

      const prevTilt = state.tilt;
      const prevLift = state.lift;
      const prevGlow = state.glow;

      state.tilt += (targetTilt - state.tilt) * easing.tilt;
      state.lift += (targetLift - state.lift) * easing.lift;
      state.glow += (targetGlow - state.glow) * easing.glow;

      if (Math.abs(state.tilt - prevTilt) > 0.001 ||
          Math.abs(state.lift - prevLift) > 0.01 ||
          Math.abs(state.glow - prevGlow) > 0.001) {
        anyChanged = true;
        el.style.setProperty('--pointer-tilt', `${state.tilt.toFixed(2)}deg`);
        el.style.setProperty('--pointer-lift', `${state.lift.toFixed(1)}px`);
        el.style.setProperty('--pointer-glow', state.glow.toFixed(2));
      }
    }

    if (!document.hidden) {
      requestAnimationFrame(tick);
    } else {
      rafPending = false;
    }
  };

  rafPending = true;
  requestAnimationFrame(tick);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !rafPending) {
      rectsDirty = true;
      rafPending = true;
      requestAnimationFrame(tick);
    }
  });
}

export { pointerState, FLOATING_POINTER };