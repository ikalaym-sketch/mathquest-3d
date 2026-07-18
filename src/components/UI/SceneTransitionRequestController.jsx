// v0.27.0 道具傳送請求控制器。
// 道具系統只發布請求；真正場景切換仍經過 TransitionManager，避免直接改 currentScene 污染場景代次。
import { useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { goToScene } from './TransitionManager.jsx';

export default function SceneTransitionRequestController() {
  const request = useStore((state) => state.pendingSceneTransition);
  const consume = useStore((state) => state.consumePendingSceneTransition);

  useEffect(() => {
    if (!request?.scene || !request.id) return undefined;
    let cancelled = false;
    (async () => {
      await goToScene(request.scene);
      if (!cancelled) consume(request.id);
    })();
    return () => { cancelled = true; };
  }, [request, consume]);

  return null;
}
