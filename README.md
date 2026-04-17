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
