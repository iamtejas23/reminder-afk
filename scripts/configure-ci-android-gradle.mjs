#!/usr/bin/env node
/**
 * Tune Expo prebuild android/ for GitHub Actions: SDK path, memory, single arch, faster release.
 */
import fs from 'node:fs';
import path from 'node:path';

const androidDir = path.join(process.cwd(), 'android');
const gradlePropsPath = path.join(androidDir, 'gradle.properties');
const localPropsPath = path.join(androidDir, 'local.properties');

if (!fs.existsSync(gradlePropsPath)) {
  console.error('android/gradle.properties not found. Run expo prebuild first.');
  process.exit(1);
}

const sdkDir = process.env.ANDROID_HOME || '/usr/local/lib/android/sdk';
fs.writeFileSync(localPropsPath, `sdk.dir=${sdkDir.replace(/\\/g, '/')}\n`);
console.log(`Wrote local.properties (sdk.dir=${sdkDir})`);

const overrides = {
  'org.gradle.jvmargs':
    '-Xmx6144m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
  'org.gradle.parallel': 'true',
  'org.gradle.caching': 'true',
  'org.gradle.daemon': 'false',
  'org.gradle.configureondemand': 'true',
  reactNativeArchitectures: 'arm64-v8a',
  // R8 + resource shrink on a cold CI runner often exceeds 30+ minutes or OOMs at 2GB heap.
  'android.enableMinifyInReleaseBuilds': 'false',
  'android.enableShrinkResourcesInReleaseBuilds': 'false',
};

let props = fs.readFileSync(gradlePropsPath, 'utf8');

for (const [key, value] of Object.entries(overrides)) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=.*$`, 'm');
  props = pattern.test(props) ? props.replace(pattern, line) : `${props.trimEnd()}\n${line}\n`;
}

fs.writeFileSync(gradlePropsPath, props);
console.log('Updated android/gradle.properties for CI release build');
