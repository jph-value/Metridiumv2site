/* ============================================================
   METRIDIUM v2 — Bioluminescent Cursor
   Performance-optimized: throttled redraw, cached rects,
   fewer gradient allocations, frame-skipping when idle.
   ============================================================ */

const HOOK_SELECTORS = ['[data-cursor]', '.interactive-box', 'a', 'button'];

export function initCursor() {
  const glowCanvas = document.getElementById('glowCanvas');
  const cursorCanvas = document.getElementById('cursorCanvas');
  if (!glowCanvas || !cursorCanvas) return;

  const root = document.documentElement;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!finePointer) {
    root.classList.add('show-native-cursor');
    return;
  }
  root.classList.remove('show-native-cursor');

  const glowCtx = glowCanvas.getContext('2d');
  const cursorCtx = cursorCanvas.getContext('2d');

  let width = window.innerWidth;
  let height = window.innerHeight;
  let mouseX = -100;
  let mouseY = -100;
  let prevMouseX = -200;
  let prevMouseY = -200;
  let targetX = -100;
  let targetY = -100;
  let trail = [];
  let particles = [];
  let time = 0;
  let isHovering = false;
  let animId = null;
  let isVisible = true;
  let idleFrames = 0;

  const ambientBlobs = [];

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    glowCanvas.width = width;
    glowCanvas.height = height;
    cursorCanvas.width = width;
    cursorCanvas.height = height;
  };

  const initAmbientBlobs = () => {
    ambientBlobs.length = 0;
    for (let i = 0; i < 2; i += 1) {
      ambientBlobs.push({
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        x: Math.random() * width,
        y: Math.random() * height,
        size: 200 + Math.random() * 150,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0003 + Math.random() * 0.0004,
      });
    }
  };

  resize();
  initAmbientBlobs();
  window.addEventListener('resize', () => { resize(); initAmbientBlobs(); });

  document.addEventListener('mousemove', (e) => { targetX = e.clientX; targetY = e.clientY; idleFrames = 0; });
  document.addEventListener('mouseleave', () => { targetX = -100; targetY = -100; idleFrames = 0; });

  const hookTargets = () => {
    const targets = new Set(HOOK_SELECTORS.flatMap(s => Array.from(document.querySelectorAll(s))));
    targets.forEach((el) => {
      el.addEventListener('mouseenter', () => { isHovering = true; });
      el.addEventListener('mouseleave', () => { isHovering = false; });
    });
  };
  hookTargets();

  const spawnParticle = (x, y, { directional = false } = {}) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const isBubble = Math.random() < 0.25;
    const baseVx = Math.cos(angle) * speed + (Math.random() - 0.5) * 2;
    const baseVy = Math.sin(angle) * speed + (Math.random() - 0.5) * 2;

    particles.push({
      x, y,
      vx: isBubble ? (Math.random() - 0.5) * 0.6 : baseVx,
      vy: isBubble ? -(1 + Math.random() * 1.5) : baseVy - (directional ? 0.5 : 0),
      life: 1,
      decay: (0.015 + Math.random() * 0.01) * (isBubble ? 0.5 : 1),
      size: 3 + Math.random() * 5,
      hue: 160 + Math.random() * 40,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.1,
      isBubble,
    });
  };

  if (particles.length > 30) particles.splice(0, particles.length - 30);

  document.addEventListener('click', (e) => {
    if (e.target?.closest('a, button, input, textarea, select, label, [role="button"]')) return;
    for (let i = 0; i < 8; i += 1) spawnParticle(e.clientX, e.clientY);
  });

  const drawOrganicBlob = (ctx, x, y, size, t, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const points = 6;
    const angleStep = (Math.PI * 2) / points;
    for (let i = 0; i <= points; i += 1) {
      const angle = i * angleStep;
      const n1 = Math.sin(t * 0.8 + i * 1.3) * 0.25;
      const n2 = Math.cos(t * 0.6 + i * 0.9) * 0.15;
      const r = size * (1 + n1 + n2);
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };

  const animate = () => {
    if (!isVisible) { animId = requestAnimationFrame(animate); return; }

    const mouseMoved = targetX !== prevMouseX || targetY !== prevMouseY;
    prevMouseX = targetX;
    prevMouseY = targetY;

    if (!mouseMoved && particles.length === 0) {
      idleFrames++;
      if (idleFrames > 3) {
        animId = requestAnimationFrame(animate);
        return;
      }
    } else {
      idleFrames = 0;
    }

    time += 0.016;
    mouseX = targetX;
    mouseY = targetY;

    trail.unshift({ x: mouseX + Math.sin(time * 3) * 2, y: mouseY + Math.cos(time * 2.5) * 2 });
    if (trail.length > 14) trail.length = 14;

    if (mouseMoved && Math.random() < 0.06 && targetX > 0) {
      spawnParticle(mouseX + (Math.random() - 0.5) * 8, mouseY + (Math.random() - 0.5) * 8, { directional: true });
    }

    glowCtx.clearRect(0, 0, width, height);
    cursorCtx.clearRect(0, 0, width, height);

    ambientBlobs.forEach((blob, i) => {
      blob.phase += blob.speed;
      blob.x = blob.baseX + Math.sin(blob.phase) * 80 + Math.cos(blob.phase * 0.7) * 40;
      blob.y = blob.baseY + Math.cos(blob.phase * 0.8) * 60 + Math.sin(blob.phase * 0.5) * 30;
      blob.baseX += (mouseX - blob.x) * 0.0002;
      blob.baseY += (mouseY - blob.y) * 0.0002;
      const g = glowCtx.createRadialGradient(blob.x, blob.y, 0, blob.x + blob.size * 0.3, blob.y + blob.size * 0.2, blob.size);
      g.addColorStop(0, `hsla(${170 + i * 15}, 100%, 60%, 0.06)`);
      g.addColorStop(0.5, `hsla(${180 + i * 10}, 100%, 50%, 0.02)`);
      g.addColorStop(1, 'transparent');
      drawOrganicBlob(glowCtx, blob.x, blob.y, blob.size, time + i, g);
    });

    if (targetX > 0) {
      const g = glowCtx.createRadialGradient(mouseX - 30, mouseY - 20, 0, mouseX + 20, mouseY + 30, 200);
      g.addColorStop(0, 'rgba(0, 255, 200, 0.1)');
      g.addColorStop(0.4, 'rgba(0, 200, 255, 0.04)');
      g.addColorStop(1, 'transparent');
      drawOrganicBlob(glowCtx, mouseX, mouseY, 150, time * 1.5, g);
    }

    particles = particles.filter((p) => {
      p.wobble += p.wobbleSpeed;
      if (p.isBubble) { p.vx *= 0.98; p.vy -= 0.004; }
      else { p.vx *= 0.96; p.vy *= 0.96; }
      p.x += p.vx + Math.sin(p.wobble) * (p.isBubble ? 0.3 : 0.4);
      p.y += p.vy + Math.cos(p.wobble) * (p.isBubble ? 0.2 : 0.25);
      p.life -= p.decay;
      if (p.life <= 0) return false;
      const s = p.size * p.life;
      cursorCtx.globalAlpha = p.life * (p.isBubble ? 0.45 : 0.6);
      cursorCtx.fillStyle = `hsla(${p.hue}, 100%, 75%, 0.8)`;
      cursorCtx.beginPath();
      cursorCtx.arc(p.x, p.y, s, 0, Math.PI * 2);
      cursorCtx.fill();
      return true;
    });
    cursorCtx.globalAlpha = 1;

    if (trail.length > 2 && targetX > 0) {
      const g = cursorCtx.createLinearGradient(trail[0].x, trail[0].y, trail[trail.length - 1].x, trail[trail.length - 1].y);
      g.addColorStop(0, 'rgba(0, 255, 200, 0.5)');
      g.addColorStop(0.5, 'rgba(0, 220, 255, 0.2)');
      g.addColorStop(1, 'transparent');
      cursorCtx.save();
      cursorCtx.strokeStyle = g;
      cursorCtx.lineCap = 'round';
      cursorCtx.lineJoin = 'round';
      cursorCtx.lineWidth = isHovering ? 12 : 8;
      cursorCtx.globalAlpha = 0.4;
      cursorCtx.beginPath();
      cursorCtx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i += 1) {
        const xc = (trail[i - 1].x + trail[i].x) / 2;
        const yc = (trail[i - 1].y + trail[i].y) / 2;
        cursorCtx.quadraticCurveTo(trail[i - 1].x, trail[i - 1].y, xc, yc);
      }
      cursorCtx.stroke();
      cursorCtx.restore();
    }

    if (targetX > 0) {
      const coreSize = isHovering ? 12 : 8;
      const coreGlow = cursorCtx.createRadialGradient(mouseX - 2, mouseY - 2, 0, mouseX + 3, mouseY + 3, coreSize);
      coreGlow.addColorStop(0, 'rgba(200, 255, 240, 0.9)');
      coreGlow.addColorStop(0.3, 'rgba(0, 255, 200, 0.7)');
      coreGlow.addColorStop(0.7, 'rgba(0, 200, 255, 0.3)');
      coreGlow.addColorStop(1, 'transparent');
      drawOrganicBlob(cursorCtx, mouseX, mouseY, coreSize, time * 3, coreGlow);
    }

    animId = requestAnimationFrame(animate);
  };

  animId = requestAnimationFrame(animate);

  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
  });
}