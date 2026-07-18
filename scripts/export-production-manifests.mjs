import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGION_PRODUCTION_LAYOUTS, REGION_PRODUCTION_IDS } from '../src/data/regionProductionLayouts.js';
import { REGION_STRUCTURE_CATALOG } from '../src/data/physicalObjectCatalog.js';
import { CHARACTER_PHYSICAL_PROFILES } from '../src/data/characterPhysicalProfiles.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicManifestDir = path.join(root, 'public', 'manifests');
const docsDir = path.join(root, 'docs');
fs.mkdirSync(publicManifestDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const regionManifest = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  regionCount: REGION_PRODUCTION_IDS.length,
  subareaCount: REGION_PRODUCTION_IDS.reduce((sum, id) => sum + REGION_PRODUCTION_LAYOUTS[id].subareas.length, 0),
  prefabCount: Object.keys(REGION_STRUCTURE_CATALOG).length,
  regions: REGION_PRODUCTION_IDS.map((id) => {
    const layout = REGION_PRODUCTION_LAYOUTS[id];
    return {
      id,
      size: layout.size,
      boundary: layout.boundary,
      subareas: layout.subareas,
      roads: layout.roads,
      waters: layout.waters,
      bridges: layout.bridges,
      structures: layout.structures.map((instance) => {
        const prefab = REGION_STRUCTURE_CATALOG[instance.type];
        return {
          ...instance,
          footprint: prefab?.footprint || null,
          visualPartCount: prefab?.parts?.length || 0,
          colliderCount: prefab?.colliders?.length || 0,
          socketCount: prefab?.sockets?.length || 0,
        };
      }),
    };
  }),
  prefabs: Object.fromEntries(Object.entries(REGION_STRUCTURE_CATALOG).map(([id, prefab]) => [id, {
    label: prefab.label,
    footprint: prefab.footprint,
    visualParts: prefab.parts.map((part) => ({ id: part.id, shape: part.shape, colorSlot: part.colorSlot })),
    colliders: prefab.colliders.map((collider) => ({ id: collider.id, shape: collider.shape, role: collider.role })),
    sockets: prefab.sockets,
  }])),
};

const characterManifest = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  profileCount: Object.keys(CHARACTER_PHYSICAL_PROFILES).length,
  profiles: CHARACTER_PHYSICAL_PROFILES,
  canonicalRigComponent: 'src/components/3D/CharacterActorRig.jsx',
  requiredRuntimeColliderOwner: 'outer RigidBody',
};

fs.writeFileSync(path.join(publicManifestDir, 'region-production-manifest.json'), `${JSON.stringify(regionManifest, null, 2)}\n`);
fs.writeFileSync(path.join(publicManifestDir, 'character-production-manifest.json'), `${JSON.stringify(characterManifest, null, 2)}\n`);

const regionRows = [['Region_ID', 'Subarea_ID', 'Subarea_Name', 'Elevation', 'Structure_ID', 'Prefab_Type', 'Visual_Parts', 'Colliders', 'Sockets', 'Water_Count', 'Bridge_Count', 'Road_Count']];
for (const id of REGION_PRODUCTION_IDS) {
  const layout = REGION_PRODUCTION_LAYOUTS[id];
  for (const area of layout.subareas) {
    const instances = layout.structures.filter((item) => item.subareaId === area.id);
    for (const instance of instances) {
      const prefab = REGION_STRUCTURE_CATALOG[instance.type];
      regionRows.push([
        id, area.id, area.name, area.elevation, instance.id, instance.type,
        prefab.parts.length, prefab.colliders.length, prefab.sockets.length,
        layout.waters.length, layout.bridges.length, layout.roads.length,
      ]);
    }
  }
}
fs.writeFileSync(path.join(docsDir, 'REGION_PRODUCTION_MATRIX.csv'), `${regionRows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`);

const characterRows = [['Profile_ID', 'Height', 'Radius', 'Visual_Part_Count', 'Collider_Shape', 'Socket_Count', 'Hurt_Volume_Count']];
for (const profile of Object.values(CHARACTER_PHYSICAL_PROFILES)) {
  characterRows.push([
    profile.id, profile.height, profile.radius, profile.visualParts.length,
    profile.collider.shape, profile.sockets.length, profile.hurtVolumes?.length || 0,
  ]);
}
fs.writeFileSync(path.join(docsDir, 'CHARACTER_PHYSICAL_MATRIX.csv'), `${characterRows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`);

console.log(JSON.stringify({
  regionManifest: 'public/manifests/region-production-manifest.json',
  characterManifest: 'public/manifests/character-production-manifest.json',
  regionMatrix: 'docs/REGION_PRODUCTION_MATRIX.csv',
  characterMatrix: 'docs/CHARACTER_PHYSICAL_MATRIX.csv',
  regionCount: regionManifest.regionCount,
  subareaCount: regionManifest.subareaCount,
  prefabCount: regionManifest.prefabCount,
}, null, 2));

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
