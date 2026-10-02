# Expo React Native — Android Release APK Build Guide

> **Goal:** Build a clean, small, signed APK you can install directly on any Android device.

---

## The Magic Command (Save This)

```bash
cd android && ./gradlew app:clean app:assembleRelease \
  -PreactNativeArchitectures=arm64-v8a \
  -Pandroid.enableMinifyInReleaseBuilds=true \
  -Pandroid.enableShrinkResourcesInReleaseBuilds=true \
  -Pexpo.useLegacyPackaging=true
```

That's it. The rest of this guide explains what each part does and how to set things up once.

---

## What Each Flag Does (Plain English)

| Flag | What it does |
|------|-------------|
| `app:clean` | Deletes old build files before starting fresh. Always do this for release builds. |
| `-PreactNativeArchitectures=arm64-v8a` | Builds for 64-bit ARM only (covers 95%+ of modern phones). **This is the biggest size reduction.** |
| `-Pandroid.enableMinifyInReleaseBuilds=true` | Removes unused code and shrinks class names (ProGuard/R8). |
| `-Pandroid.enableShrinkResourcesInReleaseBuilds=true` | Removes unused images, layouts, strings from the APK. |
| `-Pexpo.useLegacyPackaging=true` | Packs the JS bundle directly inside the APK so it works for direct installs. |

---

## One-Time Setup

### 1. Create a Signing Keystore

You only do this **once ever**. Keep this file safe — if you lose it, you can't update your app on Play Store.

```bash
keytool -genkey -v \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

It will ask you questions (name, org, etc.) — fill them in or just press Enter for each one.

> ⚠️ **Never commit this file to Git.** Add `*.keystore` to your `.gitignore`.

---

### 2. Tell Gradle About Your Keystore

Add these lines to `android/gradle.properties`:

```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_password_here
MYAPP_RELEASE_KEY_PASSWORD=your_password_here
```

---

### 3. Connect Keystore in build.gradle

In `android/app/build.gradle`, find the `android { }` block and add/update:

```groovy
android {
    signingConfigs {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

### 4. Add npm Scripts to package.json

Add these to the `"scripts"` section of your `package.json` so you don't have to type the long command every time:

```json
"scripts": {
  "android:release:apk": "cd android && ./gradlew app:clean app:assembleRelease -PreactNativeArchitectures=arm64-v8a -Pandroid.enableMinifyInReleaseBuilds=true -Pandroid.enableShrinkResourcesInReleaseBuilds=true -Pexpo.useLegacyPackaging=true",
  "android:release:aab": "cd android && ./gradlew app:clean app:bundleRelease -PreactNativeArchitectures=arm64-v8a -Pandroid.enableMinifyInReleaseBuilds=true -Pandroid.enableShrinkResourcesInReleaseBuilds=true -Pexpo.useLegacyPackaging=true"
}
```

---

## Building the APK

From your **project root** (not the android folder), run:

```bash
npm run android:release:apk
```

The build takes a few minutes. When it finishes, your APK is at:

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## After the Build — Verify Everything

Run these 4 commands to make sure your build is good.

### 1. Check file size
```bash
ls -lh android/app/build/outputs/apk/release/app-release.apk
```
A well-optimized Expo app should be **15–50 MB**. If it's over 80 MB, the architecture flag probably didn't apply.

---

### 2. Record the SHA256 checksum
```bash
sha256sum android/app/build/outputs/apk/release/app-release.apk
```
Save this hash somewhere. It lets you confirm the file hasn't changed or been tampered with.

---

### 3. Verify the APK is correctly signed
```bash
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
```
If it prints certificate info with no errors → signed correctly. ✅

---

### 4. Confirm only arm64-v8a is inside
```bash
zipinfo -1 android/app/build/outputs/apk/release/app-release.apk \
  | grep '^lib/.*.so$' \
  | awk -F/ '{print $2}' \
  | sort | uniq -c
```

Expected output (only one line):
```
   12 arm64-v8a
```

If you see `armeabi-v7a` or `x86` listed too, the flag didn't apply — rebuild.

---

## Complete Copy-Paste Workflow

Build + verify everything in one go:

```bash
# Build
npm run android:release:apk

# Check size
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Checksum
sha256sum android/app/build/outputs/apk/release/app-release.apk

# Verify signature
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk

# Confirm architecture
zipinfo -1 android/app/build/outputs/apk/release/app-release.apk \
  | grep '^lib/.*.so$' \
  | awk -F/ '{print $2}' \
  | sort | uniq -c
```

---

## Building for Google Play Store (AAB)

Play Store wants an AAB file, not an APK. Same flags, different task:

```bash
npm run android:release:aab
```

Output file:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Build and checksum both at once:
```bash
npm run android:release:apk && npm run android:release:aab

sha256sum \
  android/app/build/outputs/apk/release/app-release.apk \
  android/app/build/outputs/bundle/release/app-release.aab
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `SDK location not found` | Set `ANDROID_HOME` env var, or create `android/local.properties` with `sdk.dir=/path/to/your/sdk` |
| `Keystore file not found` | Check the path in `gradle.properties` — it's relative to `android/app/` |
| APK is too large (80 MB+) | The architecture flag wasn't applied. Double-check the `-PreactNativeArchitectures=arm64-v8a` flag. |
| Multiple architectures in APK | Same as above — flag was ignored. Run with `--info` to debug Gradle. |
| `apksigner` says DOES NOT VERIFY | Wrong password or keystore mismatch. Recheck `gradle.properties`. |
| Metro bundler errors | Run `npx expo prebuild` first, then retry. |
| Gradle runs out of memory | Add `org.gradle.jvmargs=-Xmx4g` to `android/gradle.properties` |
| Build fails with weird errors | Delete build folder manually: `rm -rf android/app/build/` then retry |

---

## Quick Reference

| What | Command |
|------|---------|
| Build APK | `npm run android:release:apk` |
| Build AAB (Play Store) | `npm run android:release:aab` |
| APK location | `android/app/build/outputs/apk/release/app-release.apk` |
| AAB location | `android/app/build/outputs/bundle/release/app-release.aab` |
| Check size | `ls -lh ...app-release.apk` |
| Get checksum | `sha256sum ...app-release.apk` |
| Verify signature | `apksigner verify --print-certs ...app-release.apk` |
| Manual clean | `rm -rf android/app/build/` |
| Create keystore | `keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000` |