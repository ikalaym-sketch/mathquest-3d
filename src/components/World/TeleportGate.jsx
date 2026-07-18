// 統一傳送門視覺元件：提供清楚圖示與文字，點擊後由上層決定目的地。
import { Html } from '@react-three/drei';
import Outlined from '../3D/Outlined.jsx';
import Model from '../3D/Model.jsx';
import { getPortalEffectAssetId } from '../../data/eventEffectV035Catalog.js';

export default function TeleportGate({ position = [0, 0, 0], color = '#55c8e8', icon = '✦', label, onActivate, portalType = 'region', effectAssetId = null }) {
  const portalAssetId = effectAssetId || getPortalEffectAssetId(portalType);
  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onActivate?.();
      }}
    >
      <Model assetId={portalAssetId} kind="portal-vfx" materialOverrides={{ portal_core: color }} />
      <Outlined color={color} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]} outlineScale={1.025}>
        <torusGeometry args={[1.15, 0.18, 12, 28]} />
      </Outlined>
      <mesh position={[0, 1.5, 0]}>
        <circleGeometry args={[0.93, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} intensity={1.6} distance={7} color={color} />
      <Html zIndexRange={[20, 0]} position={[0, 3, 0]} center distanceFactor={12}>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onActivate?.();
          }}
          className="whitespace-nowrap rounded-2xl border-2 border-white/80 bg-slate-900/78 px-3 py-1.5 text-xs font-black text-white shadow-xl backdrop-blur-sm active:scale-95"
        >
          <span className="mr-1 text-base">{icon}</span>{label}
        </button>
      </Html>
    </group>
  );
}
