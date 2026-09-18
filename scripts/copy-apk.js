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

// Destination: ~/Downloads/SivaSaiSeeds-<type>-<YYYYMMDD-HHmm>.apk
const now     = new Date();
const stamp   = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
const apkName = `SivaSaiSeeds-${buildType}-${stamp}.apk`;
const dest    = path.join(os.homedir(), 'Downloads', apkName);

fs.copyFileSync(src, dest);

const sizeMB = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║         ✅  APK READY IN YOUR DOWNLOADS          ║');
console.log('╠══════════════════════════════════════════════════╣');
console.log(`║  📁 ${apkName.padEnd(44)} ║`);
console.log(`║  📦 Size : ${sizeMB} MB`.padEnd(51) + '║');
console.log(`║  📍 Path : ~/Downloads/`.padEnd(51) + '║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');
console.log('  Transfer to phone → install → done!');
console.log('');
