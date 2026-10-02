# reminder-afk

`reminder-afk` is an Expo React Native app for running AFK break timers with:

- A default 30 minute timer with custom durations from 5 to 120 minutes
- Preset buttons for 15, 25, 30, and 45 minutes
- Start, pause, reset, large countdown, progress bar, and live status copy
- Smart reminders at about 82.5%, 95%, and 100%
- Local notifications for background-safe reminders
- Expo Speech voice prompts with a slightly slower, lower-pitch robotic feel
- AsyncStorage persistence for the last duration, reminder settings, and completed session count

## Install

```bash
npm install
```

## CI and GitHub Releases (Android APK)

Two workflows live under `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push / PR to `main` | Fast ESLint check |
| `release-apk.yml` | Manual **Actions → Release APK** | Bump version, build optimized arm64 APK, publish [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) |

### One-time GitHub secrets (optional for testing)

If these are **not** set, **Release APK** still runs and publishes an APK signed with the **debug keystore** (fine for sideloading on your own phone). For production / Play Store, add all four in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64 of your `.keystore` / `.jks` file (`base64 -w0 my-release-key.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

### Release flow

1. Open **Actions → Release APK → Run workflow**.
2. Choose `patch`, `minor`, or `major` (default: `patch`).
3. The workflow bumps `package.json` / `app.json`, increments `android.versionCode`, builds a **single-arch arm64** release APK (CI skips R8 minify for speed/reliability; local `android:release:ci` still uses minify from `app.json`), then uploads the APK and SHA256 checksum to a new GitHub Release tagged `vX.Y.Z`.

Local release build (after creating `android/` via prebuild and setting signing env vars):

```bash
export ANDROID_KEYSTORE_BASE64=...
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEY_ALIAS=...
export ANDROID_KEY_PASSWORD=...
npm run android:release:ci
```

## Run

```bash
npx expo start
```

Useful shortcuts:

- `a` opens Android
- `i` opens iOS
- `w` opens web

## Recommended testing flow

1. Open the app on a physical Android or iPhone device when possible.
2. Tap `Start` and allow notification permission when prompted.
3. Minimize the app to confirm the scheduled reminders still arrive in the background.
4. Reopen the app and verify the countdown restores correctly.

## Notes

- The app uses `expo-notifications` local notifications, so background reminders do not require a server.
- Expo documents that local notifications remain available in Expo Go, while Android push notifications require a development build.
- On iOS, Expo Speech will not produce audio if the device is in silent mode.
- The speech messages are exactly:
  - `Hey, your break is almost over`
  - `One minute left. Get ready`
  - `AFK complete. Back to work!`

## Project structure

```text
app/
  _layout.tsx
  index.tsx
components/afk/
  preset-button.tsx
  progress-bar.tsx
  setting-switch.tsx
constants/
  afk.ts
hooks/
  use-afk-timer.ts
lib/
  afk-notifications.ts
  afk-speech.ts
  afk-storage.ts
types/
  afk.ts
```
