import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 部署設定：base 需對應 repo 名稱
// 若你的 repo 叫 mathquest-3d，部署網址為 https://<user>.github.io/mathquest-3d/
export default defineConfig({
  plugins: [react()],
  base: '/mathquest-3d/', // 【部署】請改成你的 repo 名稱
  build: {
    chunkSizeWarningLimit: 2500, // Rapier WASM ~2MB 為固有下限
    rollupOptions: {
      output: {
        // 手動拆分大型依賴，改善載入與快取
        // r3f 生態(fiber/drei/rapier)彼此依賴，合併為單一 chunk 避免循環
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/recharts/')) return 'charts';
          if (id.includes('/@dimforge/rapier') || id.includes('/@react-three/rapier')) return 'physics';
          if (id.includes('/@react-three/drei/')) return 'drei';
          if (id.includes('/@react-three/fiber/')) return 'r3f';
          if (id.includes('/three/')) return 'three';
          return undefined;
        },
      },
    },
  },
});
