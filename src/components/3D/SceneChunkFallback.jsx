// 動態場景程式區塊載入探針。
// 掛載時標示程式區塊尚未就緒，卸載代表 React.lazy 已完成載入。
import { useEffect } from 'react';
import { useStore } from '../../store/useStore.js';

export default function SceneChunkFallback() {
  useEffect(() => {
    useStore.getState().setSceneChunkLoading(true);
    return () => useStore.getState().setSceneChunkLoading(false);
  }, []);
  return null;
}
