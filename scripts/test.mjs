import fs from 'node:fs';
import path from 'node:path';

const required = ['index.html','classes/index.html','blocks/index.html','blog/index.html','workspace/index.html','assets/site.css','assets/app.js','data/catalog.json','robots.txt','sitemap.xml','404.html'];
for (const file of required) if (!fs.existsSync(path.join('dist',file))) throw Error('Missing generated file: ' + file);

const catalog = JSON.parse(fs.readFileSync('dist/data/catalog.json','utf8'));
if (!catalog.classes.length || !catalog.blocks.length) throw Error('Classes or Code Blocks catalog is empty.');

for (const item of [...catalog.classes,...catalog.blocks]) {
  if (!item.slug || !item.title || !item.description) throw Error('Incomplete catalog metadata: ' + item.slug);
  if (!item.package) throw Error('Package path missing: ' + item.slug);
  if (!Array.isArray(item.files) || !item.files.length) throw Error('Project file list missing: ' + item.slug);
  const packagePath = path.join('dist',item.package.replace(/^\.\.\//,''));
  if (!fs.existsSync(packagePath)) throw Error('Generated project package missing: ' + packagePath);
}
for (const item of catalog.classes) {
  if (!Array.isArray(item.lessons) || !item.lessons.length) throw Error('Class lessons missing: ' + item.slug);
  if (!Array.isArray(item.tasks) || !item.tasks.length) throw Error('Class tasks missing: ' + item.slug);
}
for (const kind of ['classes','blocks','blog']) for (const item of catalog[kind]) {
  const detail = path.join('dist',kind,item.slug,'index.html');
  if (!fs.existsSync(detail)) throw Error('Missing detail page: ' + detail);
}
const home = fs.readFileSync('dist/index.html','utf8');
for (const id of ['About','Skills','Projects','Classes','Code Blocks','Blog','Contact']) if (!home.includes(id)) throw Error('Homepage section missing: ' + id);
console.log('Regression tests passed: ' + catalog.counts.blog + ' blog, ' + catalog.counts.classes + ' classes, ' + catalog.counts.blocks + ' blocks.');
