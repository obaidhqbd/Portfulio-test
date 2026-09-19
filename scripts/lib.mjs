import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

export const ROOT = process.cwd();
export const CONTENT = path.join(ROOT, 'content');
export const DIST = path.join(ROOT, 'dist');

export const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    entry.isDirectory() ? files.push(...walk(p)) : files.push(p);
  }
  return files;
};

export const ensure = (dir) => fs.mkdirSync(dir, { recursive: true });
export const read = (file) => fs.readFileSync(file, 'utf8');
export const json = (file, fallback = {}) => { try { return JSON.parse(read(file)); } catch { return fallback; } };

export const slug = (value) => String(value)
  .replace(/\.(zip|md)$/i, '')
  .normalize('NFKD')
  .replace(/[^\w\s-]/g, '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-') || 'item';

export const title = (value) => slug(value).replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export const parseFrontMatter = (text) => {
  const match = String(text).match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { meta: {}, body: String(text) };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const index = line.indexOf(':');
    if (index < 1) continue;
    meta[line.slice(0,index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g,'');
  }
  return { meta, body: String(text).slice(match[0].length) };
};

export const markdownToHtml = (markdown) => {
  const escaped = esc(markdown).replace(/\r\n/g,'\n');
  const fence = String.fromCharCode(96).repeat(3);
  return escaped.split(/\n\s*\n/).map((block) => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith(fence)) {
      const code = block.slice(fence.length).replace(/^\w*\n?/,'').replace(new RegExp(fence + '$'),'');
      return '<pre class="md-code"><code>' + code + '</code></pre>';
    }
    if (/^### /.test(block)) return '<h3>' + block.slice(4) + '</h3>';
    if (/^## /.test(block)) return '<h2>' + block.slice(3) + '</h2>';
    if (/^# /.test(block)) return '<h1>' + block.slice(2) + '</h1>';
    if (/^- /.test(block)) return '<ul>' + block.split('\n').filter(Boolean).map((x) => '<li>' + x.replace(/^-\s+/,'') + '</li>').join('') + '</ul>';
    const inline = block
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(new RegExp(String.fromCharCode(96) + '(.+?)' + String.fromCharCode(96),'g'),'<code>$1</code>');
    return '<p>' + inline.replace(/\n/g,'<br>') + '</p>';
  }).join('');
};

export const zip = (dir) => {
  const files = walk(dir);
  const parts = [];
  const central = [];
  let offset = 0;
  const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
  const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
  const crc32 = (buffer) => {
    let c = ~0;
    for (const byte of buffer) {
      c ^= byte;
      for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
    }
    return (~c) >>> 0;
  };
  for (const file of files) {
    const name = Buffer.from(path.relative(dir,file).replaceAll(path.sep,'/'));
    const data = fs.readFileSync(file);
    const crc = crc32(data);
    const local = Buffer.concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
    parts.push(local);
    central.push(Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));
    offset += local.length;
  }
  const directory = Buffer.concat(central);
  return Buffer.concat([...parts,directory,u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(directory.length),u32(offset),u16(0)]);
};

export const encrypt = (buffer,password) => {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12), iterations = 210000;
  const key = crypto.pbkdf2Sync(password,salt,iterations,32,'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm',key,iv);
  const body = Buffer.concat([cipher.update(buffer),cipher.final()]);
  const tag = cipher.getAuthTag();
  const header = Buffer.from(JSON.stringify({v:1,iter:iterations,salt:salt.toString('base64'),iv:iv.toString('base64')}));
  const length = Buffer.alloc(4); length.writeUInt32LE(header.length);
  return Buffer.concat([length,header,body,tag]);
};

export const extractZip = (buffer,outputDir) => {
  const b = Buffer.from(buffer);
  let end = b.length - 22;
  while (end >= 0 && b.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw Error('Bad ZIP end record.');
  const count = b.readUInt16LE(end + 10), centralOffset = b.readUInt32LE(end + 16);
  let position = centralOffset;
  for (let i = 0; i < count; i++) {
    if (b.readUInt32LE(position) !== 0x02014b50) throw Error('Bad ZIP central directory.');
    const method = b.readUInt16LE(position + 10);
    const compressedSize = b.readUInt32LE(position + 20);
    const nameLength = b.readUInt16LE(position + 28);
    const extraLength = b.readUInt16LE(position + 30);
    const commentLength = b.readUInt16LE(position + 32);
    const localOffset = b.readUInt32LE(position + 42);
    const name = b.toString('utf8',position + 46,position + 46 + nameLength).replaceAll('\\','/');
    position += 46 + nameLength + extraLength + commentLength;
    if (!name || name.endsWith('/')) continue;
    const safe = path.posix.normalize(name);
    if (safe.startsWith('../') || safe === '..' || safe.startsWith('/')) throw Error('Unsafe ZIP path.');
    if (b.readUInt32LE(localOffset) !== 0x04034b50) throw Error('Bad ZIP local header.');
    const localNameLength = b.readUInt16LE(localOffset + 26), localExtraLength = b.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const data = b.subarray(start,start + compressedSize);
    const output = method === 0 ? data : method === 8 ? zlib.inflateRawSync(data) : null;
    if (!output) throw Error('Unsupported ZIP compression.');
    const destination = path.join(outputDir,safe);
    ensure(path.dirname(destination));
    fs.writeFileSync(destination,output);
  }
};
