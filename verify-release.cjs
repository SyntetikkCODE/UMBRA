const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),asar=require('@electron/asar');
const root=path.resolve(__dirname),output=path.resolve(root,'dist/win-unpacked'),archive=path.join(output,'resources/app.asar');
const source=JSON.parse(fs.readFileSync(path.join(root,'package.json'))),pkg=JSON.parse(asar.extractFile(archive,'package.json'));assert.equal(pkg.version,source.version);
function sourceFiles(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?sourceFiles(dir+'/'+e.name):[dir+'/'+e.name]);}
const shipped=['main.cjs','preload.cjs','index.html',...sourceFiles('src'),...sourceFiles('assets').filter(f=>f!=='assets/wardogs-reference.png'),...sourceFiles('licenses')];
for(const file of shipped)assert.deepEqual(asar.extractFile(archive,path.join(...file.split('/'))),fs.readFileSync(path.join(root,file)),file);
const files=asar.listPackage(archive);assert.ok(!files.some(f=>/^[/\\](tests|artifacts|runtime)[/\\]/.test(f)));
assert.ok(files.some(f=>f.endsWith('.node')));assert.ok(fs.existsSync(path.join(output,'resources/app.asar.unpacked')));
assert.deepEqual(fs.readFileSync(path.join(output,'LIRE-MOI.md')),fs.readFileSync(path.join(root,'LIRE-MOI.md')));
assert.ok(fs.existsSync(path.resolve(output,'../UMBRA-Setup-'+pkg.version+'-win64.exe')));
console.log('Final '+pkg.version+' installer matches source ('+shipped.length+' files), includes sounds and native bindings, excludes test data.');
