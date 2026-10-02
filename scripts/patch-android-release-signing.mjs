#!/usr/bin/env node
/**
 * Idempotently patch Expo prebuild android/app/build.gradle for release keystore signing.
 */
import fs from 'node:fs';
import path from 'node:path';

const buildGradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');

if (!fs.existsSync(buildGradlePath)) {
  console.error('android/app/build.gradle not found. Run `npx expo prebuild --platform android` first.');
  process.exit(1);
}

let contents = fs.readFileSync(buildGradlePath, 'utf8');

if (contents.includes('keystore.properties')) {
  console.log('Android release signing already configured');
  process.exit(0);
}

const keystoreBlock = `
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("keystore.properties")
def hasReleaseKeystore = keystorePropertiesFile.exists()

if (hasReleaseKeystore) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
`;

contents = contents.replace(
  'apply plugin: "com.facebook.react"\n',
  `apply plugin: "com.facebook.react"\n${keystoreBlock}`,
);

const debugSigningBlock = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const releaseSigningBlock = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (hasReleaseKeystore) {
                storeFile rootProject.file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }`;

if (!contents.includes(debugSigningBlock)) {
  console.error('Could not find default debug signingConfigs block to patch.');
  process.exit(1);
}

contents = contents.replace(debugSigningBlock, releaseSigningBlock);

const releaseDebugSigning = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

const releaseKeystoreSigning = `        release {
            signingConfig hasReleaseKeystore ? signingConfigs.release : signingConfigs.debug`;

if (!contents.includes(releaseDebugSigning)) {
  console.error('Could not find default release buildType signingConfig to patch.');
  process.exit(1);
}

contents = contents.replace(releaseDebugSigning, releaseKeystoreSigning);

fs.writeFileSync(buildGradlePath, contents);
console.log('Patched android/app/build.gradle for release signing');
