import {PREDEFINED_ROLES,roleLabel} from './roles.mjs';
import {roleIcons} from '../assets/role-icons.mjs';
export const PROFILE_ROLES=PREDEFINED_ROLES;
export const DEFAULT_PROFILE_GRADIENT=Object.freeze({start:'#34322b',end:'#171717',angle:135});
export function profileAppearance(p){return {banner:p.banner||'',gradient:{...DEFAULT_PROFILE_GRADIENT,...p.profileGradient},primaryRole:p.primaryRole||'Libre',secondaryRole:p.secondaryRole||''};}
export function validateProfileAppearance(p){
 if(p.banner!==undefined&&(typeof p.banner!=='string'||p.banner.length>600000||p.banner&&!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(p.banner)))throw new Error('Bannière invalide.');
 if(p.profileGradient!==undefined){const g=p.profileGradient;if(!g||typeof g!=='object'||Array.isArray(g)||!/^#[a-fA-F0-9]{6}$/.test(g.start)||!/^#[a-fA-F0-9]{6}$/.test(g.end)||!Number.isInteger(g.angle)||g.angle<0||g.angle>360)throw new Error('Dégradé de profil invalide.');}
 if(p.primaryRole!==undefined&&!PROFILE_ROLES.includes(p.primaryRole)||p.secondaryRole!==undefined&&p.secondaryRole!==''&&!PROFILE_ROLES.includes(p.secondaryRole))throw new Error('Spécialité de profil invalide.');
 if(p.secondaryRole&&p.secondaryRole===(p.primaryRole||'Libre'))throw new Error('Choisis deux spécialités différentes.');
}
export function primaryRoleIcon(p){const role=profileAppearance(p||{}).primaryRole;return `<span class="primary-role-icon" data-profile-role="${role}" title="Spécialité principale : ${roleLabel(role)}" aria-label="Spécialité principale : ${roleLabel(role)}">${roleIcons[role]}</span>`;}
export function profileBackground(p){const a=profileAppearance(p),g=a.gradient;return `background:linear-gradient(${g.angle}deg,${g.start},${g.end})`;}
