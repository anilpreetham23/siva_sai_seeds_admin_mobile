/**
 * copy-apk.js
 * Automatically copies the built APK to C:\Users\<user>\Downloads
 * with a clean timestamped name.
 *
 * Usage (called by npm scripts):
 *   node scripts/copy-apk.js release
 *   node scripts/copy-apk.js debug
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const buildType = process.argv[2] || 'release';

// Source APK paths
const APK_PATHS = {
  release: path.join('android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
  debug:   path.join('android', 'app', 'build', 'outputs', 'apk', 'debug',   'app-debug.apk'),
};

const src = APK_PATHS[buildType];
if (!fs.existsSync(src)) {
  console.error(`❌  APK not found: ${src}`);
  process.exit(1);
}

// Destination: release/SivaSaiSeeds-AdminManager-<type>.apk and ~/Downloads/SivaSaiSeeds-AdminManager-<type>-<stamp>.apk
const now     = new Date();
const stamp   = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
const apkName = `SivaSaiSeeds-AdminManager-${buildType}-${stamp}.apk`;
const repoApkName = `SivaSaiSeeds-AdminManager-${buildType}.apk`;

const downloadsDest = path.join(os.homedir(), 'Downloads', apkName);

const releaseDir = path.join(process.cwd(), 'release');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}
const repoDest = path.join(releaseDir, repoApkName);

fs.copyFileSync(src, downloadsDest);
fs.copyFileSync(src, repoDest);

const sizeMB = (fs.statSync(repoDest).size / 1024 / 1024).toFixed(2);
console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║        ✅  ADMIN & MANAGER APK READY             ║');
console.log('╠══════════════════════════════════════════════════╣');
console.log(`║  📁 ${repoApkName.padEnd(44)} ║`);
console.log(`║  📦 Size : ${sizeMB} MB`.padEnd(51) + '║');
console.log(`║  📍 Repo : ./release/`.padEnd(51) + '║');
console.log(`║  📍 User : ~/Downloads/`.padEnd(51) + '║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');
console.log('  Transfer to phone → install → done!');
console.log('');
