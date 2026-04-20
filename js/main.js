import { loadContent, getContent } from './content-loader.js';
import { initCursor } from './cursor.js';
import { initAnemoneInteraction } from './anemone-interact.js';

const select = (selector, parent = document) => parent.querySelector(selector);
const selectAll = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

let aliasRotationTimer = null;
let scopeRotationTimer = null;

const renderHero = (content) => {
  if (!content.hero) return;
  const eyebrowNodes = selectAll('[data-content="hero.eyebrow"]');
  const ledeNodes = selectAll('[data-content="hero.lede"]');
  const titleNodes = selectAll('[data-hero-title]');
  const actionContainers = selectAll('[data-hero-actions]');

  eyebrowNodes.forEach((node) => {
    node.textContent = content.hero.eyebrow;
  });

  ledeNodes.forEach((node) => {
    node.textContent = content.hero.lede;
  });

  if (Array.isArray(content.hero.scope) && content.hero.scope.length) {
    const ledeEl = select('.scene--hero .lede');
    if (ledeEl && !select('.scope-rotator')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'scope-rotator';

      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'scope-arrow scope-arrow--prev';
      prevBtn.setAttribute('aria-label', 'Previous scope');
      prevBtn.innerHTML = '<img src="/assets/crispclearMetridiumlogo-256.png" alt="" class="scope-arrow-img">';

      const textEl = document.createElement('p');
      textEl.className = 'scope-line';
      textEl.textContent = content.hero.scope[0];

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'scope-arrow scope-arrow--next';
      nextBtn.setAttribute('aria-label', 'Next scope');
      nextBtn.innerHTML = '<img src="/assets/crispclearMetridiumlogo-256.png" alt="" class="scope-arrow-img">';

      wrapper.append(prevBtn, textEl, nextBtn);
      ledeEl.parentNode.insertBefore(wrapper, ledeEl);

      const finePrint = document.createElement('p');
      finePrint.className = 'scope-fineprint';
      finePrint.textContent = 'Same statement, five entry points \u2014 because alignment matters more than phrasing.';
      wrapper.parentNode.insertBefore(finePrint, wrapper.nextSibling);
    }
  }

  titleNodes.forEach((titleNode) => {
    const target = titleNode;
    target.innerHTML = '';
    content.hero.title.forEach((line, index) => {
      const span = document.createElement('span');
      span.textContent = line;
      if (line === 'METRIDIUM') {
        const dots = document.createElement('span');
        dots.className = 'hero-title-dots';
        dots.setAttribute('aria-hidden', 'true');

        const dotA = document.createElement('span');
        dotA.className = 'hero-title-dot hero-title-dot--a';

        const dotB = document.createElement('span');
        dotB.className = 'hero-title-dot hero-title-dot--b';

        dots.append(dotA, dotB);
        span.appendChild(dots);
      }
      target.appendChild(span);
    });
  });

  actionContainers.forEach((container) => {
    const target = container;
    target.innerHTML = '';
    content.hero.actions.forEach((action) => {
      if (action.link) {
        const anchor = document.createElement('a');
        anchor.href = action.link;
        anchor.className = `btn btn-${action.style}`;
        if (action.cursor) anchor.dataset.cursor = action.cursor;
        anchor.textContent = action.label;
        target.appendChild(anchor);
      } else {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn btn-${action.style}`;
        button.dataset.goto = action.goto;
        if (action.cursor) button.dataset.cursor = action.cursor;
        button.textContent = action.label;
        target.appendChild(button);
      }
    });
  });
};

const renderMission = (content) => {
  const container = select('#missionSections');
  if (!container || !content.mission) return;
  container.innerHTML = '';

  content.mission.sections.forEach((section) => {
    const block = document.createElement('article');
    block.className = 'mission-block';

    const highlightMarkup = section.highlight
      ? `<blockquote class="mission-highlight">${section.highlight}</blockquote>`
      : '';

    const subheadingMarkup = section.subheading
      ? `<span class="mission-subheading">${section.subheading}</span>`
      : '';

    block.innerHTML = `
      <div class="mission-marker">${section.marker}</div>
      <div class="mission-content">
        <h3>${section.heading}</h3>
        ${subheadingMarkup}
        ${highlightMarkup}
        <p>${section.body}</p>
        ${section.detail ? `<p class="mission-detail">${section.detail}</p>` : ''}
      </div>
    `;

    container.appendChild(block);
  });
};

const renderTechApproaches = (content) => {
  const container = select('#techApproaches');
  if (!container || !Array.isArray(content.techApproaches)) return;
  container.innerHTML = '';

  content.techApproaches.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'tech-card';
    if (item.cursor) card.dataset.cursor = item.cursor;
    if (item.link) card.dataset.link = item.link;

    const aliases = item.aliases?.length ? item.aliases : [item.title];
    const aliasAttr = JSON.stringify(aliases);

    const logoMarkup =
      aliases.includes('Ane.moneY') || aliases.includes('Anemone Yield')
        ? `<img src="assets/ane-mark-crisp-glow.svg" alt="" class="title-logo" loading="lazy" decoding="async">`
        : '';

    card.innerHTML = `
      <header>
        <p class="tag">${item.tag}</p>
        <h3>
          <span class="title-with-logo">
            ${logoMarkup}
            <span class="title-alias" data-aliases='${aliasAttr}'>${aliases[0]}</span>
          </span>
        </h3>
      </header>
      <p>${item.copy}</p>
      ${
        item.link
          ? `<a class="tech-card__link" href="${item.link}" target="_blank" rel="noopener noreferrer" data-cursor="LINK">Visit</a>`
          : ''
      }
    `;

    if (item.link) {
      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        if (event.target.closest('button')) return;
        window.open(item.link, '_blank', 'noreferrer');
      });
    }

    container.appendChild(card);
  });
};

const renderAbout = (content) => {
  const copyContainer = select('#aboutCopy');
  if (!content.about) return;

  if (copyContainer) {
    copyContainer.innerHTML = '';
    content.about.copy.forEach((paragraph) => {
      const p = document.createElement('p');
      p.className = 'copy-rich';
      p.textContent = paragraph;
      copyContainer.appendChild(p);
    });

    if (content.about.capabilities?.length) {
      const capList = document.createElement('ul');
      capList.className = 'about-capabilities';
      content.about.capabilities.forEach((cap) => {
        const li = document.createElement('li');
        li.textContent = cap;
        capList.appendChild(li);
      });
      copyContainer.appendChild(capList);
    }

    if (content.about.operation) {
      const opP = document.createElement('p');
      opP.className = 'about-operation';
      opP.textContent = content.about.operation;
      copyContainer.appendChild(opP);
    }

    if (content.about.orientation) {
      const orP = document.createElement('p');
      orP.className = 'about-orientation';
      orP.textContent = content.about.orientation;
      copyContainer.appendChild(orP);
    }

    if (content.about.closing) {
      const clP = document.createElement('blockquote');
      clP.className = 'about-closing';
      clP.textContent = content.about.closing;
      copyContainer.appendChild(clP);
    }
  }
};

const renderSolutions = (content) => {
  const grid = select('#solutionsGrid');
  if (!grid || !Array.isArray(content.solutions)) return;
  grid.innerHTML = '';
  const platformLookup = (content.platform?.cards || []).reduce((acc, card) => {
    acc[card.title] = card;
    return acc;
  }, {});

  content.solutions.forEach((solution) => {
    const article = document.createElement('article');
    article.className = 'bento-item';
    if (solution.size) article.classList.add(`bento-${solution.size}`);
    if (solution.cursor) article.dataset.cursor = solution.cursor;
    if (solution.systems?.length) article.dataset.platforms = solution.systems.join('|');
    if (solution.link) article.dataset.link = solution.link;
    const aliases = solution.aliases?.length ? solution.aliases : [solution.title];
    const aliasAttr = JSON.stringify(aliases);

    const logoMarkup =
      aliases.includes('Ane.moneY') || aliases.includes('Anemone Yield')
        ? `<img src="assets/ane-mark-crisp-glow.svg" alt="" class="title-logo" loading="lazy" decoding="async">`
        : '';

    article.innerHTML = `
      <header>
        <p class="tag">${solution.tag}</p>
        <h3>
          <span class="title-with-logo">
            ${logoMarkup}
            <span class="title-alias" data-aliases='${aliasAttr}'>${aliases[0]}</span>
          </span>
        </h3>
      </header>
      <p>${solution.copy}</p>
      ${
        solution.link
          ? `<a class="solution-link" href="${solution.link}" target="_blank" rel="noopener noreferrer" data-cursor="LINK">Open site</a>`
          : ''
      }
    `;
    if (solution.link) {
      article.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        window.open(solution.link, '_blank', 'noreferrer');
      });
    }
    grid.appendChild(article);
  });
};

const renderPlatform = (content) => {
  const grid = select('#platformGrid');
  const meshList = select('#platformMesh');
  if (!content.platform) return;

  if (grid) {
    grid.innerHTML = '';
    content.platform.cards.forEach((card) => {
      const article = document.createElement('article');
      article.className = 'platform-card';
      article.innerHTML = `
        <p class="tag">${card.tag}</p>
        <h3>${card.title}</h3>
        <p>${card.copy}</p>
      `;
      grid.appendChild(article);
    });
  }

  if (meshList) {
    meshList.innerHTML = '';
    content.platform.meshes.forEach((mesh) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      const stat = document.createElement('span');
      name.textContent = mesh.name;
      stat.textContent = mesh.stat;
      li.append(name, stat);
      meshList.appendChild(li);
    });
  }
};

const renderConnect = (content) => {
  const contactMeta = select('#contactMeta');
  if (!content.connect || !contactMeta) return;
  const { contact } = content.connect;
  const phoneEl = contactMeta.querySelector('[data-content="connect.contact.phone"]');
  const locationSpan = contactMeta.querySelector('span[data-content="connect.contact.location"]');
  const labels = contactMeta.querySelectorAll('.contact-label');

  if (labels.length >= 2) {
    labels[0].textContent = contact.phoneLabel;
    labels[1].textContent = contact.locationLabel;
  }
  if (phoneEl) {
    phoneEl.textContent = contact.phone;
  }
  if (locationSpan) locationSpan.textContent = contact.location;
};

const renderSeafloor = (content) => {
  const eyebrow = select('[data-content="seafloor.eyebrow"]');
  const title = select('[data-content="seafloor.title"]');
  const body = select('[data-content="seafloor.body"]');
  if (!content.seafloor) return;
  if (eyebrow) eyebrow.textContent = content.seafloor.eyebrow;
  if (title) title.textContent = content.seafloor.title;
  if (body) body.textContent = content.seafloor.body;

  const miningContainer = select('#seabedMining');
  const mining = content.seafloor.seabedMining;
  if (miningContainer && mining) {
    const subheadingMarkup = mining.subheading
      ? `<span class="mission-subheading">${mining.subheading}</span>` : '';
    const highlightMarkup = mining.highlight
      ? `<blockquote class="mission-highlight">${mining.highlight}</blockquote>` : '';
    miningContainer.innerHTML = `
      <div class="mission-content">
        <h3>${mining.heading}</h3>
        ${subheadingMarkup}
        ${highlightMarkup}
        <p>${mining.body}</p>
        ${mining.detail ? `<p class="mission-detail">${mining.detail}</p>` : ''}
      </div>
    `;
  }
};

const renderContent = () => {
  const content = getContent();
  renderHero(content);
  renderMission(content);
  renderPlatform(content);
  renderTechApproaches(content);
  renderSolutions(content);
  renderAbout(content);
  renderConnect(content);
  renderSeafloor(content);
};

const initAliasRotation = () => {
  if (aliasRotationTimer) {
    clearInterval(aliasRotationTimer);
    aliasRotationTimer = null;
  }
  const nodes = selectAll('[data-aliases]');
  if (!nodes.length) return;
  const states = nodes
    .map((node) => {
      try {
        const aliases = JSON.parse(node.dataset.aliases || '[]');
        if (!Array.isArray(aliases) || !aliases.length) return null;
        return { node, aliases, index: 0 };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  if (!states.length) return;

  aliasRotationTimer = setInterval(() => {
    states.forEach((state) => {
      state.index = (state.index + 1) % state.aliases.length;
      state.node.textContent = state.aliases[state.index];
    });
  }, 3400);
};

const initScenes = ({ scrollContainer } = {}) => {
  const scope = scrollContainer || document;
  const scenes = selectAll('.scene', scope);
  const pills = selectAll('.scene-pill');
  const gotoButtons = selectAll('[data-goto]');
  const progressRing = select('#progressRing');
  const progressLabel = select('#progressLabel');
  const scrollRoot = scrollContainer || window;
  const scrollTarget = scrollRoot === window ? window : scrollRoot;

  if (!scenes.length) return;

  const circumference = progressRing ? 2 * Math.PI * Number(progressRing.getAttribute('r') || 28) : 0;
  if (progressRing) progressRing.style.strokeDasharray = `${circumference}`;

  let currentScene = 0;
  let rafPending = false;
  let sceneRafId = null;
  let pageVisible = true;

  const clampScene = (index) => Math.max(0, Math.min(index, scenes.length - 1));
  const isHudActive = () => document.body.classList.contains('hud-active');

  const updateProgress = () => {
    if (!progressRing) return;
    const percent = (currentScene + 1) / scenes.length;
    progressRing.style.strokeDashoffset = `${circumference * (1 - percent)}`;
    if (progressLabel) {
      progressLabel.textContent = `${String(currentScene + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`;
    }
  };

  const applySceneState = () => {
    scenes.forEach((scene, i) => {
      scene.classList.toggle('active', i === currentScene);
    });
    pills.forEach((pill, i) => {
      pill.classList.toggle('active', i === currentScene);
    });
    document.body.classList.toggle('seafloor-dive', scenes[currentScene]?.classList.contains('scene--seafloor'));
    updateProgress();
  };

  const scrollToScene = (index) => {
    const targetIndex = clampScene(index);
    const targetScene = scenes[targetIndex];
    if (!targetScene) return;
    currentScene = targetIndex;
    applySceneState();

    if (scrollRoot === window) {
      targetScene.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      scrollRoot.scrollTo({
        top: targetScene.offsetTop,
        behavior: 'smooth',
      });
    }
  };

  pills.forEach((pill, index) => {
    pill.addEventListener('click', () => scrollToScene(index));
  });

  gotoButtons.forEach((btn) => {
    const targetIndex = parseInt(btn.dataset.goto, 10);
    if (!Number.isNaN(targetIndex)) {
      btn.addEventListener('click', () => scrollToScene(targetIndex));
    }
  });

  window.addEventListener('keydown', (event) => {
    if (!isHudActive()) return;
    if (event.key === 'ArrowRight') {
      scrollToScene(currentScene + 1);
    }
    if (event.key === 'ArrowLeft') {
      scrollToScene(currentScene - 1);
    }
  });

  const detectActiveScene = () => {
    rafPending = false;
    if (!pageVisible) return;

    const viewportMid = scrollRoot === window ? window.innerHeight * 0.5 : scrollRoot.clientHeight * 0.5;
    const containerTop = scrollRoot === window ? 0 : scrollRoot.getBoundingClientRect().top;

    let containingIndex = -1;
    scenes.forEach((scene, index) => {
      const rect = scene.getBoundingClientRect();
      const relTop = rect.top - containerTop;
      const relBottom = rect.bottom - containerTop;
      if (relTop <= viewportMid && relBottom >= viewportMid) {
        containingIndex = index;
      }
    });

    if (containingIndex !== -1) {
      if (containingIndex !== currentScene) {
        currentScene = containingIndex;
        applySceneState();
      }
      return;
    }

    let bestIndex = currentScene;
    let bestDistance = Number.POSITIVE_INFINITY;
    scenes.forEach((scene, index) => {
      const rect = scene.getBoundingClientRect();
      const relTop = rect.top - containerTop;
      const relBottom = rect.bottom - containerTop;
      const distance = Math.abs((relTop + relBottom) * 0.5 - viewportMid);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    if (bestIndex !== currentScene) {
      currentScene = bestIndex;
      applySceneState();
    }
  };

  const onScroll = () => {
    if (rafPending || !pageVisible) return;
    rafPending = true;
    sceneRafId = requestAnimationFrame(detectActiveScene);
  };

  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  applySceneState();
  requestAnimationFrame(detectActiveScene);

  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
  });

  return { setScene: scrollToScene };
};

const initExperienceToggle = (sceneController) => {
  const buttons = selectAll('.view-toggle__btn');
  const toggle = select('.view-toggle');
  if (!buttons.length) return;

  const hudShell = select('#hudShell');
  const sceneStack = select('.scene-stack');
  const navLanding = select('.scene-nav__landing');
  const navPlatform = select('.scene-nav--platform');
  const setScene = sceneController?.setScene;
  const defaultView = toggle?.dataset.defaultView || document.body.dataset.defaultView || 'landing';

  const setView = (view) => {
    const isLanding = view !== 'platform';
    document.body.classList.toggle('platform-view', !isLanding);
    document.body.classList.toggle('hud-active', !isLanding);

    if (hudShell) {
      hudShell.classList.toggle('is-visible', !isLanding);
      hudShell.setAttribute('aria-hidden', isLanding ? 'true' : 'false');
    }

    if (sceneStack) {
      sceneStack.classList.toggle('is-hidden', !isLanding);
    }

    if (navLanding) {
      navLanding.setAttribute('aria-hidden', isLanding ? 'false' : 'true');
    }
    if (navPlatform) {
      navPlatform.setAttribute('aria-hidden', isLanding ? 'true' : 'false');
    }

    buttons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.view === view);
    });

    if (isLanding && typeof setScene === 'function') {
      setScene(0);
    }
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view || 'landing';
      const link = btn.dataset.link;
      if (link) {
        window.location.href = link;
        return;
      }
      setView(view);
    });
  });

  setView(defaultView);
};

const initCommandPalette = (setScene) => {
  const palette = select('#cmdPalette');
  const toggleBtn = select('#cmdToggle');
  const closeBtn = palette ? palette.querySelector('.hud-close') : null;
  const input = select('#cmdInput');
  const results = selectAll('.cmd-result');
  const navCards = selectAll('.hud-nav-card');
  if (!palette || !toggleBtn) return;

  let index = 0;
  let open = false;

  const updateSelection = () => {
    results.forEach((item, i) => item.classList.toggle('is-selected', i === index));
    if (results[index]) {
      results[index].scrollIntoView({ block: 'nearest' });
    }
  };

  const openPalette = () => {
    palette.classList.add('is-open');
    open = true;
    updateSelection();
    if (input) {
      input.value = '';
      input.focus();
    }
  };

  const closePalette = () => {
    palette.classList.remove('is-open');
    open = false;
  };

  toggleBtn.addEventListener('click', () => {
    open ? closePalette() : openPalette();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closePalette);
  }

  results.forEach((item, i) => {
    item.addEventListener('click', () => {
      const action = parseInt(item.dataset.action, 10);
      if (!Number.isNaN(action) && setScene) {
        setScene(action);
      }
      closePalette();
    });
    item.addEventListener('mouseenter', () => {
      index = i;
      updateSelection();
    });
  });

  window.addEventListener('keydown', (event) => {
    const metaK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (metaK) {
      event.preventDefault();
      open ? closePalette() : openPalette();
    }

    if (!open) return;

    if (event.key === 'Escape') closePalette();
    if (event.key === 'ArrowDown') {
      index = (index + 1) % results.length;
      updateSelection();
    }
    if (event.key === 'ArrowUp') {
      index = (index - 1 + results.length) % results.length;
      updateSelection();
    }
    if (event.key === 'Enter') {
      const target = results[index];
      if (target) target.click();
    }
  });

  if (input) {
    input.addEventListener('input', (event) => {
      const value = event.target.value.toLowerCase();
      results.forEach((item) => {
        const text = item.innerText.toLowerCase();
        item.hidden = !text.includes(value);
      });
      navCards.forEach((card) => {
        const text = card.innerText.toLowerCase();
        card.hidden = value.length > 0 && !text.includes(value);
      });
      index = 0;
      updateSelection();
    });
  }

  palette.addEventListener('click', (event) => {
    if (event.target === palette) closePalette();
  });
};

const initScopeRotator = () => {
  const content = getContent();
  const scopes = content.hero?.scope;
  if (!Array.isArray(scopes) || !scopes.length) return;

  const wrapper = select('.scope-rotator');
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
    if (scopeRotationTimer) clearInterval(scopeRotationTimer);
    scopeRotationTimer = setInterval(() => advance(1), delay);
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      advance(-1);
      startAuto(PAUSE_AFTER_MANUAL);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      advance(1);
      startAuto(PAUSE_AFTER_MANUAL);
    });
  }

  wrapper.addEventListener('mouseenter', () => {
    if (scopeRotationTimer) clearInterval(scopeRotationTimer);
  });

  wrapper.addEventListener('mouseleave', () => {
    startAuto(INTERVAL);
  });

  startAuto(INTERVAL);
};

const initForm = () => {
  const forms = selectAll('.connect-form');
  if (!forms.length) return;

  const isLocal = () => {
    const host = window.location.hostname;
    return (
      window.location.protocol === 'file:' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0'
    );
  };

  const showSubmitState = (form, { ok, originalText }) => {
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    if (!btn) return;
    btn.textContent = ok ? 'Message sent' : 'Send failed';
    if (status) {
      status.textContent = ok
        ? 'Thank you. We received your message.'
        : 'We could not send right now. Please retry.';
    }
    setTimeout(() => {
      btn.textContent = originalText;
      if (status) status.textContent = '';
    }, 2400);
  };

  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.textContent : 'Send';

      const netlifyEnabled = form.hasAttribute('data-netlify') || form.dataset.netlify === 'true';
      if (!netlifyEnabled) return;

      event.preventDefault();

      if (isLocal()) {
        form.reset();
        showSubmitState(form, { ok: true, originalText });
        return;
      }

      try {
        const formData = new FormData(form);
        const body = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
          body.append(key, String(value));
        }

        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        if (!response.ok) {
          throw new Error(`Netlify form submission failed: ${response.status}`);
        }

        form.reset();
        showSubmitState(form, { ok: true, originalText });
      } catch {
        showSubmitState(form, { ok: false, originalText });
        try {
          form.submit();
        } catch {
          // no-op
        }
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loader');
  const dismissLoader = () => {
    if (!loader) return;
    requestAnimationFrame(() => {
      loader.classList.add('hidden');
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
      setTimeout(() => { if (loader.parentNode) loader.remove(); }, 1200);
    });
  };

  try {
    await loadContent();
  } catch (e) {
    console.warn('[Metridium] Content load error:', e);
  }

  window.MetridiumContent = getContent();

  try { renderContent(); } catch (e) { console.error('[Metridium] renderContent:', e); }

  let sceneController;
  try { sceneController = initScenes(); } catch (e) { console.error('[Metridium] initScenes:', e); }
  try { initExperienceToggle(sceneController); } catch (e) { console.error('[Metridium] initExperienceToggle:', e); }
  try { initCommandPalette(sceneController?.setScene); } catch (e) { console.error('[Metridium] initCommandPalette:', e); }
  try { initCursor(); } catch (e) { console.error('[Metridium] initCursor:', e); }
  try { initAnemoneInteraction(); } catch (e) { console.error('[Metridium] initAnemoneInteraction:', e); }
  try { initForm(); } catch (e) { console.error('[Metridium] initForm:', e); }
  try { initAliasRotation(); } catch (e) { console.error('[Metridium] initAliasRotation:', e); }
  try { initScopeRotator(); } catch (e) { console.error('[Metridium] initScopeRotator:', e); }

  try {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    if (mobileNavToggle) mobileNavToggle.addEventListener('click', () => {
      const palette = document.getElementById('cmdPalette');
      if (palette) { palette.classList.toggle('is-open'); palette.setAttribute('aria-hidden', !palette.classList.contains('is-open')); }
    });
    const mobileContactBtn = document.getElementById('mobileContactBtn');
    if (mobileContactBtn && typeof window.openContactHUD === 'function') mobileContactBtn.addEventListener('click', window.openContactHUD);
  } catch (e) { console.error('[Metridium] mobileNav:', e); }

  dismissLoader();
});