import { CHARACTER_PHYSICAL_PROFILES } from '../data/characterPhysicalProfiles.js';

const REQUIRED_PLAYER_SOCKETS = ['head', 'back', 'main_hand', 'off_hand', 'fairy', 'interaction_origin'];
const REQUIRED_PARTS = ['pelvis', 'torso', 'head', 'upper_arm_l', 'lower_arm_l', 'hand_l', 'upper_arm_r', 'lower_arm_r', 'hand_r', 'upper_leg_l', 'lower_leg_l', 'foot_l', 'upper_leg_r', 'lower_leg_r', 'foot_r'];

export function validateCharacterPhysicalProfiles() {
  const errors = [];
  const warnings = [];
  for (const [id, profile] of Object.entries(CHARACTER_PHYSICAL_PROFILES)) {
    if (!profile.collider || profile.collider.shape !== 'capsule') errors.push(`${id}: capsule movement collider is required`);
    if (!Array.isArray(profile.visualParts)) errors.push(`${id}: visualParts are required`);
    for (const part of REQUIRED_PARTS) {
      if (!profile.visualParts?.includes(part)) errors.push(`${id}: missing visual part ${part}`);
    }
    const socketIds = new Set((profile.sockets || []).map((socket) => socket.id));
    if (!socketIds.size) errors.push(`${id}: at least one socket is required`);
    if (id === 'player_child') {
      for (const socketId of REQUIRED_PLAYER_SOCKETS) if (!socketIds.has(socketId)) errors.push(`${id}: missing required socket ${socketId}`);
      if (!Array.isArray(profile.hurtVolumes) || profile.hurtVolumes.length < 2) errors.push(`${id}: head and torso hurt volumes are required`);
    }
    if (profile.height < 1.4 || profile.height > 2.4) warnings.push(`${id}: unusual height ${profile.height}`);
  }
  return { ok: errors.length === 0 && warnings.length === 0, errors, warnings, profileCount: Object.keys(CHARACTER_PHYSICAL_PROFILES).length };
}
