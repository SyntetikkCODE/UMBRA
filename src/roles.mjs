export const PREDEFINED_ROLES = Object.freeze([
  'Infanterie', 'Medic', 'Pilote', 'Builders', 'Recon',
  'Sniper', 'Driver', 'Launcher', 'Libre'
]);
export const CUSTOM_ROLE = '__custom__';
export const roleChoice = role => PREDEFINED_ROLES.includes(role) ? role : CUSTOM_ROLE;
// Keep stable stored identities: old Recon becomes Breacher, old Sniper becomes Recon.
// Renaming the stored strings would confuse these two roles on older clients/imports.
const ROLE_LABELS=new Map([['Infanterie','Entry Frag'],['Sniper','Recon'],['Recon','Breacher']]);
export const roleLabel=role=>ROLE_LABELS.get(role)??role;
