import { DEFAULT_SETTINGS, DEFAULT_SUBJECT, LEGACY_STORAGE_KEYS, STORAGE_KEY, THEME_KEY } from './constants.js';
import { addDays, isoDate, todayLocal, uid } from './utils.js';

function defaultDates() {
  const today = todayLocal();
  const examStart = addDays(today, 21);
  return {
    studyStartDate: isoDate(today),
    examStartDate: isoDate(examStart),
    examEndDate: isoDate(addDays(examStart, 4))
  };
}

export function createDefaultState() {
  return {
    version: 4,
    settings: { ...DEFAULT_SETTINGS, ...defaultDates() },
    subjects: [],
    schedules: [],
    tasks: [],
    warnings: [],
    generatedAt: null,
    updatedAt: new Date().toISOString()
  };
}

function normalizeSubject(subject = {}, fallbackExamDate) {
  return {
    ...DEFAULT_SUBJECT,
    ...subject,
    id: subject.id || uid('subject'),
    examDate: subject.examDate || fallbackExamDate,
    score: subject.score === '' || subject.score == null ? null : Number(subject.score),
    targetScore: Number(subject.targetScore ?? 80),
    confidence: Number(subject.confidence ?? 3),
    difficulty: Number(subject.difficulty ?? 2),
    units: Number(subject.units ?? 20)
  };
}

function normalizeSchedule(schedule = {}) {
  return {
    id: schedule.id || uid('schedule'),
    day: Number(schedule.day ?? 1),
    label: schedule.label || '',
    start: schedule.start || '18:00',
    end: schedule.end || '20:30'
  };
}

function normalizeTask(task = {}) {
  const wasMissed = task.status === 'missed';
  return {
    ...task,
    id: task.id || uid('task'),
    status: wasMissed ? 'pending' : (task.status || 'pending'),
    rescheduledCount: Number(task.rescheduledCount || (wasMissed ? 1 : 0)),
    originalDuration: Number(task.originalDuration || task.duration || 40),
    duration: Number(task.duration || 40),
    isBuffer: Boolean(task.isBuffer)
  };
}

export function normalizeState(rawState) {
  const fallback = createDefaultState();
  const state = rawState && typeof rawState === 'object' ? rawState : {};
  const settings = { ...fallback.settings, ...(state.settings || {}) };
  return {
    version: 4,
    settings,
    subjects: Array.isArray(state.subjects) ? state.subjects.map(subject => normalizeSubject(subject, settings.examStartDate)) : [],
    schedules: Array.isArray(state.schedules) ? state.schedules.map(normalizeSchedule) : [],
    tasks: Array.isArray(state.tasks) ? state.tasks.map(normalizeTask) : [],
    warnings: Array.isArray(state.warnings) ? state.warnings : [],
    generatedAt: state.generatedAt || null,
    updatedAt: state.updatedAt || new Date().toISOString()
  };
}

export function loadState() {
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const normalized = normalizeState(JSON.parse(raw));
      if (key !== STORAGE_KEY) saveState(normalized);
      return normalized;
    } catch (error) {
      console.warn(`저장 데이터 불러오기 실패: ${key}`, error);
    }
  }
  return createDefaultState();
}

export function saveState(state) {
  const nextState = { ...state, version: 4, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
}

export function clearStoredState() {
  [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].forEach(key => localStorage.removeItem(key));
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
