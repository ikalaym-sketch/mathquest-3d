// WebGL Runtime 驗收探針：記錄 FPS、Renderer、Viewport 與場景物件量。
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  reportRuntimeFrame,
  reportRuntimeRenderer,
  reportRuntimeScene,
  reportRuntimeViewport,
} from '../../input/runtimeAcceptance.js';

export default function RuntimeAcceptanceProbe() {
  const { gl, scene, size } = useThree();
  const accumulator = useRef({ elapsed: 0, frames: 0, sceneElapsed: 0 });

  useEffect(() => {
    const context = gl.getContext();
    reportRuntimeRenderer({
      webglVersion: typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext ? 2 : 1,
      vendor: context.getParameter(context.VENDOR),
      renderer: context.getParameter(context.RENDERER),
      maxTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
      antialias: Boolean(gl.getContextAttributes()?.antialias),
      pixelRatio: gl.getPixelRatio(),
    });
  }, [gl]);

  useEffect(() => {
    reportRuntimeViewport({ width: size.width, height: size.height, pixelRatio: gl.getPixelRatio() });
  }, [gl, size.height, size.width]);

  useFrame((_, delta) => {
    const meter = accumulator.current;
    meter.elapsed += delta;
    meter.sceneElapsed += delta;
    meter.frames += 1;
    if (meter.elapsed >= 1) {
      reportRuntimeFrame(meter.frames / meter.elapsed);
      meter.elapsed = 0;
      meter.frames = 0;
    }
    if (meter.sceneElapsed >= 2) {
      let meshes = 0;
      let skinnedMeshes = 0;
      let lights = 0;
      scene.traverse((node) => {
        if (node.isMesh) meshes += 1;
        if (node.isSkinnedMesh) skinnedMeshes += 1;
        if (node.isLight) lights += 1;
      });
      reportRuntimeScene({
        children: scene.children.length,
        meshes,
        skinnedMeshes,
        lights,
        triangles: gl.info.render.triangles,
        drawCalls: gl.info.render.calls,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      });
      meter.sceneElapsed = 0;
    }
  });

  return null;
}
