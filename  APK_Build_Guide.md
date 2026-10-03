# Android Release APK Build Guide

This repository uses Expo prebuild and Gradle to create an installable Android APK. Run commands from the project root.

## Requirements

- Node.js and npm (use the Node version configured by CI, currently Node 22)
- Java 17
- Android SDK with Android 36, build tools 36.0.0, and NDK 27.1.12297006

## Build locally

Install dependencies and generate the native Android project:

```bash
npm ci
npm run android:prebuild
```

Build a release APK:

```bash
npm run android:release:apk
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`. This command builds arm64 only and packages the JavaScript bundle in the APK.

`npm run android:release:ci` runs prebuild, configures signing, and builds the APK in one command. It uses the debug keystore if no release credentials are configured; that APK is suitable for local sideloading, not Play Store publication.

## Configure release signing

Create a keystore once and keep it backed up securely:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Set these environment variables before running `npm run android:release:ci`:

```bash
export ANDROID_KEYSTORE_BASE64="$(base64 -w0 my-release-key.keystore)"
export ANDROID_KEYSTORE_PASSWORD="your-keystore-password"
export ANDROID_KEY_ALIAS="my-key-alias"
export ANDROID_KEY_PASSWORD="your-key-password"
npm run android:release:ci
```

On macOS, use `base64 < my-release-key.keystore | tr -d '\n'` to produce the base64 value. Never commit the keystore or credentials. The release script writes generated signing files under the ignored `android/` directory.

The GitHub Actions release workflow supports the same four values as repository secrets. If all are absent, it intentionally publishes a debug-signed APK for testing.

## Verify the APK

```bash
ls -lh android/app/build/outputs/apk/release/app-release.apk
sha256sum android/app/build/outputs/apk/release/app-release.apk
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
```

The workflow creates the APK and checksum, then attaches both to a GitHub Release. Start it from **Actions → Release APK → Run workflow**.
