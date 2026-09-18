import fs from 'node:fs';
import path from 'node:path';
const required=['index.html','blog/index.html','classes/index.html','blocks/index.html','workspace/index.html','assets/site.css','assets/app.js','data/catalog.json','404.html'];
for(const f of required) if(!fs.existsSync(path.join('dist',f))) throw Error('Missing '+f);
const c=JSON.parse(fs.readFileSync('dist/data/catalog.json','utf8'));
if(c.classes.length<1 || c.blocks.length<1) throw Error('Catalog groups missing');
for(const x of [...c.classes,...c.blocks]) if(!x.package) throw Error('Package missing: '+x.slug);
for(const k of ['blog','classes','blocks']) if(!fs.existsSync(path.join('dist',k,'index.html'))) throw Error('Group page missing: '+k);
console.log('Regression tests passed: '+c.counts.blog+' blog, '+c.counts.classes+' classes, '+c.counts.blocks+' blocks.');
