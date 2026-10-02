#!/usr/bin/env node
/**
 * Write android/keystore.properties and decode the release keystore for CI/local release builds.
 * Required env: ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD,
 *               ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
 */
import fs from 'node:fs';
import path from 'node:path';

const required = [
  'ANDROID_KEYSTORE_BASE64',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD',
];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const androidDir = path.join(process.cwd(), 'android');
const keystoreRelative = 'app/release.keystore';
const keystorePath = path.join(androidDir, keystoreRelative);

fs.mkdirSync(path.dirname(keystorePath), { recursive: true });
fs.writeFileSync(
  keystorePath,
  Buffer.from(process.env.ANDROID_KEYSTORE_BASE64, 'base64'),
);

const properties = [
  `storeFile=${keystoreRelative}`,
  `storePassword=${process.env.ANDROID_KEYSTORE_PASSWORD}`,
  `keyAlias=${process.env.ANDROID_KEY_ALIAS}`,
  `keyPassword=${process.env.ANDROID_KEY_PASSWORD}`,
  '',
].join('\n');

fs.writeFileSync(path.join(androidDir, 'keystore.properties'), properties);
console.log('Prepared android release keystore and keystore.properties');
