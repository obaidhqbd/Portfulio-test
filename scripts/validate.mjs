import fs from 'node:fs';
import path from 'node:path';
import { CONTENT, walk, slug, json, extractZip, ensure } from './lib.mjs';

let count = 0;
const errors = [];

function validateProject(kind,name) {
  const source = path.join(CONTENT,kind,name);
  const tmp = path.join(process.cwd(),'.validate-cache',kind,slug(name));
  fs.rmSync(tmp,{recursive:true,force:true});
  ensure(tmp);
  try {
    if (/\.zip$/i.test(name)) extractZip(fs.readFileSync(source),tmp);
    else fs.cpSync(source,tmp,{recursive:true});
    const files = walk(tmp).map((f) => path.relative(tmp,f).replaceAll(path.sep,'/'));
    const html = files.find((f) => /(^|\/)index\.html?$/i.test(f)) || files.find((f) => /\.html?$/i.test(f));
    if (!html) errors.push(kind + '/' + name + ': missing an HTML entry file');
    if (fs.existsSync(path.join(tmp,'meta.json')) && json(path.join(tmp,'meta.json'),null) === null) errors.push(kind + '/' + name + ': invalid meta.json');
    if (files.some((f) => f.includes('..'))) errors.push(kind + '/' + name + ': unsafe project path');
    count++;
    console.log('[ok]',kind + '/' + slug(name));
  } catch (error) { errors.push(kind + '/' + name + ': ' + error.message); }
}

for (const kind of ['classes','blocks']) {
  const dir = path.join(CONTENT,kind);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory() || /\.zip$/i.test(entry.name)) validateProject(kind,entry.name);
  }
}

const blogDir = path.join(CONTENT,'blog');
if (fs.existsSync(blogDir)) for (const entry of fs.readdirSync(blogDir,{withFileTypes:true})) {
  if (entry.name.startsWith('.')) continue;
  if (entry.isFile() && /\.md$/i.test(entry.name)) {
    if (!fs.statSync(path.join(blogDir,entry.name)).size) errors.push('blog/' + entry.name + ': empty post');
    count++; console.log('[ok]','blog/' + slug(entry.name));
  }
}

fs.rmSync(path.join(process.cwd(),'.validate-cache'),{recursive:true,force:true});
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Validated ' + count + ' content item(s).');
