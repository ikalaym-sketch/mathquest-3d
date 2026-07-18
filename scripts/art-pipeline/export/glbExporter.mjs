// Canonical GLB 唯一匯出器：安裝 Node 相容層、執行 Contract 驗證並寫入正式路徑。
import fs from 'node:fs/promises';
import path from 'node:path';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { installNodeFileReader } from './nodeFileReader.mjs';
import { validateSceneContract } from '../validation/contractValidator.mjs';

installNodeFileReader();

export async function exportCanonicalGlb({ scene, animations = [], target, asset, onlyVisible = false }) {
  const validation = validateSceneContract({ scene, animations, asset });
  const exporter = new GLTFExporter();
  const data = await new Promise((resolve, reject) => exporter.parse(
    scene,
    resolve,
    reject,
    { binary: true, animations, onlyVisible, trs: true, includeCustomExtensions: true },
  ));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, Buffer.from(data));
  return { ...validation, target, bytes: Buffer.byteLength(data) };
}
