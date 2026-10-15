import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { reduce, validateState, upgradeState } from './model.mjs';

const derive = promisify(scrypt);
const normalize = name => name.normalize('NFKC').trim().toLocaleLowerCase('fr');
const hash = (password, salt) => derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
function validName(name) {
  if (typeof name !== 'string' || !/^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,31}$/u.test(name.normalize('NFKC').trim())) throw new Error('Choisis un pseudo de 2 à 32 caractères : lettres, chiffres, espaces, tirets ou points.');
  return name.normalize('NFKC').trim();
}

export class Accounts {
  constructor(directory) { this.file = path.join(directory, 'umbra-v2.json'); this.db = null; this.userId = null; this.queue = Promise.resolve(); this.attempts = 0; this.retryAt = 0; this.loginLimits = new Map(); }
  async open() {
    try {
      this.db = JSON.parse(await fs.readFile(this.file, 'utf8'));
      if (this.db.version !== 2 || !Array.isArray(this.db.accounts)) throw new Error('Format incorrect');
      const ids = new Set(), names = new Set();
      for (const a of this.db.accounts) {
        validName(a.name);
        if(a.passwordVersion!==undefined&&(!Number.isSafeInteger(a.passwordVersion)||a.passwordVersion<0)||a.resetHash!==undefined&&(!/^[a-f0-9]{64}$/.test(a.resetHash)||!Number.isFinite(a.resetExpires)||a.resetExpires<=0)||a.resetHash===undefined&&a.resetExpires!==undefined)throw new Error('Compte invalide');
        if (typeof a.id !== 'string' || ids.has(a.id) || names.has(normalize(a.name)) || !/^[a-f0-9]{32}$/.test(a.salt) || !/^[a-f0-9]{128}$/.test(a.hash) || typeof a.tutorialSeen !== 'boolean') throw new Error('Compte invalide');
        ids.add(a.id); names.add(normalize(a.name));
      }
      if (ids.size) {
        this.db.state=upgradeState(this.db.state);
        validateState(this.db.state);
        if (this.db.state.demo || this.db.state.players.length !== ids.size || this.db.state.players.some(p => !ids.has(p.id) || p.name !== this.db.accounts.find(a=>a.id===p.id).name)) throw new Error('Effectifs invalides');
      } else if (this.db.state !== null) throw new Error('État invalide');
    } catch (e) {
      if (e.code === 'ENOENT') this.db = { version: 2, accounts: [], state: null };
      else throw new Error('Les données locales sont illisibles. Le fichier a été conservé ; aucune donnée n’a été remplacée.');
    }
  }
  serialized(fn) { const task = this.queue.then(fn); this.queue = task.catch(()=>{}); return task; }
  async commit(db) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file + '.tmp', JSON.stringify(db, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(this.file + '.tmp', this.file); this.db = db;
  }
  status() { return { needsRegistration: this.db.accounts.length === 0 }; }
  session(userId=this.userId) {
    const account = this.db.accounts.find(a=>a.id===userId);
    if (!account) throw new Error('Connecte-toi pour continuer.');
    return { state: { ...structuredClone(this.db.state), currentUserId: userId }, tutorialSeen: account.tutorialSeen,passwordVersion:account.passwordVersion||0 };
  }
  admin(userId=this.userId) { if (!this.session(userId).state.players.find(p=>p.id===userId).admin) throw new Error('Action réservée aux administrateurs.'); }
  register(credentials) { return this.serialized(async () => {
    const name=validName(credentials?.name), password=credentials?.password;
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new Error('Utilise un mot de passe de 8 à 128 caractères.');
    if (this.db.accounts.some(a=>normalize(a.name)===normalize(name))) throw new Error('Ce pseudo est déjà utilisé.');
    if (this.db.accounts.length >= 300) throw new Error('La limite de comptes locaux est atteinte.');
    const db=structuredClone(this.db), id=randomUUID(), salt=randomBytes(16).toString('hex');
    const passwordHash=(await hash(password,salt)).toString('hex');
    db.accounts.push({id,name,salt,hash:passwordHash,tutorialSeen:false});
    const profile={id,name,admin:db.accounts.length===1,commander:false,squadLeader:false,description:'',picture:''};
    if (!db.state) db.state={version:1,demo:false,currentUserId:id,players:[],squads:[],operations:[],settings:{mic:'',squadVolume:85,leadersVolume:100,ducking:true}};
    db.state.players.push(profile); db.state.currentUserId=id; validateState(db.state);
    await this.commit(db); this.userId=id; return this.session();
  }); }
  login(credentials,limitKey='local') { return this.serialized(async () => {
    const limit=this.loginLimits.get(limitKey)||{attempts:0,retryAt:0};
    if (Date.now() < limit.retryAt) throw new Error('Trop de tentatives. Réessaie dans 30 secondes.');
    const name=typeof credentials?.name==='string'?credentials.name:'';
    const password=typeof credentials?.password==='string'&&credentials.password.length<=128?credentials.password:'';
    const account=this.db.accounts.find(a=>normalize(a.name)===normalize(name));
    const candidate=await hash(password,account?.salt || '00000000000000000000000000000000');
    if (!account || !timingSafeEqual(candidate,Buffer.from(account.hash,'hex'))) {
      limit.attempts++;if(limit.attempts>=5){limit.retryAt=Date.now()+30000;limit.attempts=0;}this.loginLimits.set(limitKey,limit);
      throw new Error('Pseudo ou mot de passe incorrect.');
    }
    this.loginLimits.delete(limitKey);this.userId=account.id;return this.session();
  }); }
  logout() { return this.serialized(async()=>{ this.userId=null; }); }
  beginPasswordReset(playerId,userId=this.userId){return this.serialized(async()=>{
    this.admin(userId);const db=structuredClone(this.db),account=db.accounts.find(a=>a.id===playerId);if(!account)throw new Error('Compte introuvable.');
    const code=randomBytes(18).toString('base64url'),expires=Date.now()+30*60000;account.resetHash=createHash('sha256').update(code).digest('hex');account.resetExpires=expires;await this.commit(db);return {code,expires,name:account.name};
  });}
  resetPassword(credentials,limitKey='local'){return this.serialized(async()=>{
    const key='reset:'+limitKey,limit=this.loginLimits.get(key)||{attempts:0,retryAt:0};if(Date.now()<limit.retryAt)throw new Error('Trop de tentatives. Réessaie dans 30 secondes.');
    const name=typeof credentials?.name==='string'?credentials.name:'',code=typeof credentials?.code==='string'?credentials.code.trim():'';
    const account=this.db.accounts.find(a=>normalize(a.name)===normalize(name)),candidate=createHash('sha256').update(code.slice(0,200)).digest('hex');
    if(!account||!account.resetHash||account.resetExpires<Date.now()||!timingSafeEqual(Buffer.from(candidate),Buffer.from(account.resetHash))){limit.attempts++;if(limit.attempts>=5){limit.retryAt=Date.now()+30000;limit.attempts=0;}this.loginLimits.set(key,limit);throw new Error('Code invalide ou expiré. Demande un nouveau code à un admin.');}
    const password=credentials?.password;if(typeof password!=='string'||password.length<8||password.length>128)throw new Error('Utilise un mot de passe de 8 à 128 caractères.');
    const db=structuredClone(this.db),next=db.accounts.find(a=>a.id===account.id),salt=randomBytes(16).toString('hex');next.salt=salt;next.hash=(await hash(password,salt)).toString('hex');next.passwordVersion=(next.passwordVersion||0)+1;delete next.resetHash;delete next.resetExpires;await this.commit(db);this.loginLimits.delete(key);if(this.userId===account.id)this.userId=null;return {userId:account.id};
  });}
  tutorialDone(userId=this.userId) { return this.serialized(async()=>{this.session(userId);const db=structuredClone(this.db);db.accounts.find(a=>a.id===userId).tutorialSeen=true;await this.commit(db);}); }
  action(action,userId=this.userId) { return this.serialized(async()=>{
    const current=this.session(userId).state;
    if (['addPlayer','clean'].includes(action?.type)) throw new Error('Les joueurs doivent créer leur propre compte.');
    if(action?.type==='profile') {
      action={...action,name:validName(action.name)};
      if(this.db.accounts.some(a=>a.id!==userId && normalize(a.name)===normalize(action.name)))throw new Error('Ce pseudo est déjà utilisé.');
    }
    const next=reduce(current,action),db=structuredClone(this.db);
    db.state=next;
    if(action.type==='profile')db.accounts.find(a=>a.id===userId).name=next.players.find(p=>p.id===userId).name;
    await this.commit(db);return this.session(userId).state;
  }); }
  validateImport(candidate,userId=this.userId) {
    this.admin(userId);validateState(candidate);
    if(candidate.demo || candidate.players.length!==this.db.accounts.length || candidate.players.some(p=>!this.db.accounts.some(a=>a.id===p.id))) throw new Error('Cette sauvegarde contient des profils qui ne correspondent pas aux comptes créés ici. Les anciennes démonstrations ne sont pas importées.');
    const next={...upgradeState(candidate),demo:false,currentUserId:userId,players:structuredClone(this.db.state.players)};
    validateState(next);return next;
  }
  replace(candidate,userId=this.userId) { return this.serialized(async()=>{const next=this.validateImport(candidate,userId),db=structuredClone(this.db);db.state=next;await this.commit(db);return this.session(userId).state;}); }
}
