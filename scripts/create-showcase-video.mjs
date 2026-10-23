import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const font = process.env.SHOWCASE_FONT || (process.platform === 'win32'
  ? 'C:/Windows/Fonts/arial.ttf'
  : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
const scenes = [
  ['home', '01  DISCOVER', 'Search local deals by category and location'],
  ['deals', '02  BROWSE', 'List-first discovery with category and offer filters'],
  ['deal-detail', '03  DEAL DETAILS', 'Offer information and coupon actions'],
  ['storefront', '04  STOREFRONT', 'One shareable shop page with identity and contact channels'],
  ['dashboard', '05  MERCHANT WORKSPACE', 'Overview and shop readiness using current sample data'],
  ['deal-editor', '06  DEAL MANAGEMENT', 'Existing deal form and preview - no changes saved'],
  ['analytics', '07  ANALYTICS', 'Current sample data is empty - no fabricated metrics'],
  ['admin', '08  MODERATION', 'Read-only public demo - no fabricated reports'],
];
const source = resolve('docs/showcase');
if (!existsSync(font)) throw new Error('Set SHOWCASE_FONT to an installed TrueType font.');
for (const [name] of scenes) {
  if (!existsSync(join(source, `${name}.jpg`))) throw new Error(`Missing screenshot: ${name}`);
}
const temporary = mkdtempSync(join(tmpdir(), 'dealdoor-showcase-'));
const escapeFilter = (value) => value.replaceAll('\\', '/').replaceAll(':', '\\:').replaceAll("'", "\\'");
function run(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`FFmpeg failed with exit code ${result.status}`);
}
try {
  for (const [index, [name, title, subtitle]] of scenes.entries()) {
    const filter = [
      'scale=1280:720:force_original_aspect_ratio=decrease',
      'pad=1280:800:(ow-iw)/2:0:color=0x10121b',
      `drawtext=fontfile='${escapeFilter(font)}':text='${title}':fontcolor=white:fontsize=22:x=28:y=733`,
      `drawtext=fontfile='${escapeFilter(font)}':text='${subtitle}':fontcolor=0xcbd5e1:fontsize=17:x=28:y=765`,
    ].join(',');
    run(['-loop', '1', '-framerate', '15', '-i', join(source, `${name}.jpg`), '-t', '9',
      '-vf', filter, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '25',
      '-pix_fmt', 'yuv420p', join(temporary, `${index}.mp4`)]);
  }
  writeFileSync(join(temporary, 'segments.txt'), scenes.map((_, index) => `file '${index}.mp4'`).join('\n'));
  run(['-f', 'concat', '-safe', '0', '-i', join(temporary, 'segments.txt'), '-c', 'copy',
    '-movflags', '+faststart', join(source, 'walkthrough.mp4')]);
  console.log('Created docs/showcase/walkthrough.mp4 (72 seconds, silent screenshot walkthrough).');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
