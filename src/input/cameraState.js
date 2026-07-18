export const cameraState = {
  yaw: 0,
  pitch: 0.55,
  distance: 10.2,
  minPitch: 0.18,
  maxPitch: 0.72,
  minDistance: 5.5,
  maxDistance: 10.5,
};

export function rotateCamera(dx, dy) {
  cameraState.yaw -= dx * 0.008;
  cameraState.pitch = clamp(cameraState.pitch - dy * 0.006, cameraState.minPitch, cameraState.maxPitch);
}

export function zoomCamera(deltaY) {
  cameraState.distance = clamp(cameraState.distance + deltaY * 0.003, cameraState.minDistance, cameraState.maxDistance);
}

export function resetCamera() {
  cameraState.yaw = 0;
  cameraState.pitch = 0.55;
  cameraState.distance = 10.2;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
