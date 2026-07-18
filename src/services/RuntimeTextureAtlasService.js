// v0.30 Runtime Texture Atlas 服務。
// 優先載入 KTX2；若裝置或轉碼器失敗，立即回退 PNG。每個模型只建立一組 Tile Texture View，避免每個 Mesh 重複載入Atlas。
import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { resolvePublicAssetUrl } from './AssetPathService.js';
import { resolveMaterialRuntimeProfile } from './MaterialProfileService.js';

const ATLAS_CHANNELS = Object.freeze(['baseColor', 'normal', 'orm', 'emissive', 'mask']);
const rendererCaches = new WeakMap();
const pngCache = new Map();

export async function applyRuntimeTextureAtlas(root, asset, renderer, options = {}) {
  const quality = options.quality || 'medium';
  const profile = resolveMaterialRuntimeProfile(asset?.materialProfile, quality);
  if (!profile.atlasId || quality === 'off') return createEmptyRuntime(profile);

  const baseTextures = await loadAtlasChannels(profile.atlasId, renderer);
  const tile = resolveAtlasTile(asset?.assetId || profile.atlasId);
  const textureViews = createTileTextureViews(baseTextures, tile);
  const ownedMaterials = [];

  root.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    const next = materials.map((source) => {
      if (!source || source.isShaderMaterial) return source;
      const material = source.clone();
      ownedMaterials.push(material);
      material.map = textureViews.baseColor || material.map;
      material.normalMap = textureViews.normal || material.normalMap;
      if (textureViews.orm) {
        material.aoMap = textureViews.orm;
        material.roughnessMap = textureViews.orm;
        material.metalnessMap = textureViews.orm;
      }
      if (textureViews.emissive) {
        material.emissiveMap = textureViews.emissive;
        material.emissive = material.emissive?.set?.('#ffffff') || new THREE.Color('#ffffff');
        material.emissiveIntensity = Math.max(0.12, material.emissiveIntensity || 0);
      }
      material.userData = { ...material.userData, atlasId: profile.atlasId, atlasTile: tile };
      material.needsUpdate = true;
      return material;
    });
    node.material = Array.isArray(node.material) ? next : next[0];
  });

  return {
    profile,
    atlasId: profile.atlasId,
    tile,
    format: baseTextures.format,
    dispose() {
      for (const material of new Set(ownedMaterials)) material.dispose?.();
      for (const texture of Object.values(textureViews)) texture?.dispose?.();
      releaseAtlasChannels(profile.atlasId, renderer);
    },
  };
}

async function loadAtlasChannels(atlasId, renderer) {
  if (!renderer) return loadPngAtlasChannels(atlasId);
  const cache = getRendererCache(renderer);
  const existing = cache.entries.get(atlasId);
  if (existing) {
    existing.refs += 1;
    return existing.promise;
  }
  const entry = { refs: 1, promise: null, textures: null };
  entry.promise = loadKtx2AtlasChannels(atlasId, renderer, cache.loader)
    .catch(() => loadPngAtlasChannels(atlasId))
    .then((result) => {
      entry.textures = result;
      return result;
    });
  cache.entries.set(atlasId, entry);
  return entry.promise;
}

function releaseAtlasChannels(atlasId, renderer) {
  if (!renderer) return;
  const cache = rendererCaches.get(renderer);
  const entry = cache?.entries.get(atlasId);
  if (!entry) return;
  entry.refs = Math.max(0, entry.refs - 1);
  if (entry.refs > 0) return;
  cache.entries.delete(atlasId);
  // PNG是跨Renderer共用的Fallback快取；不可在單一Renderer引用歸零時銷毀，
  // 否則pngCache會保留已dispose的Texture並讓後續場景取得失效GPU資源。
  if (!entry.textures?.sharedPng) {
    for (const texture of Object.values(entry.textures?.channels || {})) texture?.dispose?.();
  }
}

function getRendererCache(renderer) {
  if (rendererCaches.has(renderer)) return rendererCaches.get(renderer);
  const loader = new KTX2Loader();
  loader.setTranscoderPath(resolvePublicAssetUrl('basis/'));
  loader.detectSupport(renderer);
  const cache = { loader, entries: new Map() };
  rendererCaches.set(renderer, cache);
  return cache;
}

async function loadKtx2AtlasChannels(atlasId, renderer, loader) {
  const channels = {};
  await Promise.all(ATLAS_CHANNELS.map(async (channel) => {
    try {
      const texture = await loader.loadAsync(resolvePublicAssetUrl(`textures/atlases/${atlasId}_${channel}.ktx2`));
      configureTexture(texture, channel);
      channels[channel] = texture;
    } catch (error) {
      if (channel === 'baseColor') throw error;
    }
  }));
  return { format: 'ktx2', channels };
}

async function loadPngAtlasChannels(atlasId) {
  if (pngCache.has(atlasId)) {
    const cached = await pngCache.get(atlasId);
    return { ...cached, sharedPng: true };
  }
  const promise = (async () => {
    const loader = new THREE.TextureLoader();
    const channels = {};
    await Promise.all(ATLAS_CHANNELS.map(async (channel) => {
      try {
        const texture = await loader.loadAsync(resolvePublicAssetUrl(`textures/atlases/${atlasId}_${channel}.png`));
        configureTexture(texture, channel);
        channels[channel] = texture;
      } catch (error) {
        if (channel === 'baseColor') throw error;
      }
    }));
    return { format: 'png', channels };
  })();
  pngCache.set(atlasId, promise);
  return promise;
}

function createTileTextureViews(baseTextures, tile) {
  const output = {};
  const column = tile % 4;
  const row = Math.floor(tile / 4);
  for (const [channel, texture] of Object.entries(baseTextures.channels || {})) {
    const view = texture.clone();
    view.repeat.set(0.25, 0.25);
    view.offset.set(column * 0.25, 1 - (row + 1) * 0.25);
    view.wrapS = THREE.RepeatWrapping;
    view.wrapT = THREE.RepeatWrapping;
    view.needsUpdate = true;
    output[channel] = view;
  }
  return output;
}

function configureTexture(texture, channel) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if (channel === 'baseColor' || channel === 'emissive') texture.colorSpace = THREE.SRGBColorSpace;
  else texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
}

function resolveAtlasTile(assetId) {
  let hash = 2166136261;
  for (const char of String(assetId)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) % 16;
}

function createEmptyRuntime(profile) {
  return { profile, atlasId: null, tile: null, format: 'none', dispose() {} };
}
