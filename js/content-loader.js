/* ============================================================
   METRIDIUM v2 — Content Loader
   Fetches JSON data files and provides content to page modules.
   Single source of truth, replacing the monolithic content.js object.
   ============================================================ */

let content = null;

export async function loadContent() {
  if (content) return content;

  const files = [
    ['meta', '/data/meta.json'],
    ['hero', '/data/hero.json'],
    ['mission', '/data/mission.json'],
    ['about', '/data/about.json'],
    ['platform', '/data/platform.json'],
    ['solutions', '/data/solutions.json'],
    ['connect', '/data/connect.json'],
    ['seafloor', '/data/seafloor.json'],
    ['techApproaches', '/data/tech-approaches.json'],
    ['labsResearch', '/data/labs.json'],
    ['mobileHero', '/data/mobile-hero.json'],
  ];

  const results = await Promise.all(
    files.map(async ([key, url]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} loading ${url}`);
        return [key, await res.json()];
      } catch (e) {
        console.warn(`[Metridium] Failed to load ${key}:`, e);
        return [key, null];
      }
    })
  );

  content = Object.fromEntries(results);

  const labsData = content.labsResearch;
  if (labsData) {
    content.labsResearch = labsData.labsResearch || [];
    content.labsSpecimens = labsData.labsSpecimens || [];
    content.platformNotice = labsData.platformNotice || '';
    content.platformStatus = labsData.platformStatus || [];
    content.labsFooter = labsData.labsFooter || {};
  }

  window.MetridiumContent = content;
  return content;
}

export function getContent() {
  return content || {};
}