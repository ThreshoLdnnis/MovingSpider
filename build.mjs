import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.dirname(fileURLToPath(import.meta.url));
const embed = (name, mime) => {
  const filename = path.join(root, 'assets', name);
  if (!fs.existsSync(filename)) throw new Error(`Missing embedded asset: ${filename}`);
  return `data:${mime};base64,${fs.readFileSync(filename).toString('base64')}`;
};
const collection = JSON.parse(fs.readFileSync(path.join(root, 'assets/collection.json'), 'utf8'));
const escapeAttribute = value => String(value).replace(/[&"<>]/g, c => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
const collectionHTML = collection.map(item => {
  const css = `--x:${item.x}%;--y:${item.y}%;--w:${item.width};--tilt:${item.tilt}deg;--mx:${item.mobileX}%;--my:${item.mobileY}%;--mw:${item.mobileWidth}`;
  return `<img class="object collection-item" id="object-${escapeAttribute(item.id)}" data-web-anchor data-added data-tilt="${item.tilt}" data-archive-name="${escapeAttribute(item.name)}" data-keywords="${escapeAttribute(item.keywords)}" style="${css}" src="${embed('cutouts/' + item.file, 'image/webp')}" alt="${escapeAttribute(item.name)}" draggable="false">`;
}).join('\n      ');
const values = {
  BACKGROUND_BLUE: embed('backgrounds/blue.webp', 'image/webp'),
  BACKGROUND_ROSE: embed('backgrounds/rose.webp', 'image/webp'),
  BACKGROUND_SILVER: embed('backgrounds/silver.webp', 'image/webp'),
  INTER: embed('inter-latin.woff2', 'font/woff2'),
  MUG: embed('mug.webp', 'image/webp'),
  BOOK: embed('book.webp', 'image/webp'),
  SPIDER: embed('spider.webp', 'image/webp'),
  IDLE: embed('idle-head.webp', 'image/webp'),
  FLY: embed('fly.webp', 'image/webp'),
  COLLECTION: collectionHTML,
  THEME_JS: fs.readFileSync(path.join(root, 'src/theme.js'), 'utf8'),
  UI_JS: fs.readFileSync(path.join(root, 'src/ui.js'), 'utf8'),
  SILK_JS: fs.readFileSync(path.join(root, 'src/silk.js'), 'utf8'),
  SPIDER_JS: fs.readFileSync(path.join(root, 'src/spider.js'), 'utf8')
};
const template = fs.readFileSync(path.join(root, 'src/page.html'), 'utf8');
for (const key of ['THEME_JS', 'UI_JS', 'SILK_JS', 'SPIDER_JS']) new vm.Script(values[key], {filename:key});
const render = defaultTheme => template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
  if(key === 'DEFAULT_THEME') return defaultTheme;
  if (!(key in values)) throw new Error(`Unresolved template token ${key}`);
  return values[key];
});
const html = render('blue');
if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('Unresolved template');
if ((html.match(/<canvas\b/g) || []).length !== 1) throw new Error('Expected one visible canvas');
if (/<(?:script|img)[^>]+src=["']https?:/i.test(html)) throw new Error('Unexpected external script/image');
if ((html.match(/data:image\/webp;base64,/g)||[]).length !== 8 + collection.length) throw new Error('Missing embedded photograph/background');
fs.writeFileSync(path.join(root, 'index.html'), html);
fs.mkdirSync(path.join(root, 'previews'), {recursive:true});
for(const theme of ['silver','rose','blue'])fs.writeFileSync(path.join(root,'previews',theme+'.html'),render(theme));
console.log(`Built found/index.html — ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MB, all visual assets embedded.`);
console.log('Built standalone previews: previews/silver.html, previews/rose.html, previews/blue.html');
