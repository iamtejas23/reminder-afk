#!/usr/bin/env node
/**
 * Bump semver in package.json and app.json; increment Android versionCode.
 * Usage: node scripts/bump-version.mjs [patch|minor|major]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const bumpType = (process.argv[2] || 'patch').toLowerCase();
if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error(`Invalid bump type: ${bumpType}`);
  process.exit(1);
}

const pkgPath = path.join(root, 'package.json');
const appPath = path.join(root, 'app.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function bumpVersion(version, type) {
  const parts = parseVersion(version);
  if (type === 'major') {
    parts.major += 1;
    parts.minor = 0;
    parts.patch = 0;
  } else if (type === 'minor') {
    parts.minor += 1;
    parts.patch = 0;
  } else {
    parts.patch += 1;
  }
  return `${parts.major}.${parts.minor}.${parts.patch}`;
}

const currentVersion = pkg.version;
const nextVersion = bumpVersion(currentVersion, bumpType);

pkg.version = nextVersion;
app.expo.version = nextVersion;

app.expo.android = app.expo.android ?? {};
const previousCode = Number(app.expo.android.versionCode ?? 0);
app.expo.android.versionCode = previousCode + 1;

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
fs.writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);

console.log(nextVersion);
console.error(
  `Bumped ${currentVersion} → ${nextVersion} (versionCode ${app.expo.android.versionCode})`,
);
