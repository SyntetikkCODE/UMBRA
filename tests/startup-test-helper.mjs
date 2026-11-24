// Keep unrelated UI acceptance flows past first-run announcements. The complete
// queue, persistence and migration behavior is exercised in startup-notices-ui.
export async function dismissStartup(page){
 await page.locator('#tour').waitFor({state:'detached'});
 for(let i=0;i<2;i++){const dialog=page.locator('#startup-notice[open]');try{await dialog.waitFor({state:'visible',timeout:1200});}catch{return;}const kind=await dialog.getAttribute('data-notice');await dialog.locator('footer [data-startup-close]').click();await page.locator('#startup-notice[data-notice="'+kind+'"]').waitFor({state:'detached'});}
}
