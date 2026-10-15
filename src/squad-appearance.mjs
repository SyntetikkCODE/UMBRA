export const SQUAD_ICONS = [
  ['squad','Escouade'],['target','Recon'],['box','Logistique'],
  ['shield','Défense'],['radio','Radio'],['users','Infanterie']
];
export const SQUAD_COLORS = [
  ['#777777','Gris'],['#e6c34b','Jaune'],['#6486ae','Bleu'],
  ['#6a9474','Vert'],['#ad706a','Rouge'],['#9476ae','Violet']
];
export const squadAppearance = q => ({
  icon:SQUAD_ICONS.some(([id])=>id===q?.icon)?q.icon:'squad',
  color:SQUAD_COLORS.some(([color])=>color===q?.color)?q.color:'#777777'
});
export function validateAppearance(q){
  if(q.icon!==undefined&&!SQUAD_ICONS.some(([id])=>id===q.icon))throw new Error('Icône d’escouade invalide.');
  if(q.color!==undefined&&!SQUAD_COLORS.some(([color])=>color===q.color))throw new Error('Couleur d’escouade invalide.');
}
