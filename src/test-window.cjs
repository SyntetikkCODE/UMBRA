// Opt-in only for isolated UI runs. Show on the right display without activating it.
function testWindowPlacement(screen,env=process.env){
 if(env.UMBRA_TEST_DISPLAY!=='right'||!env.UMBRA_DATA_DIR)return null;
 const primary=screen.getPrimaryDisplay(),display=screen.getAllDisplays().filter(d=>d.bounds.x>=primary.bounds.x+primary.bounds.width).sort((a,b)=>a.bounds.x-b.bounds.x)[0];
 if(!display)throw new Error('Aucun écran de test disponible à droite.');
 const area=display.workArea;return {x:area.x+20,y:area.y+20,width:Math.min(1540,area.width-40),height:Math.min(990,area.height-40)};
}
module.exports={testWindowPlacement};
