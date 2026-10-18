import fs from 'node:fs/promises';
import path from 'node:path';
import {RELEASE_NOTES,releaseNotesHtml,releaseNotesMarkdown} from '../src/release-notes.mjs';
const root=path.resolve(import.meta.dirname,'..'),pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'))),check=process.argv.includes('--check');
if(RELEASE_NOTES[0].version!==pkg.version)throw new Error('Add release notes for the package version before building.');
if(new Set(RELEASE_NOTES.map(r=>r.version)).size!==RELEASE_NOTES.length)throw new Error('Duplicate release notes version.');
const page=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101010"><meta name="description" content="Toutes les notes de mise à jour UMBRA, des premiers prototypes à la version ${pkg.version}."><title>Notes de mise à jour — UMBRA</title><link rel="icon" href="../assets/mark.svg?v=2" type="image/svg+xml"><link rel="stylesheet" href="../style.css?v=3"><link rel="stylesheet" href="../patchnotes.css?v=1"></head>
<body><a class="skip" href="#main">Aller au contenu</a><header class="topbar wrap"><a class="brand" href="../" aria-label="UMBRA, accueil"><img src="../assets/mark.svg?v=2" alt="" width="30" height="36"><span>UMBRA<small>WARDOGS COMPANION</small></span></a><nav aria-label="Navigation"><a href="../">Télécharger l’application</a><a href="https://github.com/SyntetikkCODE/UMBRA/blob/main/CHANGELOG.md">GitHub</a></nav></header><main id="main" class="wrap patchnotes-site">${releaseNotesHtml()}</main><footer class="wrap"><span class="footer-brand">UMBRA <span>/</span> WARDOGS COMPANION</span><a href="../">Retour au téléchargement</a><a href="../licenses.html">Licences</a></footer></body></html>
`;
const files=new Map([['CHANGELOG.md',releaseNotesMarkdown()],['site/patchnotes/index.html',page],['site/patchnotes.css',await fs.readFile(path.join(root,'src/patchnotes.css'),'utf8')]]);
for(const [name,content]of files){const target=path.join(root,name);if(check){if(await fs.readFile(target,'utf8')!==content)throw new Error('Regenerate release notes: '+name);}else{await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,content);}}
console.log((check?'Checked':'Generated')+' '+RELEASE_NOTES.length+' release entries for GitHub and the static website.');
