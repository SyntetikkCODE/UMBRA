export const PREDEFINED_ROLES = Object.freeze([
  'Infanterie', 'Medic', 'Pilote', 'Builders', 'Recon',
  'Sniper', 'Driver', 'Launcher', 'Libre'
]);
export const CUSTOM_ROLE = '__custom__';
export const roleChoice = role => PREDEFINED_ROLES.includes(role) ? role : CUSTOM_ROLE;
