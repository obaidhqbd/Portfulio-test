import fs from 'node:fs';
import path from 'node:path';
import {CONTENT,walk,slug} from './lib.mjs';
let n=0;
for(const kind of ['blog','classes','blocks']){
  const d=path.join(CONTENT,kind);
  if(!fs.existsSync(d)) continue;
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    if(e.name.startsWith('.')) continue;
    if(e.isDirectory() || /\.zip$/i.test(e.name)){
      n++;
      if(kind==='blog' && e.isDirectory() && !walk(path.join(d,e.name)).some(f=>/\.(md|html)$/i.test(f))) throw Error(kind+'/'+e.name+': missing readable content');
      console.log('[ok]',kind+'/'+slug(e.name));
    }
  }
}
console.log('Validated '+n+' item(s).');
