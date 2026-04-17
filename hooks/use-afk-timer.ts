import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  COUNTDOWN_TICK_MS,
  DEFAULT_DURATION_MINUTES,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  MS_PER_MINUTE,
  REMINDER_SOURCE,
  REMINDER_STAGES,
} from '@/constants/afk';
import {
  cancelReminderNotifications,
  getReminderNotificationData,
  requestAfkNotificationPermissionsAsync,
  scheduleReminderNotifications,
} from '@/lib/afk-notifications';
import { speakReminder, stopReminderSpeech } from '@/lib/afk-speech';
import {
  clearAfkSession,
  loadAfkPreferences,
  loadAfkSession,
  saveAfkPreferences,
  saveAfkSession,
} from '@/lib/afk-storage';
import type {
  AfkSession,
  AfkTimerState,
  AfkTimerStatus,
  ReminderStageKey,
} from '@/types/afk';

const DEFAULT_STATE: AfkTimerState = {
  durationMinutes: DEFAULT_DURATION_MINUTES,
  elapsedBeforePauseMs: 0,
  errorMessage: null,
  isReady: false,
  permissionState: Platform.OS === 'web' ? 'unsupported' : 'unknown',
  scheduledNotificationIds: [],
  sessionCount: 0,
  sessionId: null,
  startedAt: null,
  status: 'idle',
  vibrationEnabled: true,
  voiceEnabled: true,
};

function clampDurationMinutes(durationMinutes: number) {
  return Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, Math.round(durationMinutes)));
}

function calculateElapsedMs(
  status: AfkTimerStatus,
  elapsedBeforePauseMs: number,
  startedAt: number | null,
  now: number,
  durationMinutes: number
) {
  const totalDurationMs = durationMinutes * MS_PER_MINUTE;

  if (status === 'complete') {
    return totalDurationMs;
  }

  if (status === 'running' && startedAt) {
    return Math.min(totalDurationMs, elapsedBeforePauseMs + Math.max(0, now - startedAt));
  }

  return Math.min(totalDurationMs, elapsedBeforePauseMs);
}

function createSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatClock(ms: number) {
  const clampedSeconds = Math.max(0, Math.ceil(ms / 1_000));
  const totalMinutes = Math.floor(clampedSeconds / 60);
  const seconds = clampedSeconds % 60;

  return `${String(totalMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDurationSummary(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  return `${seconds}s`;
}

function getStatusLabel(status: AfkTimerStatus) {
  switch (status) {
    case 'running':
      return 'Running';
    case 'paused':
      return 'Paused';
    case 'complete':
      return 'Complete';
    default:
      return 'Idle';
  }
}

function getTriggeredReminderStageKeys(durationMinutes: number, elapsedMs: number) {
  const totalDurationMs = durationMinutes * MS_PER_MINUTE;

  return new Set<ReminderStageKey>(
    REMINDER_STAGES.filter((stage) => totalDurationMs * stage.progress <= elapsedMs).map(
      (stage) => stage.key
    )
  );
}

export function useAfkTimer() {
  const [state, setState] = useState<AfkTimerState>(DEFAULT_STATE);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const stateRef = useRef(state);
  const appStateRef = useRef(AppState.currentState);
  const completeSessionRef = useRef<() => Promise<void>>(async () => undefined);
  const triggeredReminderStageKeysRef = useRef<Set<ReminderStageKey>>(new Set());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const totalDurationMs = state.durationMinutes * MS_PER_MINUTE;
  const elapsedMs = calculateElapsedMs(
    state.status,
    state.elapsedBeforePauseMs,
    state.startedAt,
    nowMs,
    state.durationMinutes
  );
  const remainingMs = Math.max(0, totalDurationMs - elapsedMs);
  const progress = totalDurationMs === 0 ? 0 : elapsedMs / totalDurationMs;
  const progressPercent = Math.round(progress * 100);
  const nextReminder = REMINDER_STAGES.find(
    (stage) => stage.progress < 1 && totalDurationMs * stage.progress > elapsedMs
  );

  completeSessionRef.current = async () => {
    triggeredReminderStageKeysRef.current = getTriggeredReminderStageKeys(
      stateRef.current.durationMinutes,
      stateRef.current.durationMinutes * MS_PER_MINUTE
    );
    setNowMs(Date.now());
    setState((currentState) => {
      if (currentState.status === 'complete' || currentState.sessionId === null) {
        return currentState;
      }

      return {
        ...currentState,
        status: 'complete',
        startedAt: null,
        elapsedBeforePauseMs: currentState.durationMinutes * MS_PER_MINUTE,
        scheduledNotificationIds: [],
        sessionCount: currentState.sessionCount + 1,
        errorMessage: null,
      };
    });
  };

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const [preferences, savedSession] = await Promise.all([loadAfkPreferences(), loadAfkSession()]);
      if (!isMounted) {
        return;
      }

      const now = Date.now();
      const restoredDurationMinutes = savedSession?.durationMinutes ?? preferences.durationMinutes;
      const restoredElapsedMs = savedSession
        ? calculateElapsedMs(
            savedSession.status,
            savedSession.elapsedBeforePauseMs,
            savedSession.startedAt,
            now,
            restoredDurationMinutes
          )
        : 0;
      const sessionExpired =
        savedSession?.status === 'running' &&
        restoredElapsedMs >= restoredDurationMinutes * MS_PER_MINUTE;

      const nextState: AfkTimerState = {
        ...DEFAULT_STATE,
        ...preferences,
        durationMinutes: restoredDurationMinutes,
        isReady: true,
      };

      if (savedSession) {
        nextState.status = sessionExpired ? 'complete' : savedSession.status;
        nextState.elapsedBeforePauseMs = sessionExpired
          ? restoredDurationMinutes * MS_PER_MINUTE
          : savedSession.elapsedBeforePauseMs;
        nextState.startedAt = sessionExpired || savedSession.status !== 'running' ? null : savedSession.startedAt;
        nextState.sessionId = savedSession.sessionId;
        nextState.scheduledNotificationIds = sessionExpired ? [] : savedSession.scheduledNotificationIds;
      }

      if (sessionExpired) {
        nextState.sessionCount = preferences.sessionCount + 1;
      }

      triggeredReminderStageKeysRef.current = savedSession
        ? getTriggeredReminderStageKeys(
            restoredDurationMinutes,
            sessionExpired ? restoredDurationMinutes * MS_PER_MINUTE : restoredElapsedMs
          )
        : new Set();
      setNowMs(now);
      setState(nextState);

      if (sessionExpired && savedSession) {
        await Promise.all([
          saveAfkPreferences({
            ...preferences,
            durationMinutes: restoredDurationMinutes,
            sessionCount: preferences.sessionCount + 1,
          }),
          saveAfkSession({
            ...savedSession,
            durationMinutes: restoredDurationMinutes,
            elapsedBeforePauseMs: restoredDurationMinutes * MS_PER_MINUTE,
            startedAt: null,
            scheduledNotificationIds: [],
            status: 'complete',
          }),
        ]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isReady) {
      return;
    }

    void saveAfkPreferences({
      durationMinutes: state.durationMinutes,
      sessionCount: state.sessionCount,
      voiceEnabled: state.voiceEnabled,
      vibrationEnabled: state.vibrationEnabled,
    });
  }, [
    state.durationMinutes,
    state.isReady,
    state.sessionCount,
    state.vibrationEnabled,
    state.voiceEnabled,
  ]);

  useEffect(() => {
    if (!state.isReady) {
      return;
    }

    if (state.status === 'idle' && state.sessionId === null && state.elapsedBeforePauseMs === 0) {
      void clearAfkSession();
      return;
    }

    const session: AfkSession = {
      durationMinutes: state.durationMinutes,
      elapsedBeforePauseMs: state.elapsedBeforePauseMs,
      scheduledNotificationIds: state.scheduledNotificationIds,
      sessionId: state.sessionId,
      startedAt: state.startedAt,
      status: state.status === 'idle' ? 'complete' : state.status,
    };

    void saveAfkSession(session);
  }, [
    state.durationMinutes,
    state.elapsedBeforePauseMs,
    state.isReady,
    state.scheduledNotificationIds,
    state.sessionId,
    state.startedAt,
    state.status,
  ]);

  useEffect(() => {
    if (state.status !== 'running') {
      return;
    }

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, COUNTDOWN_TICK_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [state.status]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;

      if (nextAppState !== 'active') {
        return;
      }

      const currentState = stateRef.current;
      const now = Date.now();
      setNowMs(now);

      if (
        currentState.status === 'running' &&
        calculateElapsedMs(
          currentState.status,
          currentState.elapsedBeforePauseMs,
          currentState.startedAt,
          now,
          currentState.durationMinutes
        ) >= currentState.durationMinutes * MS_PER_MINUTE
      ) {
        void completeSessionRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (state.status !== 'running' || state.sessionId === null || appStateRef.current !== 'active') {
      return;
    }

    const dueStages = REMINDER_STAGES.filter(
      (stage) =>
        totalDurationMs * stage.progress <= elapsedMs &&
        !triggeredReminderStageKeysRef.current.has(stage.key)
    );

    if (dueStages.length === 0) {
      return;
    }

    for (const stage of dueStages) {
      triggeredReminderStageKeysRef.current.add(stage.key);
    }

    const latestDueStage = dueStages[dueStages.length - 1];

    if (state.vibrationEnabled && Platform.OS !== 'web') {
      Vibration.vibrate(220);
    }

    if (state.voiceEnabled) {
      void speakReminder(latestDueStage.message);
    }

    if (latestDueStage.key === 'complete') {
      void completeSessionRef.current();
    }
  }, [
    elapsedMs,
    state.sessionId,
    state.status,
    state.vibrationEnabled,
    state.voiceEnabled,
    totalDurationMs,
  ]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const currentState = stateRef.current;
      const reminderData = getReminderNotificationData(notification);

      if (
        !reminderData ||
        reminderData.source !== REMINDER_SOURCE ||
        reminderData.sessionId !== currentState.sessionId
      ) {
        return;
      }

      triggeredReminderStageKeysRef.current.add(reminderData.stageKey);

      if (reminderData.stageKey === 'complete') {
        void completeSessionRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (state.status === 'running' && remainingMs <= 0) {
      void completeSessionRef.current();
    }
  }, [remainingMs, state.status]);

  function setDurationMinutes(durationMinutes: number) {
    const nextDurationMinutes = clampDurationMinutes(durationMinutes);
    triggeredReminderStageKeysRef.current = new Set();

    setState((currentState) => {
      if (currentState.status === 'running' || currentState.status === 'paused') {
        return currentState;
      }

      return {
        ...currentState,
        durationMinutes: nextDurationMinutes,
        elapsedBeforePauseMs: 0,
        errorMessage: null,
        scheduledNotificationIds: [],
        sessionId: null,
        startedAt: null,
        status: 'idle',
      };
    });
  }

  function nudgeDuration(direction: number) {
    setDurationMinutes(state.durationMinutes + direction);
  }

  async function setVoiceEnabled(nextValue: boolean) {
    if (!nextValue) {
      await stopReminderSpeech();
    }

    setState((currentState) => ({
      ...currentState,
      voiceEnabled: nextValue,
    }));
  }

  async function setVibrationEnabled(nextValue: boolean) {
    const now = Date.now();
    const elapsedBeforeChange = calculateElapsedMs(
      state.status,
      state.elapsedBeforePauseMs,
      state.startedAt,
      now,
      state.durationMinutes
    );
    let nextNotificationIds = state.scheduledNotificationIds;

    if (state.status === 'running' && state.sessionId && state.permissionState === 'granted') {
      await cancelReminderNotifications(state.scheduledNotificationIds);
      nextNotificationIds = await scheduleReminderNotifications({
        durationMinutes: state.durationMinutes,
        elapsedMs: elapsedBeforeChange,
        sessionId: state.sessionId,
        vibrationEnabled: nextValue,
      });
    }

    setNowMs(now);
    setState((currentState) => ({
      ...currentState,
      vibrationEnabled: nextValue,
      scheduledNotificationIds:
        currentState.status === 'running' ? nextNotificationIds : currentState.scheduledNotificationIds,
    }));
  }

  async function start() {
    if (state.status === 'running') {
      return;
    }

    const now = Date.now();
    const resumedSession = state.status === 'paused' && state.sessionId;
    const elapsedBeforeStart = resumedSession ? state.elapsedBeforePauseMs : 0;
    const nextSessionId = resumedSession ? state.sessionId : createSessionId();
    let permissionState = state.permissionState;
    let scheduledNotificationIds: string[] = [];

    try {
      permissionState = await requestAfkNotificationPermissionsAsync();

      if (permissionState === 'granted' && nextSessionId) {
        scheduledNotificationIds = await scheduleReminderNotifications({
          durationMinutes: state.durationMinutes,
          elapsedMs: elapsedBeforeStart,
          sessionId: nextSessionId,
          vibrationEnabled: state.vibrationEnabled,
        });
      }
    } catch {
      permissionState = 'denied';
    }

    triggeredReminderStageKeysRef.current = getTriggeredReminderStageKeys(
      state.durationMinutes,
      elapsedBeforeStart
    );
    setNowMs(now);
    setState((currentState) => ({
      ...currentState,
      elapsedBeforePauseMs: elapsedBeforeStart,
      errorMessage:
        permissionState === 'denied'
          ? 'Notifications are off, so background reminders will stay silent until permission is granted. Voice prompts still work while the app stays open.'
          : null,
      permissionState,
      scheduledNotificationIds,
      sessionId: nextSessionId,
      startedAt: now,
      status: 'running',
    }));
  }

  async function pause() {
    if (state.status !== 'running') {
      return;
    }

    const now = Date.now();
    const elapsedBeforePause = calculateElapsedMs(
      state.status,
      state.elapsedBeforePauseMs,
      state.startedAt,
      now,
      state.durationMinutes
    );

    await Promise.all([
      cancelReminderNotifications(state.scheduledNotificationIds),
      stopReminderSpeech(),
    ]);

    if (elapsedBeforePause >= state.durationMinutes * MS_PER_MINUTE) {
      await completeSessionRef.current();
      return;
    }

    triggeredReminderStageKeysRef.current = getTriggeredReminderStageKeys(
      state.durationMinutes,
      elapsedBeforePause
    );
    setNowMs(now);
    setState((currentState) => ({
      ...currentState,
      elapsedBeforePauseMs: elapsedBeforePause,
      scheduledNotificationIds: [],
      startedAt: null,
      status: 'paused',
    }));
  }

  async function reset() {
    await Promise.all([
      cancelReminderNotifications(state.scheduledNotificationIds),
      stopReminderSpeech(),
    ]);

    triggeredReminderStageKeysRef.current = new Set();
    setNowMs(Date.now());
    setState((currentState) => ({
      ...currentState,
      elapsedBeforePauseMs: 0,
      errorMessage: null,
      scheduledNotificationIds: [],
      sessionId: null,
      startedAt: null,
      status: 'idle',
    }));
  }

  let statusMessage = 'Pick a duration, then let the app mind the clock for you.';
  if (state.status === 'running') {
    statusMessage = nextReminder
      ? `Next reminder: ${nextReminder.message} in ${formatDurationSummary(
          totalDurationMs * nextReminder.progress - elapsedMs
        )}.`
      : 'You are in the final stretch now.';
  } else if (state.status === 'paused') {
    statusMessage = `Timer paused with ${formatDurationSummary(remainingMs)} left on the clock.`;
  } else if (state.status === 'complete') {
    statusMessage = 'AFK session complete. Reset or change the duration to start a new one.';
  }

  return {
    canEditDuration: state.status === 'idle' || state.status === 'complete',
    canPause: state.status === 'running',
    canReset: state.status !== 'idle',
    countdownLabel: formatClock(remainingMs),
    durationMinutes: state.durationMinutes,
    elapsedMs,
    isReady: state.isReady,
    nextReminderSummary:
      state.status === 'running' && nextReminder
        ? formatDurationSummary(totalDurationMs * nextReminder.progress - elapsedMs)
        : state.status === 'complete'
          ? 'Done'
          : 'Queued on start',
    permissionMessage:
      state.permissionState === 'denied'
        ? 'Local notification permission is off. Voice prompts still work while the app stays open, but background reminders need notification access.'
        : state.permissionState === 'unsupported'
          ? 'This platform does not support the mobile notification flow used by the AFK timer.'
          : state.errorMessage,
    progress,
    progressPercent,
    remainingMs,
    remainingSummary: formatDurationSummary(remainingMs),
    sessionCount: state.sessionCount,
    start,
    pause,
    reset,
    setDurationMinutes,
    nudgeDuration,
    setVoiceEnabled,
    setVibrationEnabled,
    status: state.status,
    statusLabel: getStatusLabel(state.status),
    statusMessage,
    voiceEnabled: state.voiceEnabled,
    vibrationEnabled: state.vibrationEnabled,
  };
}
