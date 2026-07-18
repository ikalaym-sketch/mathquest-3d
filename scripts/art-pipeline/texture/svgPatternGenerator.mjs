// v0.29.1 SVG Pattern 生成器。
// SVG 僅作 Canonical Source；Runtime 之後由 Atlas/KTX2 管線使用，不要求使用者手動繪製或匯入。
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const SVG_PATTERN_RECIPES = Object.freeze([
  { id: 'wood_plank_seams', purpose: '木板接縫', atlas: 'atlas_village', svg: woodPlanks },
  { id: 'storybook_bricks', purpose: '童話磚牆', atlas: 'atlas_village', svg: storybookBricks },
  { id: 'star_rune', purpose: '星光符文', atlas: 'atlas_interior_festival_tower', svg: starRune },
  { id: 'clockwork_panel', purpose: '機械控制面板', atlas: 'atlas_clockwork', svg: clockworkPanel },
  { id: 'shield_emblem', purpose: '盾牌徽章', atlas: 'atlas_equipment_metal', svg: shieldEmblem },
  { id: 'festival_flags', purpose: '節慶旗幟', atlas: 'atlas_interior_festival_tower', svg: festivalFlags },
  { id: 'math_book_cover', purpose: '數學書封', atlas: 'atlas_residents', svg: mathBookCover },
  { id: 'mushroom_spots', purpose: '蘑菇斑紋', atlas: 'atlas_mushroom', svg: mushroomSpots },
]);

export async function generateSvgPatterns(outputDir) {
  await mkdir(outputDir, { recursive: true });
  const outputs = [];
  for (const recipe of SVG_PATTERN_RECIPES) {
    const filename = `${recipe.id}.svg`;
    await writeFile(path.join(outputDir, filename), recipe.svg(), 'utf8');
    outputs.push({ id: recipe.id, purpose: recipe.purpose, atlas: recipe.atlas, filename, source: 'generated-svg-code', runtimePolicy: 'source-only-rasterize-to-atlas' });
  }
  return outputs;
}

const svgRoot = (body, viewBox = '0 0 256 256') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="256" height="256">${body}</svg>\n`;
function woodPlanks() { return svgRoot(`<rect width="256" height="256" fill="#9b6542"/><g stroke="#5f3828" stroke-width="5" opacity=".72"><path d="M0 64h256M0 128h256M0 192h256"/><path d="M42 0v64M164 0v64M92 64v64M220 64v64M35 128v64M151 128v64M84 192v64M205 192v64"/></g><g fill="none" stroke="#c98a5d" stroke-width="3" opacity=".5"><path d="M18 28c38-18 68 18 105 0s70 18 115 0"/><path d="M6 159c42-17 77 17 118 0s75 18 126 0"/></g>`); }
function storybookBricks() { return svgRoot(`<rect width="256" height="256" fill="#d49777"/><g fill="none" stroke="#f2c2a9" stroke-width="7"><path d="M0 51h256M0 102h256M0 153h256M0 204h256"/><path d="M51 0v51M154 0v51M102 51v51M205 51v51M51 102v51M154 102v51M102 153v51M205 153v51M51 204v52M154 204v52"/></g>`); }
function starRune() { return svgRoot(`<rect width="256" height="256" fill="#29345f"/><g fill="none" stroke="#f8d86a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="88"/><path d="M128 42l20 61 64 1-52 37 19 62-51-38-51 38 19-62-52-37 64-1z"/><circle cx="128" cy="128" r="18"/></g>`); }
function clockworkPanel() { return svgRoot(`<rect width="256" height="256" rx="18" fill="#37434a"/><g fill="none" stroke="#bd8a4a" stroke-width="9"><circle cx="72" cy="76" r="35"/><circle cx="184" cy="176" r="46"/><path d="M72 25v102M21 76h102M184 112v128M120 176h128"/></g><g fill="#75d9d2"><circle cx="178" cy="62" r="13"/><rect x="140" y="84" width="76" height="14" rx="7"/></g>`); }
function shieldEmblem() { return svgRoot(`<rect width="256" height="256" fill="none"/><path d="M128 22l84 32v62c0 61-35 101-84 123-49-22-84-62-84-123V54z" fill="#416b91" stroke="#e7d38c" stroke-width="12"/><path d="M128 57l19 42 46 5-35 31 10 45-40-23-40 23 10-45-35-31 46-5z" fill="#f5db70"/>`); }
function festivalFlags() { return svgRoot(`<rect width="256" height="256" fill="#f7f0df"/><path d="M0 48c68 22 178-19 256 2" fill="none" stroke="#6e5547" stroke-width="7"/><g stroke="#6e5547" stroke-width="3"><path d="M25 52l26 61 26-52z" fill="#ef7f79"/><path d="M83 58l26 61 26-66z" fill="#f0c558"/><path d="M143 54l26 61 26-68z" fill="#71bfa6"/><path d="M201 49l26 61 26-68z" fill="#7ca7df"/></g>`); }
function mathBookCover() { return svgRoot(`<rect x="28" y="18" width="200" height="220" rx="20" fill="#4b87b5"/><rect x="43" y="34" width="170" height="188" rx="12" fill="#ecf6ff"/><g fill="#31546e" font-family="sans-serif" font-weight="700" text-anchor="middle"><text x="128" y="86" font-size="34">1 + 2</text><text x="128" y="132" font-size="35">× ÷</text><text x="128" y="181" font-size="31">△ ○ □</text></g>`); }
function mushroomSpots() { return svgRoot(`<rect width="256" height="256" fill="#b65998"/><g fill="#f8c7e8"><circle cx="41" cy="45" r="20"/><circle cx="116" cy="67" r="14"/><circle cx="202" cy="40" r="25"/><circle cx="73" cy="145" r="27"/><circle cx="170" cy="137" r="18"/><circle cx="219" cy="208" r="24"/><circle cx="120" cy="224" r="12"/></g>`); }
