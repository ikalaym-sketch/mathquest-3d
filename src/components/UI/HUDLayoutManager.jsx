// HUD 版位管理器：將裝置尺寸、左右手模式、字級、動態效果與色覺模式同步為根節點資料屬性。
import { useEffect } from 'react';
import { useStore } from '../../store/useStore.js';

export default function HUDLayoutManager() {
  const preferences = useStore((state) => state.uiPreferences);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      root.dataset.mqDevice = width < 680 ? 'phone' : width < 1100 ? 'tablet' : 'desktop';
      root.dataset.mqOrientation = width >= height ? 'landscape' : 'portrait';
      root.dataset.mqHandedness = preferences.handedness;
      root.dataset.mqTextScale = preferences.textScale;
      root.dataset.mqHudScale = preferences.hudScale;
      root.dataset.mqCompactHud = String(preferences.compactHud);
      root.dataset.mqHighContrast = String(preferences.highContrast);
      root.dataset.mqColorVision = preferences.colorVision;
      root.dataset.mqReducedMotion = String(preferences.reducedMotion);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [preferences]);

  return null;
}
