import {MarkdownIt,highlight} from '../assets/chat-vendor.mjs';
import {primaryRoleIcon} from './profile-appearance.mjs';
export const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const EMOJIS={
 'Visages':['😀','😃','😁','😆','😂','🤣','😊','🙂','😉','😍','🥰','😎','🤔','🫡','🤫','😴','😬','😢','😭','😡','🤯','🥳','🤩','🤓','😈','💀'],
 'Gestes':['👍','👎','👌','✌️','🤞','🤝','👏','🙌','💪','👊','🖐️','🫶','🙏','👀','🧠','❤️','💛','🖤','🔥','💯'],
 'Tactique':['🎯','⚔️','🛡️','💣','🚀','🚁','✈️','🚗','🚚','🏗️','🧱','🩺','💊','📡','🛰️','🧭','🗺️','📍','🚩','🏴','🏆','🥇'],
 'Objets':['✅','❌','⚠️','⛔','🔒','🔓','🔔','📢','📣','💬','🎙️','🎧','🔊','🔇','📅','⏰','⏳','📝','📋','📌','🔧','⚙️','💡','⭐','✨','🎉','☕','🍻','🍕']
};
const md=new MarkdownIt({html:false,linkify:true,breaks:true,highlight:(code,lang)=>{if(lang&&highlight.getLanguage(lang))return highlight.highlight(code,{language:lang,ignoreIllegals:true}).value;return escapeText(code);}});
md.inline.ruler.at('text',(state,silent)=>{let end=state.pos;while(end<state.posMax&&!/[\n\\`*_\[\]!<&~|@]/.test(state.src[end]))end++;if(end===state.pos)return false;if(!silent)state.pending+=state.src.slice(state.pos,end);state.pos=end;return true;});
md.validateLink=url=>/^https?:\/\//i.test(url);
md.renderer.rules.image=(tokens,i)=>escapeText(tokens[i].content);
for(const side of ['open','close'])md.renderer.rules['strong_'+side]=(tokens,i)=>tokens[i].markup==='__'?side==='open'?'<u>':'</u>':side==='open'?'<strong>':'</strong>';
md.renderer.rules.link_open=(tokens,i,options,env,self)=>{tokens[i].attrSet('rel','noopener noreferrer');tokens[i].attrSet('data-chat-link','');return self.renderToken(tokens,i,options);};
md.inline.ruler.before('emphasis','spoiler',(state,silent)=>{
 if(state.src.slice(state.pos,state.pos+2)!=='||')return false;const end=state.src.indexOf('||',state.pos+2);if(end<state.pos+3)return false;
 if(!silent){const token=state.push('spoiler','',0);token.content=state.src.slice(state.pos+2,end);token.children=[];state.md.inline.parse(token.content,state.md,state.env,token.children);}state.pos=end+2;return true;
});
md.renderer.rules.spoiler=(tokens,i,options,env)=>'<span class="chat-spoiler" role="button" tabindex="0" aria-label="Révéler le spoiler">'+md.renderer.renderInline(tokens[i].children,options,env)+'</span>';
md.inline.ruler.before('text','mention',(state,silent)=>{
 const source=state.src.slice(state.pos),players=state.env.players||[];let length=0,id=null,name=null;
 const canonical=/^<@([a-zA-Z0-9_-]+)>/.exec(source);if(canonical){const p=players.find(p=>p.id===canonical[1]);if(p){id=p.id;name=p.name;length=canonical[0].length;}}
 if(!length&&source[0]==='@'&&(state.pos===0||!/[\p{L}\p{N}_]/u.test(state.src[state.pos-1]))){
  if(/^@everyone(?![\p{L}\p{N}_])/u.test(source)){id='everyone';name='everyone';length=9;}
  else for(const p of [...players].sort((a,b)=>b.name.length-a.name.length)){if(source.slice(1,p.name.length+1).toLocaleLowerCase()===p.name.toLocaleLowerCase()&&!/[\p{L}\p{N}_]/u.test(source[p.name.length+1]||'')){id=p.id;name=p.name;length=p.name.length+1;break;}}
 }
 if(!length)return false;if(!silent){const token=state.push('mention','',0);token.content=name;token.meta={id};state.env.mentions?.add(id);}state.pos+=length;return true;
});
md.renderer.rules.mention=(tokens,i,options,env)=>`<span class="chat-mention" data-mention="${escapeText(tokens[i].meta.id)}">${tokens[i].meta.id==='everyone'?'':primaryRoleIcon(env.players.find(p=>p.id===tokens[i].meta.id))}@${escapeText(tokens[i].content)}</span>`;
md.block.ruler.before('paragraph','subtext',(state,line,end,silent)=>{
 const start=state.bMarks[line]+state.tShift[line],text=state.src.slice(start,state.eMarks[line]);if(!text.startsWith('-# '))return false;if(silent)return true;
 const open=state.push('subtext_open','div',1);open.attrSet('class','chat-subtext');const inline=state.push('inline','',0);inline.content=text.slice(3);inline.children=[];state.push('subtext_close','div',-1);state.line=line+1;return true;
});
function quoteTail(text){const lines=text.split('\n');let fence=null,multi=false;return lines.map(line=>{const match=/^\s*(`{3,}|~{3,})/.exec(line);if(match){if(!fence)fence=match[1][0];else if(fence===match[1][0])fence=null;}if(!fence&&line.startsWith('>>> ')){multi=true;return '> '+line.slice(4);}return multi?'> '+line:line;}).join('\n');}
export function formatMessage(text,players=[]){const env={players,mentions:new Set()};const html=md.render(quoteTail(text),env);return {html,mentions:[...env.mentions].filter(id=>id!=='everyone'),everyone:env.mentions.has('everyone')};}
