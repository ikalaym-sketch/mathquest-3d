// v0.29 裝備掛載元件：正式 GLB 存在時自動載入，尚未生產時使用可辨識程序備援。
import Model from './Model.jsx';
import Outlined from './Outlined.jsx';
import { resolveEquipmentVisualProfile } from '../../services/EquipmentVisualResolverService.js';

export default function EquipmentAttachmentMesh({ equipmentRef, equipmentInstances, slot }) {
  const profile = resolveEquipmentVisualProfile(equipmentRef, equipmentInstances, slot);
  if (!profile) return null;
  const fallback = <ProceduralEquipment profile={profile} />;
  if (!profile.hasCanonicalAsset) return fallback;
  return (
    <Model
      assetId={profile.assetId}
      kind="equipment"
      instanceId={`equipment-${profile.instance.instanceId}-${slot}`}
      position={profile.transform.position}
      rotation={profile.transform.rotation}
      scale={profile.transform.scale}
      fallback={fallback}
    />
  );
}

function ProceduralEquipment({ profile }) {
  const color = rarityColor(profile.item.rarity);
  if (profile.slot === 'head') return <Outlined color={color} position={[0, 0.06, 0]} outlineScale={1.01}><cylinderGeometry args={[0.28, 0.34, 0.24, 10]} /></Outlined>;
  if (profile.slot === 'offHand') return <Outlined color={color} rotation={[0, Math.PI / 2, 0]} outlineScale={1.01}><cylinderGeometry args={[0.34, 0.34, 0.08, 12]} /></Outlined>;
  if (profile.slot === 'accessory') return <Outlined color={color} rotation={[Math.PI / 2, 0, 0]} outlineScale={1.01}><torusGeometry args={[0.12, 0.035, 8, 16]} /></Outlined>;
  if (profile.slot === 'body') return <Outlined color={color} outlineScale={1.008}><cylinderGeometry args={[0.34, 0.4, 0.82, 12]} /></Outlined>;
  if (profile.slot === 'hands') return <group><Outlined color={color} position={[-0.46, 0, 0]} outlineScale={1.01}><sphereGeometry args={[0.13, 8, 6]} /></Outlined><Outlined color={color} position={[0.46, 0, 0]} outlineScale={1.01}><sphereGeometry args={[0.13, 8, 6]} /></Outlined></group>;
  if (profile.slot === 'legs') return <group><Outlined color={color} position={[-0.18, 0, 0]} outlineScale={1.01}><cylinderGeometry args={[0.14, 0.16, 0.58, 8]} /></Outlined><Outlined color={color} position={[0.18, 0, 0]} outlineScale={1.01}><cylinderGeometry args={[0.14, 0.16, 0.58, 8]} /></Outlined></group>;
  if (profile.slot === 'feet') return <group><Outlined color={color} position={[-0.18, 0, 0.08]} outlineScale={1.01}><boxGeometry args={[0.25, 0.16, 0.38]} /></Outlined><Outlined color={color} position={[0.18, 0, 0.08]} outlineScale={1.01}><boxGeometry args={[0.25, 0.16, 0.38]} /></Outlined></group>;
  if (profile.slot !== 'mainHand') return null;
  return <WeaponFallback archetype={profile.archetype} color={color} />;
}

function WeaponFallback({ archetype, color }) {
  if (['bow', 'crossbow'].includes(archetype)) return <group rotation={[0, 0, -0.15]}><Outlined color={color} position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.34, 0.055, 8, 18, Math.PI]} /></Outlined><Outlined color="#f0d27f" position={[0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 0.9, 6]} /></Outlined></group>;
  if (['staff', 'lance', 'blowgun'].includes(archetype)) return <group rotation={[0.12, 0, -0.12]}><Outlined color="#775237" position={[0, -0.02, 0]}><cylinderGeometry args={[0.035, 0.045, 1.25, 8]} /></Outlined><Outlined color={color} position={[0, 0.62, 0]}><octahedronGeometry args={[0.13, 0]} /></Outlined></group>;
  if (['warhammer', 'greataxe', 'greatsword', 'scythe'].includes(archetype)) return <group rotation={[0.12, 0, -0.18]}><Outlined color="#6c4b31" position={[0, -0.22, 0]}><cylinderGeometry args={[0.045, 0.055, 0.85, 8]} /></Outlined><Outlined color={color} position={[0, 0.28, 0]}><boxGeometry args={archetype === 'warhammer' ? [0.42, 0.2, 0.2] : [0.16, 0.72, 0.12]} /></Outlined></group>;
  if (['grimoire'].includes(archetype)) return <Outlined color={color} rotation={[0.1, 0.3, 0]}><boxGeometry args={[0.38, 0.48, 0.1]} /></Outlined>;
  if (['orb'].includes(archetype)) return <Outlined color={color}><icosahedronGeometry args={[0.18, 1]} /></Outlined>;
  if (['boomerang', 'throwing_axe', 'shuriken', 'throwing_knives'].includes(archetype)) return <Outlined color={color} rotation={[0, 0, 0.7]}><octahedronGeometry args={[0.22, 0]} /></Outlined>;
  if (['gauntlets'].includes(archetype)) return <Outlined color={color}><boxGeometry args={[0.22, 0.22, 0.28]} /></Outlined>;
  return <group rotation={[0.15, 0, -0.15]}><Outlined color="#6c4b31" position={[0, -0.22, 0]}><cylinderGeometry args={[0.045, 0.055, 0.45, 8]} /></Outlined><Outlined color={color} position={[0, 0.18, 0]}><boxGeometry args={[0.09, 0.78, 0.09]} /></Outlined><Outlined color="#e8d28c" position={[0, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.34, 0.07, 0.08]} /></Outlined></group>;
}

function rarityColor(rarity) {
  if (rarity === 'Orange') return '#e8801a';
  if (rarity === 'Blue') return '#3a8ae8';
  return '#8a8a8a';
}
