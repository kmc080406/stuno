/* STUNO v6.3.0 generated bundle. Edit modular sources, then run npm run build. */
'use strict';

/* --- js/constants.js --- */
const APP_VERSION = '6.3.0';
const STORAGE_KEY = 'stuno-v6';
const LEGACY_STORAGE_KEYS = ['stuno-v5', 'studyflow-v4', 'studyflow-ai-v1', 'studyflow-v2', 'studyflow-v3'];
const THEME_KEY = 'stuno-theme';

const ROUTES = [
  'welcome',
  'setup/basic',
  'setup/dates',
  'setup/amount',
  'setup/hours',
  'setup/sleep',
  'setup/subjects',
  'setup/ranges',
  'setup/schedule',
  'setup/method',
  'setup/review',
  'dashboard/today',
  'dashboard/week',
  'dashboard/history',
  'dashboard/subjects',
  'dashboard/tasks',
  'dashboard/sync',
  'dashboard/settings'
];

const SETUP_ROUTES = [
  'setup/basic',
  'setup/dates',
  'setup/amount',
  'setup/hours',
  'setup/sleep',
  'setup/subjects',
  'setup/ranges',
  'setup/schedule',
  'setup/method',
  'setup/review'
];
const DASHBOARD_ROUTES = [
  'dashboard/today',
  'dashboard/week',
  'dashboard/history',
  'dashboard/subjects',
  'dashboard/tasks',
  'dashboard/sync',
  'dashboard/settings'
];

const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TYPE_LABELS = {
  concept: '개념 이해',
  practice: '문제 연습',
  retrieval: '인출 연습',
  review: '누적 복습',
  final: '최종 점검'
};
const UNIT_LABELS = { page: '쪽', worksheet: '장', question: '문제', chapter: '소단원' };
const UNIT_MINUTES = { page: 4, worksheet: 18, question: 4, chapter: 85 };
const SUBJECT_COLORS = ['#355f8a', '#9d6234', '#507557', '#80567b', '#a14d4d', '#557392', '#7a6a45', '#4a7a74'];

const TIME_PRESETS = {
  light: { weekdayTarget: 90, weekdayMax: 150, weekendTarget: 180, weekendMax: 270 },
  balanced: { weekdayTarget: 150, weekdayMax: 210, weekendTarget: 300, weekendMax: 420 },
  intensive: { weekdayTarget: 210, weekdayMax: 300, weekendTarget: 420, weekendMax: 540 }
};

const DEFAULT_SETTINGS = {
  planName: '',
  grade: 'none',
  studyStartDate: '',
  examStartDate: '',
  examEndDate: '',
  weekdayTarget: 150,
  weekendTarget: 300,
  weekdayMax: 210,
  weekendMax: 420,
  weekdayStart: '18:30',
  weekdayEnd: '23:00',
  weekdayWake: '07:00',
  weekendStart: '10:00',
  weekendEnd: '22:30',
  weekendWake: '09:00',
  sessionLength: 40,
  breakLength: 10,
  minSleep: 8,
  planStyle: 'balanced'
};

const DEFAULT_SUBJECT = {
  name: '',
  examDate: '',
  score: null,
  targetScore: 80,
  confidence: 3,
  difficulty: 2,
  units: 20,
  unitType: 'page',
  material: '교과서·학교 학습지',
  range: '',
  weakness: 'none'
};

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';


/* --- js/academic.js --- */
const GRADE_OPTIONS = [
  { value: 'none', label: '학생이 아님 / 해당 없음', group: '기타' },
  ...Array.from({ length: 6 }, (_, index) => ({ value: `elementary-${index + 1}`, label: `초등학교 ${index + 1}학년`, group: '초등학교' })),
  ...Array.from({ length: 3 }, (_, index) => ({ value: `middle-${index + 1}`, label: `중학교 ${index + 1}학년`, group: '중학교' })),
  ...Array.from({ length: 3 }, (_, index) => ({ value: `high-${index + 1}`, label: `고등학교 ${index + 1}학년`, group: '고등학교' }))
];

const GRADE_ORDER = GRADE_OPTIONS.filter(option => option.value !== 'none').map(option => option.value);

function currentAcademicYear() { return new Date().getFullYear(); }

function normalizeGrade(value) {
  const text = String(value ?? '').trim();
  if (GRADE_OPTIONS.some(option => option.value === text)) return text;
  if (/^[1-3]$/.test(text)) return `high-${text}`;
  return 'none';
}

function gradeLabel(value) {
  return GRADE_OPTIONS.find(option => option.value === normalizeGrade(value))?.label || '학생이 아님 / 해당 없음';
}

function nextGrade(value) {
  const normalized = normalizeGrade(value);
  if (normalized === 'none') return null;
  const index = GRADE_ORDER.indexOf(normalized);
  if (index < 0) return null;
  return GRADE_ORDER[index + 1] || 'none';
}

function shouldAskGradePromotion(profile, grade, year = currentAcademicYear()) {
  if (normalizeGrade(grade) === 'none') return false;
  const savedYear = Number(profile?.academicYear || year);
  const promptedYear = Number(profile?.lastGradePromptYear || 0);
  return year > savedYear && promptedYear < year;
}

function gradeOptionsMarkup(selectedValue = 'none') {
  const selected = normalizeGrade(selectedValue);
  return ['기타', '초등학교', '중학교', '고등학교'].map(group => {
    const options = GRADE_OPTIONS.filter(option => option.group === group)
      .map(option => `<option value="${option.value}"${option.value === selected ? ' selected' : ''}>${option.label}</option>`)
      .join('');
    return `<optgroup label="${group}">${options}</optgroup>`;
  }).join('');
}


/* --- js/theme.js --- */
function normalizeTheme(theme) { return theme === 'dark' ? 'dark' : 'light'; }

function applyAppTheme(theme, root = document) {
  const normalized = normalizeTheme(theme);
  root.documentElement.dataset.theme = normalized;
  if (root.body) root.body.dataset.theme = normalized;
  const meta = root.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', normalized === 'dark' ? '#24211d' : '#f6f0df');
  const button = root.querySelector('#themeToggle');
  if (button) {
    const dark = normalized === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? '밝은 화면으로 전환' : '어두운 화면으로 전환');
    button.title = dark ? '밝은 화면으로 전환' : '어두운 화면으로 전환';
    button.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '◐'}</span><span class="theme-button-label">${dark ? '밝게' : '어둡게'}</span>`;
  }
  return normalized;
}


/* --- js/utils.js --- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function uid(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [year, month, day] = String(value).split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(value, amount) {
  const date = value instanceof Date ? new Date(value) : parseDate(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function maxDate(...dates) {
  const valid = dates.filter(Boolean).map(date => date instanceof Date ? date : parseDate(date));
  return new Date(Math.max(...valid.map(date => date.getTime())));
}

function minDate(...dates) {
  const valid = dates.filter(Boolean).map(date => date instanceof Date ? date : parseDate(date));
  return new Date(Math.min(...valid.map(date => date.getTime())));
}

function daysBetween(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function startOfWeek(value) {
  const date = value instanceof Date ? new Date(value) : parseDate(value);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function timeToMinutes(time) {
  if (!time || !String(time).includes(':')) return 0;
  const [hours, minutes] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const safe = Math.max(0, Math.round(totalMinutes));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function formatMinutes(minutes) {
  const safe = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(safe / 60);
  const remainder = safe % 60;
  if (!hours) return `${remainder}분`;
  return `${hours}시간${remainder ? ` ${remainder}분` : ''}`;
}

function formatDate(value, options = {}) {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return '-';
  const { year = false, weekday = false } = options;
  const parts = [];
  if (year) parts.push(`${date.getFullYear()}년`);
  parts.push(`${date.getMonth() + 1}월 ${date.getDate()}일`);
  if (weekday) parts.push(`${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}요일`);
  return parts.join(' ');
}

function formatShortDate(value) {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return '-';
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function nullableNumber(value) {
  return value === '' || value == null ? null : Number(value);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function debounce(callback, wait = 300) {
  let timer = null;
  let latestArgs = [];
  const debounced = (...args) => {
    latestArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      callback(...latestArgs);
    }, wait);
  };
  debounced.flush = () => {
    if (timer == null) return;
    clearTimeout(timer);
    timer = null;
    callback(...latestArgs);
  };
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

function cssEscape(value) {
  const text = String(value ?? '');
  if (globalThis.CSS?.escape) return globalThis.CSS.escape(text);
  return text.replace(/[^a-zA-Z0-9_-]/g, character => `\\${character.codePointAt(0).toString(16)} `);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileName(name) {
  return (name || 'stuno').replace(/[\\/:*?"<>|]/g, '-').trim();
}

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = intervals
    .map(interval => ({ start: Number(interval.start), end: Number(interval.end) }))
    .filter(interval => interval.end > interval.start)
    .sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = merged[merged.length - 1];
    if (current.start <= previous.end) previous.end = Math.max(previous.end, current.end);
    else merged.push(current);
  }
  return merged;
}

function overlapMinutes(intervals, windowStart, windowEnd) {
  return mergeIntervals(intervals.map(interval => ({
    start: Math.max(windowStart, interval.start),
    end: Math.min(windowEnd, interval.end)
  }))).reduce((sum, interval) => sum + Math.max(0, interval.end - interval.start), 0);
}

function isSameDay(first, second) {
  return isoDate(first) === isoDate(second);
}

function todayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}


/* --- js/storage.js --- */
let persistentStorageAvailable = true;
const memoryStorage = new Map();

function storageGet(key) {
  try {
    const value = localStorage.getItem(key);
    if (value != null) memoryStorage.set(key, value);
    return value ?? memoryStorage.get(key) ?? null;
  } catch (error) {
    persistentStorageAvailable = false;
    console.warn('브라우저 저장소를 사용할 수 없어 현재 탭에만 임시 저장합니다.', error);
    return memoryStorage.get(key) ?? null;
  }
}
function storageSet(key, value) {
  memoryStorage.set(key, value);
  try { localStorage.setItem(key, value); }
  catch (error) {
    persistentStorageAvailable = false;
    console.warn('브라우저 저장소 저장에 실패해 현재 탭에만 임시 저장합니다.', error);
  }
}
function storageRemove(key) {
  memoryStorage.delete(key);
  try { localStorage.removeItem(key); }
  catch (error) {
    persistentStorageAvailable = false;
    console.warn('브라우저 저장소 삭제에 실패했습니다.', error);
  }
}
function isPersistentStorageAvailable() { return persistentStorageAvailable; }

function defaultDates() {
  const today = todayLocal();
  const examStart = addDays(today, 21);
  return { studyStartDate: isoDate(today), examStartDate: isoDate(examStart), examEndDate: isoDate(addDays(examStart, 4)) };
}

function createDefaultState() {
  return {
    version: 6,
    profile: { started: false, academicYear: currentAcademicYear(), lastGradePromptYear: null },
    settings: { ...DEFAULT_SETTINGS, ...defaultDates() },
    subjects: [], schedules: [], tasks: [], warnings: [],
    calendar: { clientId: '', calendarId: '', calendarName: '', eventMap: {}, lastSyncAt: null, autoSync: false },
    generatedAt: null,
    updatedAt: new Date().toISOString()
  };
}
function normalizeSubject(subject = {}, fallbackExamDate) {
  return {
    ...DEFAULT_SUBJECT, ...subject, id: subject.id || uid('subject'), examDate: subject.examDate || fallbackExamDate,
    score: subject.score === '' || subject.score == null ? null : Number(subject.score),
    targetScore: Number(subject.targetScore ?? 80), confidence: Number(subject.confidence ?? 3),
    difficulty: Number(subject.difficulty ?? 2), units: Number(subject.units ?? 20)
  };
}
function normalizeSchedule(schedule = {}) {
  return { id: schedule.id || uid('schedule'), day: Number(schedule.day ?? 1), label: schedule.label || '', start: schedule.start || '18:00', end: schedule.end || '20:30' };
}
function normalizeTask(task = {}) {
  const wasMissed = task.status === 'missed';
  const id = task.id || uid('task');
  return {
    ...task, id, rootTaskId: task.rootTaskId || id,
    status: wasMissed ? 'pending' : (task.status || 'pending'),
    rescheduledCount: Number(task.rescheduledCount || (wasMissed ? 1 : 0)),
    originalDuration: Number(task.originalDuration || task.duration || 40), duration: Number(task.duration || 40),
    isBuffer: Boolean(task.isBuffer), rescheduledFromDate: task.rescheduledFromDate || null,
    rescheduledFromTaskId: task.rescheduledFromTaskId || null, movedToTaskId: task.movedToTaskId || null
  };
}
function normalizeState(rawState) {
  const fallback = createDefaultState();
  const state = rawState && typeof rawState === 'object' ? rawState : {};
  const settings = { ...fallback.settings, ...(state.settings || {}) };
  settings.grade = normalizeGrade(settings.grade);
  const calendar = { ...fallback.calendar, ...(state.calendar || {}) };
  if (!calendar.eventMap || typeof calendar.eventMap !== 'object' || Array.isArray(calendar.eventMap)) calendar.eventMap = {};
  calendar.calendarId = String(calendar.calendarId || '');
  calendar.calendarName = String(calendar.calendarName || '');
  calendar.autoSync = Boolean(calendar.autoSync);
  const priorVersion = Number(state.version || 0);
  const profile = {
    ...fallback.profile, ...(state.profile || {}),
    started: state.profile?.started == null ? priorVersion > 0 : Boolean(state.profile.started),
    academicYear: Number(state.profile?.academicYear || currentAcademicYear()),
    lastGradePromptYear: state.profile?.lastGradePromptYear == null ? null : Number(state.profile.lastGradePromptYear)
  };
  return {
    version: 6, profile, settings,
    subjects: Array.isArray(state.subjects) ? state.subjects.map(subject => normalizeSubject(subject, settings.examStartDate)) : [],
    schedules: Array.isArray(state.schedules) ? state.schedules.map(normalizeSchedule) : [],
    tasks: Array.isArray(state.tasks) ? state.tasks.map(normalizeTask) : [],
    warnings: Array.isArray(state.warnings) ? state.warnings : [], calendar,
    generatedAt: state.generatedAt || null, updatedAt: state.updatedAt || new Date().toISOString(),
    recoveryNotice: state.recoveryNotice || '', recoveryNoticeDate: state.recoveryNoticeDate || '',
    isPlanStale: Boolean(state.isPlanStale)
  };
}
function loadState() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const raw = storageGet(key);
      if (!raw) continue;
      const normalized = normalizeState(JSON.parse(raw));
      if (key !== STORAGE_KEY) saveState(normalized);
      return normalized;
    } catch (error) { console.warn(`저장 데이터 불러오기 실패: ${key}`, error); }
  }
  return createDefaultState();
}
function saveState(state) {
  const nextState = { ...state, version: 6, updatedAt: new Date().toISOString() };
  storageSet(STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
}
function clearStoredState() { [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].forEach(storageRemove); }
function loadTheme() { return storageGet(THEME_KEY) || 'light'; }
function saveTheme(theme) { storageSet(THEME_KEY, theme); }


/* --- js/backup.js --- */
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

function createBackupFile(state, theme) {
  const payload = {
    format: 'stuno-backup',
    backupVersion: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    theme,
    state
  };
  const date = isoDate(todayLocal()).replaceAll('-', '');
  return {
    content: JSON.stringify(payload, null, 2),
    filename: `stuno-backup-${date}.json`
  };
}

function parseBackupText(text, size = new Blob([text]).size) {
  if (size > MAX_BACKUP_BYTES) {
    throw new Error('백업 파일이 너무 큽니다. 5MB 이하 파일을 선택해 주세요.');
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON 형식이 올바르지 않습니다. STUNO 백업 파일을 다시 선택해 주세요.');
  }
  const rawState = parsed?.format === 'stuno-backup' ? parsed.state : parsed;
  if (!rawState || typeof rawState !== 'object' || !Array.isArray(rawState.subjects) || !Array.isArray(rawState.tasks)) {
    throw new Error('올바른 STUNO 백업 파일이 아닙니다.');
  }
  return {
    state: rawState,
    theme: parsed?.format === 'stuno-backup' ? parsed.theme : null,
    metadata: parsed?.format === 'stuno-backup' ? {
      appVersion: parsed.appVersion || '',
      exportedAt: parsed.exportedAt || ''
    } : null
  };
}


/* --- js/planner.js --- */
const STAGES = [
  { type: 'concept', ratio: 0.24, startRatio: 0, endRatio: 0.40 },
  { type: 'practice', ratio: 0.36, startRatio: 0.18, endRatio: 0.67 },
  { type: 'retrieval', ratio: 0.16, startRatio: 0.45, endRatio: 0.82 },
  { type: 'review', ratio: 0.17, startRatio: 0.65, endRatio: 0.95 },
  { type: 'final', ratio: 0.07, startRatio: 0.87, endRatio: 1 }
];

const STAGE_ORDER = Object.fromEntries(STAGES.map((stage, index) => [stage.type, index]));


function effectiveStudyWindow(settings, weekend = false) {
  const startKey = weekend ? 'weekendStart' : 'weekdayStart';
  const endKey = weekend ? 'weekendEnd' : 'weekdayEnd';
  const wakeKey = weekend ? 'weekendWake' : 'weekdayWake';
  const start = timeToMinutes(settings[startKey]);
  const configuredEnd = timeToMinutes(settings[endKey]);
  const wake = timeToMinutes(settings[wakeKey]);
  const minimumSleepMinutes = clamp(Number(settings.minSleep || 8) * 60, 420, 600);
  const bedtimeFromSleep = wake
    ? Math.min(1440, wake + 1440 - minimumSleepMinutes)
    : configuredEnd;
  return {
    start,
    configuredEnd,
    sleepEnd: bedtimeFromSleep,
    end: Math.min(configuredEnd, bedtimeFromSleep),
    limitedBySleep: bedtimeFromSleep < configuredEnd
  };
}

function estimateSubjectMinutes(subject) {
  const base = Math.max(1, Number(subject.units || 1)) * (UNIT_MINUTES[subject.unitType] || 5);
  const scoreGap = subject.score == null
    ? (5 - Number(subject.confidence || 3)) * 8
    : Math.max(0, Number(subject.targetScore || 80) - Number(subject.score));
  const scoreFactor = 1 + Math.min(0.75, scoreGap / 100 * 1.55);
  const confidenceFactor = 1 + (5 - Number(subject.confidence || 3)) * 0.11;
  const difficultyFactor = [0, 0.9, 1.08, 1.28][Number(subject.difficulty || 2)] || 1;
  const weaknessFactor = subject.weakness === 'none' ? 1 : 1.1;
  return clamp(Math.round(base * scoreFactor * confidenceFactor * difficultyFactor * weaknessFactor), 140, 2400);
}

function subjectRisk(subject) {
  const gap = subject.score == null
    ? (5 - Number(subject.confidence || 3)) * 10
    : Math.max(0, Number(subject.targetScore || 80) - Number(subject.score));
  const difficulty = Number(subject.difficulty || 2) * 12;
  const volume = Math.min(30, Number(subject.units || 1) / 3);
  const weakness = subject.weakness === 'none' ? 0 : 8;
  return clamp(Math.round(gap + difficulty + volume + weakness), 0, 100);
}

function riskLevel(subject) {
  const risk = subjectRisk(subject);
  if (risk >= 65) return { key: 'high', label: '집중 필요' };
  if (risk >= 42) return { key: 'medium', label: '주의' };
  return { key: 'low', label: '안정' };
}

function recommendationFor(subject) {
  const methods = {
    concept: {
      title: '개념을 다시 설명하는 방식',
      body: '교과서와 학교 학습지의 핵심 내용을 읽은 뒤 자료를 덮고 직접 설명하세요. 막히는 부분만 표시해 다시 확인하면 시간을 줄일 수 있습니다.'
    },
    application: {
      title: '조건과 개념을 연결하는 연습',
      body: '문제의 조건에 표시하고 사용할 개념을 먼저 적은 뒤 풀이하세요. 익숙해진 뒤에는 여러 유형을 섞어 어떤 개념을 선택해야 하는지 연습합니다.'
    },
    speed: {
      title: '정확도 이후 시간 제한',
      body: '처음부터 빠르게 풀려고 하지 말고 정확한 풀이 순서를 만든 뒤, 익숙해진 문제만 제한시간을 두고 반복하세요.'
    },
    mistake: {
      title: '실수 원인별 오답 관리',
      body: '부호, 단위, 조건 누락처럼 실수 원인을 분류하고 같은 유형을 2~3일 뒤 답 없이 다시 풀어 같은 실수가 반복되는지 확인하세요.'
    },
    memory: {
      title: '읽기보다 인출 중심 암기',
      body: '가리고 말하기, 빈칸 테스트, 빈 종이 요약을 사용하세요. 오늘 학습한 내용은 이틀 뒤와 시험 직전에 다시 꺼내 보는 일정으로 배치됩니다.'
    },
    none: {
      title: '학교 자료 중심 유지 학습',
      body: '새 문제를 계속 늘리기보다 교과서와 학교 학습지의 핵심 개념, 틀린 문제, 서술형 표현을 짧게 반복해 현재 수준을 안정적으로 유지하세요.'
    }
  };
  if (subject.material === '자료 부족') {
    return {
      title: '연습자료 보완 필요',
      body: '교과서와 학교 학습지를 먼저 끝낸 뒤에도 연습문제가 부족하면 전체 문제집보다 시험 범위 단원만 포함한 학습지나 평가문제집을 추가하는 편이 좋습니다.'
    };
  }
  return methods[subject.weakness] || methods.none;
}

function calculatePriority(subject, settings, type) {
  const days = Math.max(1, daysBetween(settings.studyStartDate, subject.examDate));
  const urgency = Math.min(100, 100 / days * 7);
  const scoreGap = subject.score == null
    ? (5 - Number(subject.confidence || 3)) * 10
    : Math.max(0, Number(subject.targetScore || 80) - Number(subject.score));
  const volume = Math.min(100, Number(subject.units || 1) * 2);
  const stageBoost = { concept: 10, practice: 8, retrieval: 6, review: 5, final: 12 }[type] || 0;
  let weights = { urgency: 0.35, weakness: 0.25, volume: 0.2 };
  if (settings.planStyle === 'score') weights = { urgency: 0.25, weakness: 0.4, volume: 0.2 };
  if (settings.planStyle === 'deadline') weights = { urgency: 0.5, weakness: 0.2, volume: 0.15 };
  return Math.round(urgency * weights.urgency + scoreGap * weights.weakness + volume * weights.volume + stageBoost);
}

function positionDate(startDate, examDate, ratio) {
  const totalDays = Math.max(0, daysBetween(startDate, examDate));
  return addDays(parseDate(startDate), Math.round(totalDays * clamp(ratio, 0, 1)));
}

function taskTitle(subject, type, sequence, count) {
  const suffix = count > 1 ? ` ${sequence}` : '';
  const labels = {
    concept: `${subject.name} 핵심 개념 이해${suffix}`,
    practice: `${subject.name} 문제 적용 연습${suffix}`,
    retrieval: `${subject.name} 책 덮고 회상 테스트${suffix}`,
    review: `${subject.name} 오답·누적 복습${suffix}`,
    final: `${subject.name} 시험 직전 최종 점검${suffix}`
  };
  return labels[type];
}

function completionRule(type) {
  return {
    concept: '핵심 내용을 보지 않고 3분 이상 설명할 수 있으면 완료',
    practice: '정답률 80% 이상이거나 틀린 이유를 설명할 수 있으면 완료',
    retrieval: '자료를 보지 않고 핵심 내용의 90% 이상을 꺼내면 완료',
    review: '기존 오답을 답 없이 다시 풀고 같은 실수를 하지 않으면 완료',
    final: '새 내용 없이 핵심 개념, 오답, 시험 전략을 확인하면 완료'
  }[type];
}

function buildTasks(subjects, settings) {
  const sessionLength = clamp(settings.sessionLength || 40, 20, 90);
  const createdAt = new Date().toISOString();
  const tasks = [];

  subjects.forEach(subject => {
    const totalMinutes = estimateSubjectMinutes(subject);
    STAGES.forEach(stage => {
      const minimum = stage.type === 'final' ? 25 : Math.min(40, sessionLength);
      const stageMinutes = Math.max(minimum, Math.round(totalMinutes * stage.ratio));
      const chunkSize = stage.type === 'final' ? Math.min(45, sessionLength) : sessionLength;
      const chunkCount = Math.max(1, Math.ceil(stageMinutes / chunkSize));
      let remaining = stageMinutes;

      for (let index = 0; index < chunkCount; index += 1) {
        const chunksLeft = chunkCount - index;
        const duration = Math.max(10, Math.round(remaining / chunksLeft));
        const progressStart = index / chunkCount;
        const progressEnd = (index + 1) / chunkCount;
        const earliestRatio = stage.startRatio + (stage.endRatio - stage.startRatio) * progressStart;
        const dueRatio = stage.startRatio + (stage.endRatio - stage.startRatio) * progressEnd;
        const taskId = uid('task');
        tasks.push({
          id: taskId,
          rootTaskId: taskId,
          subjectId: subject.id,
          subjectName: subject.name,
          type: stage.type,
          title: taskTitle(subject, stage.type, index + 1, chunkCount),
          duration,
          originalDuration: duration,
          earliestDate: isoDate(positionDate(settings.studyStartDate, subject.examDate, earliestRatio)),
          dueDate: isoDate(positionDate(settings.studyStartDate, subject.examDate, dueRatio)),
          examDate: subject.examDate,
          priority: calculatePriority(subject, settings, stage.type),
          material: subject.material,
          detail: subject.range || `${subject.units}${UNIT_LABELS[subject.unitType] || '단위'} 범위`,
          completion: completionRule(stage.type),
          status: 'pending',
          scheduledDate: null,
          startTime: null,
          endTime: null,
          isBuffer: false,
          rescheduledCount: 0,
          createdAt
        });
        remaining -= duration;
      }
    });
  });

  return tasks;
}

function clippedFixedIntervals(state, date, windowStart, windowEnd) {
  return state.schedules
    .filter(schedule => Number(schedule.day) === date.getDay())
    .map(schedule => ({
      start: Math.max(windowStart, timeToMinutes(schedule.start)),
      end: Math.min(windowEnd, timeToMinutes(schedule.end)),
      kind: 'fixed'
    }))
    .filter(interval => interval.end > interval.start);
}

function buildDayPlan(state, date, completedTasks) {
  const weekend = [0, 6].includes(date.getDay());
  const settings = state.settings;
  const studyWindow = effectiveStudyWindow(settings, weekend);
  const configuredStart = studyWindow.start;
  const end = studyWindow.end;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const roundedCurrentMinutes = Math.ceil((currentMinutes + 5) / 5) * 5;
  const start = isoDate(date) === isoDate(todayLocal())
    ? Math.max(configuredStart, roundedCurrentMinutes)
    : configuredStart;
  const target = Number(weekend ? settings.weekendTarget : settings.weekdayTarget);
  const max = Number(weekend ? settings.weekendMax : settings.weekdayMax);
  const fixedIntervals = clippedFixedIntervals(state, date, start, end);
  const completedForDay = completedTasks.filter(task => task.scheduledDate === isoDate(date) && task.startTime && task.endTime);
  const studyBookings = completedForDay.map(task => ({
    start: timeToMinutes(task.startTime),
    end: timeToMinutes(task.endTime),
    kind: 'task',
    taskId: task.id
  }));
  const fixedMinutes = overlapMinutes(fixedIntervals, start, end);
  const availableStudyMinutes = Math.max(0, end - start - fixedMinutes);
  const maxCapacity = Math.max(0, Math.min(max, availableStudyMinutes));
  const regularCapacity = Math.max(0, Math.min(Math.round(target * 0.85), maxCapacity));
  const used = completedForDay.reduce((sum, task) => sum + Number(task.duration || 0), 0);
  return {
    date: isoDate(date),
    start,
    end,
    regularCapacity,
    maxCapacity,
    used,
    bookings: [...fixedIntervals, ...studyBookings].sort((a, b) => a.start - b.start)
  };
}

function findSlot(day, duration, breakLength, capacity) {
  if (day.used + duration > capacity) return null;
  let cursor = day.start;
  const bookings = [...day.bookings].sort((a, b) => a.start - b.start);

  for (const booking of bookings) {
    if (booking.end <= day.start || booking.start >= day.end) continue;
    const bookingStart = Math.max(day.start, booking.start);
    const bookingEnd = Math.min(day.end, booking.end);
    const requiredBeforeBooking = duration + (booking.kind === 'task' ? breakLength : 0);
    if (bookingStart - cursor >= requiredBeforeBooking) return { start: cursor };
    cursor = Math.max(cursor, bookingEnd + (booking.kind === 'task' ? breakLength : 0));
  }

  return day.end - cursor >= duration ? { start: cursor } : null;
}

function tryPlaceTask(task, dailyPlans, startDate, endDate, breakLength, useMaximumCapacity) {
  for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
    const day = dailyPlans.get(isoDate(date));
    if (!day) continue;
    const capacity = useMaximumCapacity ? day.maxCapacity : day.regularCapacity;
    const slot = findSlot(day, task.duration, breakLength, capacity);
    if (!slot) continue;

    task.scheduledDate = day.date;
    task.startTime = minutesToTime(slot.start);
    task.endTime = minutesToTime(slot.start + task.duration);
    task.isBuffer = useMaximumCapacity;
    day.used += task.duration;
    day.bookings.push({
      start: slot.start,
      end: slot.start + task.duration,
      kind: 'task',
      taskId: task.id
    });
    day.bookings.sort((a, b) => a.start - b.start);
    return true;
  }
  return false;
}

function scheduleTasks(state, { keepCompleted = true, fromDate = todayLocal() } = {}) {
  const settings = state.settings;
  const planStart = parseDate(settings.studyStartDate);
  const planEnd = parseDate(settings.examEndDate);
  if (!planStart || !planEnd) return { warnings: ['시험 기간을 확인해 주세요.'], unscheduledMinutes: 0 };

  const completedTasks = keepCompleted
    ? state.tasks.filter(task => task.status === 'completed' && task.scheduledDate && parseDate(task.scheduledDate) <= todayLocal())
    : [];
  const candidates = state.tasks.filter(task => task.status === 'pending');
  candidates.forEach(task => {
    task.scheduledDate = null;
    task.startTime = null;
    task.endTime = null;
    task.isBuffer = false;
  });

  const dailyPlans = new Map();
  for (let date = new Date(planStart); date <= planEnd; date = addDays(date, 1)) {
    dailyPlans.set(isoDate(date), buildDayPlan(state, date, completedTasks));
  }

  const today = todayLocal();
  const schedulingStart = maxDate(planStart, fromDate, today);
  const sorted = [...candidates].sort((first, second) => {
    const dueDifference = parseDate(first.dueDate) - parseDate(second.dueDate);
    if (dueDifference) return dueDifference;
    const stageDifference = (STAGE_ORDER[first.type] ?? 9) - (STAGE_ORDER[second.type] ?? 9);
    if (stageDifference) return stageDifference;
    return Number(second.priority || 0) - Number(first.priority || 0);
  });

  const overflowQueue = [];
  for (const task of sorted) {
    const earliest = maxDate(schedulingStart, task.earliestDate, task.earliestOverride);
    const preferredEnd = minDate(task.dueDate, task.examDate, planEnd);
    if (earliest > preferredEnd || !tryPlaceTask(task, dailyPlans, earliest, preferredEnd, Number(settings.breakLength || 10), false)) {
      overflowQueue.push(task);
    }
  }

  const unscheduled = [];
  for (const task of overflowQueue) {
    const earliest = maxDate(schedulingStart, task.earliestDate, task.earliestOverride);
    const hardEnd = minDate(task.examDate, planEnd);
    if (earliest > hardEnd || !tryPlaceTask(task, dailyPlans, earliest, hardEnd, Number(settings.breakLength || 10), true)) {
      unscheduled.push(task);
    }
  }

  const warnings = [];
  const unscheduledMinutes = unscheduled.reduce((sum, task) => sum + Number(task.duration || 0), 0);
  if (unscheduledMinutes > 0) {
    warnings.push(`현재 조건으로는 ${formatMinutes(unscheduledMinutes)}의 학습량을 시험 전에 배치하기 어렵습니다. 공부 가능시간이나 범위를 조정해 주세요.`);
  }
  const overflowMinutes = state.tasks
    .filter(task => task.status === 'pending' && task.isBuffer)
    .reduce((sum, task) => sum + Number(task.duration || 0), 0);
  if (overflowMinutes > 0) {
    warnings.push(`${formatMinutes(overflowMinutes)}은 미리 남겨 둔 여유시간을 사용해 배치되었습니다.`);
  }
  const overloadedDay = [...dailyPlans.values()].find(day => day.used > 420);
  if (overloadedDay) warnings.push('일부 날짜의 공부량이 7시간을 넘습니다. 주말 계획과 시험 범위를 다시 확인해 주세요.');

  state.warnings = warnings;
  return { warnings, unscheduledMinutes, overflowMinutes, dailyPlans };
}

function estimateAvailableMinutes(state) {
  const { settings } = state;
  const start = parseDate(settings.studyStartDate);
  const end = parseDate(settings.examEndDate);
  if (!start || !end || end < start) return 0;
  let total = 0;

  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    const weekend = [0, 6].includes(date.getDay());
    const studyWindow = effectiveStudyWindow(settings, weekend);
    const windowStart = studyWindow.start;
    const windowEnd = studyWindow.end;
    const target = Number(weekend ? settings.weekendTarget : settings.weekdayTarget);
    const max = Number(weekend ? settings.weekendMax : settings.weekdayMax);
    const fixedIntervals = clippedFixedIntervals(state, date, windowStart, windowEnd);
    const blocked = overlapMinutes(fixedIntervals, windowStart, windowEnd);
    const free = Math.max(0, windowEnd - windowStart - blocked);
    total += Math.max(0, Math.min(Math.round(target * 0.85), max, free));
  }
  return total;
}

function detectScheduleConflicts(schedules) {
  const messages = [];
  const grouped = new Map();

  schedules.forEach(schedule => {
    const start = timeToMinutes(schedule.start);
    const end = timeToMinutes(schedule.end);
    if (end <= start) messages.push(`${schedule.label || '고정 일정'}의 종료 시간이 시작 시간보다 빨라요.`);
    if (!grouped.has(Number(schedule.day))) grouped.set(Number(schedule.day), []);
    grouped.get(Number(schedule.day)).push({ ...schedule, startMinutes: start, endMinutes: end });
  });

  grouped.forEach(daySchedules => {
    const valid = daySchedules.filter(schedule => schedule.endMinutes > schedule.startMinutes).sort((a, b) => a.startMinutes - b.startMinutes);
    for (let index = 1; index < valid.length; index += 1) {
      if (valid[index].startMinutes < valid[index - 1].endMinutes) {
        messages.push(`${valid[index - 1].label || '일정'}과(와) ${valid[index].label || '일정'} 시간이 겹칩니다.`);
      }
    }
  });

  return [...new Set(messages)];
}

function subjectProgress(tasks, subjectId) {
  const subjectTasks = tasks.filter(task => task.subjectId === subjectId && !['rescheduled', 'cancelled'].includes(task.status));
  const total = subjectTasks.reduce((sum, task) => sum + Number(task.duration || 0), 0);
  const completed = subjectTasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + Number(task.duration || 0), 0);
  return {
    total,
    completed,
    percentage: total ? Math.round(completed / total * 100) : 0,
    pendingCount: subjectTasks.filter(task => task.status === 'pending').length
  };
}

function planProgress(tasks) {
  const activeTasks = tasks.filter(task => !['rescheduled', 'cancelled'].includes(task.status));
  const total = activeTasks.reduce((sum, task) => sum + Number(task.duration || 0), 0);
  const completed = activeTasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + Number(task.duration || 0), 0);
  return { total, completed, percentage: total ? Math.round(completed / total * 100) : 0 };
}

function taskStatus(task) {
  if (task.status === 'completed') return { key: 'completed', label: task.completedLate ? '과거 완료 확인' : '완료' };
  if (task.status === 'rescheduled') return { key: 'rescheduled', label: '미뤄짐' };
  if (task.status === 'cancelled') return { key: 'cancelled', label: '취소됨' };
  if (!task.scheduledDate) return { key: 'unscheduled', label: '미배치' };
  if (task.rescheduledFromDate || task.rescheduledCount > 0) return { key: 'rescheduled', label: '미뤄온 일정' };
  return { key: 'pending', label: task.isBuffer ? '여유시간 사용' : '예정' };
}

function stageLabel(type) {
  return TYPE_LABELS[type] || type;
}


/* --- js/google-calendar.js --- */
const GOOGLE_IDENTITY_URL = 'https://accounts.google.com/gsi/client';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const TOKEN_EXPIRY_MARGIN_MS = 60_000;
const DEFAULT_CALENDAR_NAME = 'STUNO 공부 계획';

let accessToken = '';
let accessTokenExpiresAt = 0;
let tokenClient = null;
let connectedClientId = '';
let googleLibraryPromise = null;

function getConfiguredGoogleClientId() {
  return String(globalThis.STUNO_CONFIG?.googleClientId || '').trim();
}

function isValidGoogleClientId(clientId) {
  return /^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(String(clientId || '').trim());
}

function googleOAuthEnvironment(locationLike = globalThis.location) {
  const protocol = locationLike?.protocol || '';
  const hostname = locationLike?.hostname || '';
  const origin = locationLike?.origin || '';
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  if (protocol === 'file:') {
    return { ready: false, origin: 'file://', message: 'Google 연결은 파일을 직접 연 상태에서는 사용할 수 없습니다. GitHub Pages나 localhost에서 실행해 주세요.' };
  }
  if (!['http:', 'https:'].includes(protocol)) {
    return { ready: false, origin, message: 'Google 연결을 지원하지 않는 실행 환경입니다.' };
  }
  if (protocol !== 'https:' && !isLocalhost) {
    return { ready: false, origin, message: 'Google 연결은 HTTPS 주소에서만 사용할 수 있습니다.' };
  }
  return { ready: true, origin, message: '' };
}

function loadGoogleLibrary() {
  if (googleLibraryReady()) return Promise.resolve();
  if (googleLibraryPromise) return googleLibraryPromise;
  googleLibraryPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-stuno-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => googleLibraryReady() ? resolve() : reject(new Error('Google 인증 라이브러리를 초기화하지 못했습니다.')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google 인증 라이브러리를 불러오지 못했습니다.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_URL;
    script.async = true;
    script.defer = true;
    script.dataset.stunoGoogleIdentity = 'true';
    script.onload = () => googleLibraryReady() ? resolve() : reject(new Error('Google 인증 라이브러리를 초기화하지 못했습니다.'));
    script.onerror = () => reject(new Error('Google 인증 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));
    document.head.appendChild(script);
  }).catch(error => {
    googleLibraryPromise = null;
    throw error;
  });
  return googleLibraryPromise;
}

function googleLibraryReady() {
  return Boolean(globalThis.google?.accounts?.oauth2);
}

function googleIsConnected() {
  return Boolean(accessToken && Date.now() < accessTokenExpiresAt - TOKEN_EXPIRY_MARGIN_MS);
}

function googleConnectionInfo() {
  return {
    connected: googleIsConnected(),
    clientId: connectedClientId,
    expiresAt: accessTokenExpiresAt || null
  };
}

function friendlyAuthError(error) {
  const type = String(error?.type || error?.error || '').toLowerCase();
  if (type.includes('popup_closed')) return new Error('Google 로그인 창이 닫혔습니다. 다시 연결을 눌러 주세요.');
  if (type.includes('popup_failed')) return new Error('팝업이 차단되었습니다. 이 사이트의 팝업을 허용해 주세요.');
  if (type.includes('invalid_client')) return new Error('OAuth 클라이언트 ID 또는 승인된 JavaScript 원본 설정이 올바르지 않습니다.');
  return new Error(error?.message || error?.error_description || error?.error || error?.type || 'Google 계정 연결에 실패했습니다.');
}

async function connectGoogleCalendar(clientId) {
  const environment = googleOAuthEnvironment();
  if (!environment.ready) throw new Error(environment.message);

  const normalizedClientId = String(clientId || '').trim();
  if (!isValidGoogleClientId(normalizedClientId)) {
    throw new Error('올바른 OAuth 웹 클라이언트 ID를 입력해 주세요.');
  }

  await loadGoogleLibrary();
  return new Promise((resolve, reject) => {
    try {
      const previouslyConnected = connectedClientId === normalizedClientId;
      connectedClientId = normalizedClientId;
      tokenClient = globalThis.google.accounts.oauth2.initTokenClient({
        client_id: normalizedClientId,
        scope: GOOGLE_CALENDAR_SCOPE,
        include_granted_scopes: true,
        callback: response => {
          if (response?.error) {
            reject(friendlyAuthError(response));
            return;
          }
          const hasScope = globalThis.google.accounts.oauth2.hasGrantedAllScopes?.(response, GOOGLE_CALENDAR_SCOPE) ?? true;
          if (!hasScope) {
            reject(new Error('STUNO 캘린더를 만들고 관리할 권한이 허용되지 않았습니다.'));
            return;
          }
          accessToken = response.access_token || '';
          accessTokenExpiresAt = Date.now() + Number(response.expires_in || 3600) * 1000;
          resolve({ ...response, expiresAt: accessTokenExpiresAt });
        },
        error_callback: error => reject(friendlyAuthError(error))
      });
      tokenClient.requestAccessToken({ prompt: previouslyConnected ? '' : 'consent' });
    } catch (error) {
      reject(friendlyAuthError(error));
    }
  });
}

function disconnectGoogleCalendar() {
  if (accessToken && globalThis.google?.accounts?.oauth2?.revoke) {
    globalThis.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = '';
  accessTokenExpiresAt = 0;
  tokenClient = null;
  connectedClientId = '';
}

function friendlyGoogleApiError(status, data = {}) {
  const apiMessage = data?.error?.message || '';
  const reason = data?.error?.errors?.[0]?.reason || '';
  if (status === 401) return 'Google 접근 권한이 만료되었습니다. 다시 연결해 주세요.';
  if (status === 403 && /accessNotConfigured|SERVICE_DISABLED/i.test(`${reason} ${apiMessage}`)) {
    return 'Google Cloud에서 Calendar API가 아직 사용 설정되지 않았습니다.';
  }
  if (status === 403) return apiMessage || 'Google Calendar 접근 권한이 부족합니다. OAuth 동의 화면과 권한 설정을 확인해 주세요.';
  if (status === 404) return 'Google Calendar에서 대상 일정을 찾지 못했습니다.';
  if (status === 409) return '같은 일정이 이미 Google Calendar에 있습니다.';
  if (status === 429) return 'Google Calendar 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  if (status >= 500) return 'Google Calendar 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.';
  return apiMessage || `Google Calendar 요청 실패 (${status})`;
}

async function apiRequest(pathOrUrl, options = {}) {
  if (!googleIsConnected()) {
    accessToken = '';
    throw new Error('Google 연결이 만료되었습니다. 다시 연결해 주세요.');
  }
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${CALENDAR_API_BASE}${pathOrUrl}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      accessToken = '';
      accessTokenExpiresAt = 0;
    }
    const error = new Error(friendlyGoogleApiError(response.status, data));
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function hash32(value, seed) {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
    hash = (hash ^ (hash >>> 13)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function stableGoogleEventId(taskId) {
  const value = `stuno:${String(taskId || '')}`;
  return `stuno${hash32(value, 0x811c9dc5)}${hash32(value, 0x9e3779b9)}${hash32(value, 0x85ebca6b)}${hash32(value, 0xc2b2ae35)}`;
}

function normalizeCalendarEventMap(eventMap = {}) {
  if (!eventMap || typeof eventMap !== 'object' || Array.isArray(eventMap)) return {};
  return Object.fromEntries(Object.entries(eventMap).flatMap(([taskId, entry]) => {
    if (typeof entry === 'string') return [[taskId, { eventId: entry, fingerprint: '' }]];
    if (!entry || typeof entry !== 'object' || !entry.eventId) return [];
    return [[taskId, { eventId: String(entry.eventId), fingerprint: String(entry.fingerprint || '') }]];
  }));
}

function toDateTime(date, time) {
  return `${date}T${time}:00+09:00`;
}

function eventColorId(subjectName, completed) {
  if (completed) return '8';
  return String((parseInt(hash32(String(subjectName || ''), 0x811c9dc5).slice(-2), 16) % 10) + 1);
}

function buildGoogleEventBody(task, planName, { includeId = false } = {}) {
  const completed = task.status === 'completed';
  const body = {
    summary: `${completed ? '✓ ' : ''}[${task.subjectName}] ${task.title}`,
    description: [
      `STUNO · ${planName || DEFAULT_CALENDAR_NAME}`,
      `자료: ${task.material || '-'}`,
      `범위: ${task.detail || '-'}`,
      `완료 기준: ${task.completion || '-'}`,
      task.rescheduledFromDate ? `미뤄온 날짜: ${task.rescheduledFromDate}` : '',
      '이 일정은 STUNO에서 관리됩니다.'
    ].filter(Boolean).join('\n'),
    start: { dateTime: toDateTime(task.scheduledDate, task.startTime), timeZone: 'Asia/Seoul' },
    end: { dateTime: toDateTime(task.scheduledDate, task.endTime), timeZone: 'Asia/Seoul' },
    reminders: { useDefault: true },
    transparency: completed ? 'transparent' : 'opaque',
    colorId: eventColorId(task.subjectName, completed),
    extendedProperties: {
      private: {
        stunoTaskId: String(task.id),
        stunoRootTaskId: String(task.rootTaskId || task.id),
        stunoManaged: 'true'
      }
    }
  };
  if (includeId) body.id = stableGoogleEventId(task.id);
  return body;
}

function googleEventFingerprint(body) {
  const canonical = JSON.stringify({
    summary: body.summary,
    description: body.description,
    start: body.start,
    end: body.end,
    reminders: body.reminders,
    transparency: body.transparency,
    colorId: body.colorId,
    extendedProperties: body.extendedProperties
  });
  return `${hash32(canonical, 0x811c9dc5)}${hash32(canonical, 0x9e3779b9)}`;
}

async function ensureStunoCalendar({ calendarId = '', planName = '' } = {}) {
  const currentId = String(calendarId || '').trim();
  if (currentId) {
    try {
      const calendar = await apiRequest(`/calendars/${encodeURIComponent(currentId)}`);
      return { calendarId: calendar.id, calendar, created: false, replaced: false };
    } catch (error) {
      if (![404, 410].includes(error.status)) throw error;
    }
  }

  const calendar = await apiRequest('/calendars', {
    method: 'POST',
    body: JSON.stringify({
      summary: DEFAULT_CALENDAR_NAME,
      description: `${planName ? `${planName} · ` : ''}STUNO가 만든 공부 일정 전용 캘린더`,
      timeZone: 'Asia/Seoul'
    })
  });
  return { calendarId: calendar.id, calendar, created: true, replaced: Boolean(currentId) };
}

async function upsertEvent(calendarId, task, planName, existingEntry) {
  const body = buildGoogleEventBody(task, planName);
  const fingerprint = googleEventFingerprint(body);
  if (existingEntry?.fingerprint === fingerprint) {
    return { eventId: existingEntry.eventId, fingerprint, action: 'skipped' };
  }

  const deterministicId = stableGoogleEventId(task.id);
  const eventId = existingEntry?.eventId || deterministicId;

  if (existingEntry?.eventId) {
    try {
      await apiRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      return { eventId, fingerprint, action: 'updated' };
    } catch (error) {
      if (![404, 410].includes(error.status)) throw error;
    }
  }

  try {
    const created = await apiRequest(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      body: JSON.stringify({ ...body, id: deterministicId })
    });
    return { eventId: created.id || deterministicId, fingerprint, action: 'created' };
  } catch (error) {
    if (error.status !== 409) throw error;
    await apiRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(deterministicId)}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return { eventId: deterministicId, fingerprint, action: 'updated' };
  }
}

function googleCalendarWebUrl(calendarId) {
  if (!calendarId) return 'https://calendar.google.com/calendar/u/0/r';
  return `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;
}

async function syncGoogleCalendar({
  tasks,
  eventMap = {},
  calendarId = '',
  planName = DEFAULT_CALENDAR_NAME,
  onProgress = () => {}
}) {
  if (!googleIsConnected()) throw new Error('먼저 Google 계정을 연결해 주세요.');

  const calendarResult = await ensureStunoCalendar({ calendarId, planName });
  const targetCalendarId = calendarResult.calendarId;
  const activeTasks = (Array.isArray(tasks) ? tasks : []).filter(task =>
    ['pending', 'completed'].includes(task.status)
    && task.scheduledDate
    && task.startTime
    && task.endTime
  );
  const activeIds = new Set(activeTasks.map(task => String(task.id)));
  const nextEventMap = calendarResult.created ? {} : normalizeCalendarEventMap(eventMap);
  const staleEntries = Object.entries(nextEventMap).filter(([taskId]) => !activeIds.has(taskId));
  const total = activeTasks.length + staleEntries.length;
  let processed = 0;
  let created = 0;
  let updated = 0;
  let removed = 0;
  let skipped = 0;

  for (const task of activeTasks) {
    const taskId = String(task.id);
    const result = await upsertEvent(targetCalendarId, task, planName, nextEventMap[taskId]);
    nextEventMap[taskId] = { eventId: result.eventId, fingerprint: result.fingerprint };
    if (result.action === 'created') created += 1;
    if (result.action === 'updated') updated += 1;
    if (result.action === 'skipped') skipped += 1;
    processed += 1;
    onProgress({ processed, total, created, updated, removed, skipped, calendarCreated: calendarResult.created });
  }

  for (const [taskId, entry] of staleEntries) {
    try {
      await apiRequest(`/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(entry.eventId)}`, { method: 'DELETE' });
    } catch (error) {
      if (![404, 410].includes(error.status)) throw error;
    }
    delete nextEventMap[taskId];
    removed += 1;
    processed += 1;
    onProgress({ processed, total, created, updated, removed, skipped, calendarCreated: calendarResult.created });
  }

  return {
    calendarId: targetCalendarId,
    calendarName: calendarResult.calendar?.summary || DEFAULT_CALENDAR_NAME,
    calendarCreated: calendarResult.created,
    eventMap: nextEventMap,
    created,
    updated,
    removed,
    skipped,
    total: activeTasks.length
  };
}


/* --- js/task-history.js --- */
/**
 * 미뤄진 일정은 rootTaskId만으로 묶지 않고 rescheduledFromTaskId 계보로 추적한다.
 * 일부 완료로 같은 root를 공유하는 별도 분량이 잘못 삭제되는 일을 막기 위함이다.
 */
function descendantTaskIds(tasks, sourceTaskId) {
  const descendants = new Set();
  const queue = [sourceTaskId];
  while (queue.length) {
    const parentId = queue.shift();
    tasks.forEach(task => {
      if (task.rescheduledFromTaskId === parentId && !descendants.has(task.id)) {
        descendants.add(task.id);
        queue.push(task.id);
      }
    });
  }
  return descendants;
}

function completeHistoricalTask(tasks, taskId, completedAt = new Date().toISOString()) {
  const source = tasks.find(task => task.id === taskId);
  if (!source || source.status !== 'rescheduled') {
    return { tasks, changed: false, reason: 'not-rescheduled' };
  }

  const descendants = descendantTaskIds(tasks, taskId);
  const completedDescendant = tasks.some(task => descendants.has(task.id) && task.status === 'completed');
  if (completedDescendant) {
    return { tasks, changed: false, reason: 'already-completed' };
  }

  const nextTasks = tasks
    .filter(task => !(descendants.has(task.id) && task.status === 'pending'))
    .map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'completed',
          completedLate: true,
          completedAt
        };
      }
      if (descendants.has(task.id) && task.status === 'rescheduled') {
        return { ...task, status: 'cancelled' };
      }
      return task;
    });

  return { tasks: nextTasks, changed: true, reason: 'completed' };
}


/* --- js/ics.js --- */
function icsLocalDateTime(date, time) { return `${String(date).replaceAll('-', '')}T${String(time).replace(':', '')}00`; }
function icsUtcStamp(date = new Date()) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

function icsEscape(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function createIcsExport(tasks, planName = 'STUNO 학습 계획', now = new Date()) {
  const exportable = (Array.isArray(tasks) ? tasks : []).filter(task => task.status === 'pending' && task.scheduledDate && task.startTime && task.endTime);
  const calendarName = String(planName || 'STUNO 학습 계획').trim() || 'STUNO 학습 계획';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//STUNO//Study Note//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-TIMEZONE:Asia/Seoul', `X-WR-CALNAME:${icsEscape(calendarName)}`];
  exportable.forEach(task => lines.push(
    'BEGIN:VEVENT', `UID:${icsEscape(task.id)}@stuno`, `DTSTAMP:${icsUtcStamp(now)}`,
    `DTSTART;TZID=Asia/Seoul:${icsLocalDateTime(task.scheduledDate, task.startTime)}`,
    `DTEND;TZID=Asia/Seoul:${icsLocalDateTime(task.scheduledDate, task.endTime)}`,
    `SUMMARY:${icsEscape(`[${task.subjectName || '공부'}] ${task.title || '학습'}`)}`,
    `DESCRIPTION:${icsEscape(`자료: ${task.material || '-'}\n범위: ${task.detail || '-'}\n완료 기준: ${task.completion || '-'}`)}`,
    'STATUS:CONFIRMED', 'END:VEVENT'
  ));
  lines.push('END:VCALENDAR');
  return { content: lines.join('\r\n'), filename: `${safeFileName(calendarName)}-stuno.ics`, count: exportable.length };
}


/* --- app.js --- */
let state = loadState();
let currentRoute = '';
let currentWeekStart = startOfWeek(todayLocal());
let hydrating = true;
let partialTaskId = null;
let focusTaskId = null;
let focusSeconds = 0;
let focusInitialSeconds = 0;
let focusTimerId = null;
let focusEndsAt = 0;
let undoSnapshot = null;
let toastActionCallback = null;
let promotionSuggestedGrade = null;
let suppressPersistence = false;
let taskDisplayLimit = 60;
let googleSyncInFlight = false;

const saveDebounced = debounce(() => persistStateNow(), 450);
const renderTaskSearchDebounced = debounce(() => resetTaskListAndRender(), 140);
const googleAutoSyncDebounced = debounce(() => {
  if (state.calendar?.autoSync && googleIsConnected() && !googleSyncInFlight) syncWithGoogle({ silent: true });
}, 1600);

function persistStateNow() {
  if (suppressPersistence) return state;
  state = saveState(state);
  setSaveStatus('saved');
  return state;
}

window.addEventListener('DOMContentLoaded', init);

function init() {
  applyAppTheme(loadTheme());
  hydrateGradeSelectors();
  ensureInitialSubject();
  recoverOverdueTasks();
  hydrateSettings();
  renderSubjects();
  renderRangeSubjects();
  renderSchedules();
  hydrateCalendarSettings();
  bindEvents();
  hydrating = false;
  syncSettings({ markDirty: false, save: false });
  resolveInitialRoute();
  window.setTimeout(maybePromptGradePromotion, 250);
  registerServiceWorker();
  window.setInterval(() => recoverOverdueTasks({ refresh: true }), 300_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      recoverOverdueTasks({ refresh: true });
      maybePromptGradePromotion();
    } else {
      persistStateNow();
    }
  });
}

// ---------- 상태와 자동 저장 ----------

function ensureInitialSubject() {
  if (state.subjects.length) return;
  state.subjects.push({
    ...DEFAULT_SUBJECT,
    id: uid('subject'),
    examDate: state.settings.examStartDate
  });
}

function syncSettings({ markDirty = false, save = true } = {}) {
  state.settings = collectSettings();
  if (markDirty && state.tasks.length) state.isPlanStale = true;
  if (save) {
    setSaveStatus('saving');
    saveDebounced();
  }
}

function setSaveStatus(status) {
  const dot = $('.save-dot');
  const label = $('#saveStatus');
  dot?.classList.toggle('saving', status === 'saving');
  if (label) {
    if (!isPersistentStorageAvailable()) label.textContent = '현재 탭에 임시 저장';
    else if (!navigator.onLine) label.textContent = status === 'saving' ? '오프라인 저장 중…' : '오프라인 · 이 기기에 저장됨';
    else label.textContent = status === 'saving' ? '저장 중…' : '이 기기에 저장됨';
  }
}

function hydrateGradeSelectors() {
  const markup = gradeOptionsMarkup(state.settings.grade);
  const setupSelect = $('#grade');
  const settingsSelect = $('#settingsGrade');
  if (setupSelect) setupSelect.innerHTML = markup;
  if (settingsSelect) settingsSelect.innerHTML = markup;
}

function hydrateSettings() {
  const ids = [
    'planName', 'grade', 'studyStartDate', 'examStartDate', 'examEndDate',
    'weekdayTarget', 'weekendTarget', 'weekdayMax', 'weekendMax',
    'weekdayStart', 'weekdayEnd', 'weekdayWake', 'weekendStart', 'weekendEnd', 'weekendWake',
    'sessionLength', 'breakLength', 'minSleep', 'planStyle'
  ];
  ids.forEach(id => {
    const element = $(`#${id}`);
    if (element && state.settings[id] != null) element.value = state.settings[id];
  });
}

function collectSettings() {
  return {
    planName: $('#planName').value.trim(),
    grade: normalizeGrade($('#grade').value),
    studyStartDate: $('#studyStartDate').value,
    examStartDate: $('#examStartDate').value,
    examEndDate: $('#examEndDate').value,
    weekdayTarget: safeNumber($('#weekdayTarget').value, 150),
    weekendTarget: safeNumber($('#weekendTarget').value, 300),
    weekdayMax: safeNumber($('#weekdayMax').value, 210),
    weekendMax: safeNumber($('#weekendMax').value, 420),
    weekdayStart: $('#weekdayStart').value,
    weekdayEnd: $('#weekdayEnd').value,
    weekdayWake: $('#weekdayWake').value,
    weekendStart: $('#weekendStart').value,
    weekendEnd: $('#weekendEnd').value,
    weekendWake: $('#weekendWake').value,
    sessionLength: safeNumber($('#sessionLength').value, 40),
    breakLength: safeNumber($('#breakLength').value, 10),
    minSleep: safeNumber($('#minSleep').value, 8),
    planStyle: $('#planStyle').value
  };
}

// ---------- 시작 화면과 프로필 ----------

function renderWelcomePage() {
  const started = Boolean(state.profile?.started);
  const continueButton = $('#welcomeContinueButton');
  const startButton = $('#welcomeStartButton');
  if (continueButton) {
    continueButton.hidden = !started;
    continueButton.textContent = state.tasks.length ? '오늘 공부 이어서 보기' : '작성 중인 설정 이어가기';
  }
  if (startButton) startButton.textContent = started ? '설정 처음부터 살펴보기' : '시작하기';
}

function startWelcome() {
  state.profile = { ...(state.profile || {}), started: true, academicYear: Number(state.profile?.academicYear || currentAcademicYear()) };
  persistStateNow();
  navigate('setup/basic');
}

function continueWelcome() {
  if (!state.profile?.started) return startWelcome();
  navigate(state.tasks.length ? 'dashboard/today' : 'setup/basic');
}

function suggestedGradeForElapsedYears(grade, years) {
  let suggested = normalizeGrade(grade);
  for (let count = 0; count < Math.max(1, years); count += 1) {
    const candidate = nextGrade(suggested);
    if (!candidate) break;
    suggested = candidate;
    if (suggested === 'none') break;
  }
  return suggested;
}

function maybePromptGradePromotion() {
  if (!state.profile?.started || !shouldAskGradePromotion(state.profile, state.settings.grade)) return;
  const dialog = $('#gradePromotionDialog');
  if (!dialog || dialog.open) return;
  const year = currentAcademicYear();
  const elapsed = Math.max(1, year - Number(state.profile.academicYear || year));
  promotionSuggestedGrade = suggestedGradeForElapsedYears(state.settings.grade, elapsed);
  if (!promotionSuggestedGrade || promotionSuggestedGrade === normalizeGrade(state.settings.grade)) return;
  $('#gradePromotionMessage').textContent = `${state.profile.academicYear}년에 저장한 학년 정보가 있습니다. 현재 학년으로 올릴까요?`;
  $('#gradePromotionFrom').textContent = gradeLabel(state.settings.grade);
  $('#gradePromotionTo').textContent = gradeLabel(promotionSuggestedGrade);
  dialog.showModal();
}

function finishGradePrompt() {
  state.profile.academicYear = currentAcademicYear();
  state.profile.lastGradePromptYear = currentAcademicYear();
  persistStateNow();
  const dialog = $('#gradePromotionDialog');
  if (dialog?.open) dialog.close();
  promotionSuggestedGrade = null;
}

function promoteGrade() {
  if (!promotionSuggestedGrade) return finishGradePrompt();
  state.settings.grade = promotionSuggestedGrade;
  const setupGrade = $('#grade');
  const settingsGrade = $('#settingsGrade');
  if (setupGrade) setupGrade.value = promotionSuggestedGrade;
  if (settingsGrade) settingsGrade.value = promotionSuggestedGrade;
  finishGradePrompt();
  if (currentRoute === 'dashboard/settings') renderSettingsPage();
  showToast(`${gradeLabel(state.settings.grade)}으로 변경했습니다.`);
}

function keepCurrentGrade() {
  finishGradePrompt();
  showToast('현재 학년을 그대로 유지했습니다. 설정에서 언제든 바꿀 수 있습니다.');
}

function renderSettingsPage() {
  const gradeSelect = $('#settingsGrade');
  if (gradeSelect) {
    gradeSelect.innerHTML = gradeOptionsMarkup(state.settings.grade);
    gradeSelect.value = normalizeGrade(state.settings.grade);
  }
  const storageStatus = $('#storageSettingsStatus');
  if (storageStatus) {
    const bytes = new Blob([JSON.stringify(state)]).size;
    const sizeLabel = bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`;
    storageStatus.innerHTML = isPersistentStorageAvailable()
      ? `<strong>자동 저장 사용 중</strong><br>마지막 저장 ${new Date(state.updatedAt).toLocaleString('ko-KR')} · 데이터 ${sizeLabel}`
      : '<strong>현재 탭에만 임시 저장 중</strong><br>브라우저 저장소 접근이 차단되어 페이지를 닫으면 기록이 사라질 수 있습니다.';
  }
  const generatedInfo = $('#planGeneratedInfo');
  if (generatedInfo) generatedInfo.textContent = state.generatedAt
    ? `현재 계획 생성: ${new Date(state.generatedAt).toLocaleString('ko-KR')} · 일정 ${state.tasks.filter(task => task.status !== 'cancelled').length}개`
    : '아직 생성된 학습 계획이 없습니다.';
  setTheme(document.documentElement.dataset.theme || loadTheme(), { persist: false });
}

function saveProfileSettings() {
  const gradeSelect = $('#settingsGrade');
  if (!gradeSelect) return;
  const grade = normalizeGrade(gradeSelect.value);
  state.settings.grade = grade;
  state.profile.academicYear = currentAcademicYear();
  state.profile.lastGradePromptYear = currentAcademicYear();
  const setupGrade = $('#grade');
  if (setupGrade) setupGrade.value = grade;
  persistStateNow();
  showToast(`${gradeLabel(grade)}으로 저장했습니다.`);
}

// ---------- 라우팅 ----------

function routeFromHash() {
  return location.hash.replace(/^#\/?/, '');
}

function navigate(route, { replace = false } = {}) {
  if (!ROUTES.includes(route)) return;
  const hash = `#/${route}`;
  if (replace) {
    history.replaceState(null, '', hash);
    renderRoute(route);
  } else if (location.hash !== hash) {
    location.hash = hash;
  } else {
    renderRoute(route);
  }
}

function resolveInitialRoute() {
  const requested = routeFromHash();
  const fallback = !state.profile?.started ? 'welcome' : (state.tasks.length ? 'dashboard/today' : 'setup/basic');
  if (!requested || !ROUTES.includes(requested) || (DASHBOARD_ROUTES.includes(requested) && !state.tasks.length)) {
    navigate(fallback, { replace: true });
  } else {
    renderRoute(requested);
  }
}

function canNavigateTo(target) {
  if (DASHBOARD_ROUTES.includes(target) && !state.tasks.length) {
    showToast('먼저 학습 계획을 만들어 주세요.');
    return false;
  }
  if (!SETUP_ROUTES.includes(target) || !SETUP_ROUTES.includes(currentRoute)) return true;
  const currentIndex = SETUP_ROUTES.indexOf(currentRoute);
  const targetIndex = SETUP_ROUTES.indexOf(target);
  if (targetIndex <= currentIndex) return true;
  for (let index = currentIndex; index < targetIndex; index += 1) {
    if (!validateRoute(SETUP_ROUTES[index])) return false;
  }
  return true;
}

function renderRoute(route) {
  if (!ROUTES.includes(route)) return resolveInitialRoute();
  if (DASHBOARD_ROUTES.includes(route) && !state.tasks.length) {
    navigate('setup/basic', { replace: true });
    return;
  }

  currentRoute = route;
  $$('.page[data-route-page]').forEach(page => { page.hidden = page.dataset.routePage !== route; });

  const isWelcome = route === 'welcome';
  const isSetup = SETUP_ROUTES.includes(route);
  const isDashboard = DASHBOARD_ROUTES.includes(route);
  $('#setupSidebar').hidden = !isSetup;
  const setupReturnButton = $('#setupBackToDashboardButton');
  if (setupReturnButton) setupReturnButton.hidden = !(isSetup && state.tasks.length);
  $('#dashboardSidebar').hidden = !isDashboard;
  $('#mobileDashboardNav').hidden = !isDashboard;
  $('#pageContent').classList.toggle('welcome-mode', isWelcome);
  $$('[data-route-link]').forEach(link => {
    const active = link.dataset.routeLink === route;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (isDashboard && window.matchMedia('(max-width: 760px)').matches) {
    const activeMobileLink = $(`#mobileDashboardNav [data-route-link="${cssEscape(route)}"]`);
    window.requestAnimationFrame(() => activeMobileLink?.scrollIntoView({ block: 'nearest', inline: 'center' }));
  }

  if (isWelcome) {
    renderWelcomePage();
  } else if (isSetup) {
    updateSetupNavigation(route);
    if (route === 'setup/dates') renderPeriodPreview();
    if (route === 'setup/sleep') renderSleepPreview();
    if (route === 'setup/subjects') renderSubjects();
    if (route === 'setup/ranges') renderRangeSubjects();
    if (route === 'setup/schedule') renderScheduleConflicts();
    if (route === 'setup/review') {
      syncSettings({ markDirty: false, save: true });
      renderReviewPage();
    }
  } else {
    renderDashboardShell();
    renderCurrentDashboardPage();
  }

  document.title = pageTitleForRoute(route);
  const page = $(`.page[data-route-page="${cssEscape(route)}"]`);
  const heading = page?.querySelector('h1');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  } else {
    $('#pageContent').focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function pageTitleForRoute(route) {
  const titles = {
    'welcome': '시작',
    'setup/basic': '기본 정보',
    'setup/dates': '시험 날짜',
    'setup/amount': '공부 분량',
    'setup/hours': '공부 시간대',
    'setup/sleep': '수면 보호',
    'setup/subjects': '시험 과목',
    'setup/ranges': '시험 범위',
    'setup/schedule': '고정 일정',
    'setup/method': '공부 방식',
    'setup/review': '최종 확인',
    'dashboard/today': '오늘 공부',
    'dashboard/week': '주간 계획',
    'dashboard/history': '지난 기록',
    'dashboard/subjects': '과목 노트',
    'dashboard/tasks': '전체 일정',
    'dashboard/sync': '캘린더 연동',
    'dashboard/settings': '설정'
  };
  return `${titles[route] || 'STUNO'} · STUNO`;
}

function updateSetupNavigation(route) {
  const index = SETUP_ROUTES.indexOf(route);
  $('#setupProgressText').textContent = `${index + 1} / ${SETUP_ROUTES.length}`;
  const progressBar = $('#setupProgressBar');
  if (progressBar) progressBar.style.width = `${Math.round((index + 1) / SETUP_ROUTES.length * 100)}%`;
  $$('.step-nav a').forEach((link, linkIndex) => link.classList.toggle('completed', linkIndex < index));
}

// ---------- 이벤트 ----------

function bindElement(id, eventName, handler) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`[STUNO] 이벤트 대상이 없습니다: #${id}`);
    return null;
  }
  element.addEventListener(eventName, handler);
  return element;
}

function bindEvents() {
  window.addEventListener('hashchange', () => renderRoute(routeFromHash()));
  window.addEventListener('pagehide', () => {
    if (!suppressPersistence) persistStateNow();
  });
  window.addEventListener('online', () => setSaveStatus('saved'));
  window.addEventListener('offline', () => setSaveStatus('saved'));
  document.body.addEventListener('click', handleDelegatedClick);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAllTaskMenus();
  });

  const form = bindElement('plannerForm', 'input', handleFormInput);
  if (form) form.addEventListener('change', handleFormInput);

  bindElement('welcomeStartButton', 'click', startWelcome);
  bindElement('welcomeContinueButton', 'click', continueWelcome);
  bindElement('addSubjectButton', 'click', addSubject);
  bindElement('addScheduleButton', 'click', addSchedule);
  bindElement('generatePlanButton', 'click', generatePlan);
  bindElement('themeToggle', 'click', toggleTheme);
  bindElement('settingsResetButton', 'click', resetAll);
  bindElement('saveProfileSettingsButton', 'click', saveProfileSettings);
  bindElement('exportDataButton', 'click', exportDataBackup);
  bindElement('importDataButton', 'click', () => $('#dataImportInput')?.click());
  bindElement('dataImportInput', 'change', importDataBackup);
  bindElement('editPlanButton', 'click', () => navigate('setup/basic'));
  bindElement('setupBackToDashboardButton', 'click', () => {
    persistStateNow();
    navigate('dashboard/today');
  });
  bindElement('exportIcsButton', 'click', exportICS);
  bindElement('quickRebalanceButton', 'click', () => rebalanceTasks(true));
  bindElement('rebalanceButton', 'click', () => rebalanceTasks(true));

  bindElement('prevWeekButton', 'click', () => { currentWeekStart = addDays(currentWeekStart, -7); renderWeekPage(); });
  bindElement('nextWeekButton', 'click', () => { currentWeekStart = addDays(currentWeekStart, 7); renderWeekPage(); });
  bindElement('todayWeekButton', 'click', () => { currentWeekStart = startOfWeek(todayLocal()); renderWeekPage(); });

  bindElement('taskSearch', 'input', renderTaskSearchDebounced);
  bindElement('subjectFilter', 'change', resetTaskListAndRender);
  bindElement('taskFilter', 'change', resetTaskListAndRender);
  bindElement('loadMoreTasksButton', 'click', () => { taskDisplayLimit += 60; renderTasksPage(); });

  bindElement('partialRange', 'input', updatePartialDialogLabels);
  bindElement('confirmPartialButton', 'click', confirmPartialCompletion);
  bindElement('partialDialog', 'close', () => { partialTaskId = null; });

  bindElement('focusToggleButton', 'click', toggleFocusTimer);
  bindElement('focusResetButton', 'click', resetFocusTimer);
  bindElement('closeFocusButton', 'click', closeFocusDialog);
  bindElement('focusDialog', 'close', pauseFocusTimer);

  bindElement('googleClientId', 'input', () => {
    if (getConfiguredGoogleClientId()) return;
    const value = $('#googleClientId').value.trim();
    state.calendar.clientId = value;
    $('#googleClientId').setAttribute('aria-invalid', value && !isValidGoogleClientId(value) ? 'true' : 'false');
    setSaveStatus('saving');
    saveDebounced();
    renderSyncControlsOnly();
  });
  bindElement('googleConnectButton', 'click', connectGoogle);
  bindElement('googleDisconnectButton', 'click', disconnectGoogle);
  bindElement('googleSyncButton', 'click', () => syncWithGoogle());
  bindElement('googleAutoSync', 'change', event => {
    state.calendar.autoSync = Boolean(event.currentTarget.checked);
    persistStateNow();
    if (state.calendar.autoSync && googleIsConnected()) googleAutoSyncDebounced();
    renderSyncPage();
  });
  bindElement('googleCopyOriginButton', 'click', async () => {
    const origin = googleOAuthEnvironment().origin;
    try {
      await navigator.clipboard.writeText(origin);
      showToast('승인된 JavaScript 원본을 복사했습니다.');
    } catch {
      showToast(`Google Cloud에 이 원본을 등록하세요: ${origin}`);
    }
  });

  bindElement('promoteGradeButton', 'click', promoteGrade);
  bindElement('keepGradeButton', 'click', keepCurrentGrade);

  bindElement('toastAction', 'click', () => {
    if (toastActionCallback) toastActionCallback();
    hideToast();
  });
}

function handleDelegatedClick(event) {
  const routeLink = event.target.closest('[data-route-link]');
  if (routeLink) {
    event.preventDefault();
    const target = routeLink.dataset.routeLink;
    if (canNavigateTo(target)) {
      if (SETUP_ROUTES.includes(currentRoute)) persistStateNow();
      navigate(target);
    }
    return;
  }

  const nextButton = event.target.closest('[data-next-route]');
  if (nextButton) {
    const target = nextButton.dataset.nextRoute;
    if (validateRoute(currentRoute)) {
      persistStateNow();
      navigate(target);
    }
    return;
  }

  const previousButton = event.target.closest('[data-prev-route]');
  if (previousButton) {
    syncSettings({ markDirty: false, save: false });
    persistStateNow();
    navigate(previousButton.dataset.prevRoute);
    return;
  }

  const presetButton = event.target.closest('[data-time-preset]');
  if (presetButton) {
    applyTimePreset(presetButton.dataset.timePreset);
    return;
  }

  const themeChoice = event.target.closest('[data-theme-choice]');
  if (themeChoice) {
    setTheme(themeChoice.dataset.themeChoice);
    renderSettingsPage();
    return;
  }

  const duplicateButton = event.target.closest('.subject-duplicate');
  if (duplicateButton) {
    duplicateSubject(duplicateButton.closest('.subject-card'));
    return;
  }

  const removeSubjectButton = event.target.closest('.remove-subject');
  if (removeSubjectButton) {
    removeSubject(removeSubjectButton.closest('.subject-card'));
    return;
  }

  const rangeToggle = event.target.closest('.range-card-toggle');
  if (rangeToggle) {
    const body = $('.range-card-body', rangeToggle.closest('.range-subject-card'));
    const expanded = rangeToggle.getAttribute('aria-expanded') !== 'true';
    rangeToggle.setAttribute('aria-expanded', String(expanded));
    body.hidden = !expanded;
    return;
  }

  const removeScheduleButton = event.target.closest('.remove-schedule');
  if (removeScheduleButton) {
    removeSchedule(removeScheduleButton.closest('.schedule-item'));
    return;
  }

  const taskMenuButton = event.target.closest('[data-task-menu]');
  if (taskMenuButton) {
    toggleTaskMenu(taskMenuButton);
    return;
  }

  const taskAction = event.target.closest('[data-task-action]');
  if (taskAction) {
    closeAllTaskMenus();
    handleTaskAction(taskAction.dataset.taskId, taskAction.dataset.taskAction);
    return;
  }

  const partialValue = event.target.closest('[data-partial-value]');
  if (partialValue) {
    $('#partialRange').value = partialValue.dataset.partialValue;
    updatePartialDialogLabels();
    return;
  }

  const focusResult = event.target.closest('[data-focus-result]');
  if (focusResult) {
    const task = state.tasks.find(item => item.id === focusTaskId);
    if (!task) return;
    closeFocusDialog();
    handleTaskAction(task.id, focusResult.dataset.focusResult === 'postpone' ? 'postpone' : focusResult.dataset.focusResult);
    return;
  }

  if (!event.target.closest('.task-inline-menu')) closeAllTaskMenus();
}

function handleFormInput(event) {
  if (hydrating) return;
  const subjectCard = event.target.closest('.subject-card');
  if (subjectCard) updateSubjectFromCard(subjectCard);
  const rangeCard = event.target.closest('.range-subject-card');
  if (rangeCard) updateSubjectFromRangeCard(rangeCard);
  if (event.target.closest('.schedule-item')) syncSchedulesFromDOM();
  if (['studyStartDate', 'examStartDate', 'examEndDate'].includes(event.target.id)) renderPeriodPreview();
  if (['weekdayStart', 'weekdayEnd', 'weekdayWake', 'weekendStart', 'weekendEnd', 'weekendWake', 'minSleep'].includes(event.target.id)) renderSleepPreview();
  syncSettings({ markDirty: true, save: true });
}

// ---------- 단계별 검증 ----------

function validateRoute(route) {
  clearInvalidFields();
  syncSettings({ markDirty: false, save: false });

  if (route === 'setup/basic') {
    if (!$('#planName').value.trim()) return validationFailure($('#planName'), '계획 이름을 입력해 주세요.');
  }

  if (route === 'setup/dates') {
    const required = [$('#studyStartDate'), $('#examStartDate'), $('#examEndDate')];
    const empty = required.find(input => !input.value);
    if (empty) return validationFailure(empty, '날짜를 모두 입력해 주세요.');
    const studyStart = parseDate($('#studyStartDate').value);
    const examStart = parseDate($('#examStartDate').value);
    const examEnd = parseDate($('#examEndDate').value);
    if (examStart < studyStart) return validationFailure($('#examStartDate'), '시험 시작일은 공부 시작일보다 늦어야 합니다.');
    if (examEnd < examStart) return validationFailure($('#examEndDate'), '시험 종료일을 다시 확인해 주세요.');
  }

  if (route === 'setup/amount') {
    if (safeNumber($('#weekdayMax').value) < safeNumber($('#weekdayTarget').value)) return validationFailure($('#weekdayMax'), '평일 최대 시간은 목표 시간보다 짧을 수 없습니다.');
    if (safeNumber($('#weekendMax').value) < safeNumber($('#weekendTarget').value)) return validationFailure($('#weekendMax'), '주말 최대 시간은 목표 시간보다 짧을 수 없습니다.');
  }

  if (route === 'setup/hours') {
    const requiredTimeInputs = [$('#weekdayStart'), $('#weekdayEnd'), $('#weekendStart'), $('#weekendEnd')];
    const missingTimeInput = requiredTimeInputs.find(input => !input.value);
    if (missingTimeInput) return validationFailure(missingTimeInput, '평일과 주말 공부 시간대를 모두 입력해 주세요.');
    if (timeToMinutes($('#weekdayEnd').value) <= timeToMinutes($('#weekdayStart').value)) return validationFailure($('#weekdayEnd'), '평일 종료 시간을 다시 확인해 주세요.');
    if (timeToMinutes($('#weekendEnd').value) <= timeToMinutes($('#weekendStart').value)) return validationFailure($('#weekendEnd'), '주말 종료 시간을 다시 확인해 주세요.');
  }

  if (route === 'setup/sleep') {
    const requiredWakeInputs = [$('#weekdayWake'), $('#weekendWake')];
    const missingWakeInput = requiredWakeInputs.find(input => !input.value);
    if (missingWakeInput) return validationFailure(missingWakeInput, '평일과 주말 기상시간을 모두 입력해 주세요.');
    const minimumSleep = safeNumber($('#minSleep').value, 0);
    if (minimumSleep < 7 || minimumSleep > 10) return validationFailure($('#minSleep'), '최소 수면시간은 7시간부터 10시간 사이로 입력해 주세요.');
    const weekdayWindow = effectiveStudyWindow(state.settings, false);
    const weekendWindow = effectiveStudyWindow(state.settings, true);
    if (weekdayWindow.end <= weekdayWindow.start) return validationFailure($('#weekdayWake'), '평일 수면시간을 지키면 공부할 시간이 남지 않습니다. 시간대를 조정해 주세요.');
    if (weekendWindow.end <= weekendWindow.start) return validationFailure($('#weekendWake'), '주말 수면시간을 지키면 공부할 시간이 남지 않습니다. 시간대를 조정해 주세요.');
    if (safeNumber(state.settings.weekdayTarget) > weekdayWindow.end - weekdayWindow.start) return validationFailure($('#weekdayWake'), '평일 목표 공부시간이 수면을 제외한 공부 가능 시간보다 깁니다.');
    if (safeNumber(state.settings.weekendTarget) > weekendWindow.end - weekendWindow.start) return validationFailure($('#weekendWake'), '주말 목표 공부시간이 수면을 제외한 공부 가능 시간보다 깁니다.');
  }

  if (route === 'setup/subjects') {
    if (!state.subjects.length) {
      showToast('최소 한 과목을 추가해 주세요.');
      return false;
    }
    for (const subject of state.subjects) {
      const card = $(`.subject-card[data-subject-id="${cssEscape(subject.id)}"]`);
      const nameInput = $('.subject-name', card);
      const dateInput = $('.subject-exam-date', card);
      if (!subject.name.trim()) return validationFailure(nameInput, '모든 과목의 이름을 입력해 주세요.');
      if (!subject.examDate) return validationFailure(dateInput, '모든 과목의 시험 날짜를 입력해 주세요.');
      const examDate = parseDate(subject.examDate);
      if (examDate < parseDate(state.settings.examStartDate) || examDate > parseDate(state.settings.examEndDate)) {
        return validationFailure(dateInput, `${subject.name} 시험 날짜를 전체 시험기간 안으로 설정해 주세요.`);
      }
      const scoreInput = $('.subject-score', card);
      const targetInput = $('.subject-target-score', card);
      if (subject.score != null && (subject.score < 0 || subject.score > 100)) return validationFailure(scoreInput, '이전 성적은 0점부터 100점 사이로 입력해 주세요.');
      if (subject.targetScore < 0 || subject.targetScore > 100) return validationFailure(targetInput, '목표 성적은 0점부터 100점 사이로 입력해 주세요.');
    }
  }

  if (route === 'setup/ranges') {
    const invalid = state.subjects.find(subject => !subject.units || subject.units < 1);
    if (invalid) {
      const card = $(`.range-subject-card[data-subject-id="${cssEscape(invalid.id)}"]`);
      const input = $('.subject-units', card);
      $('.range-card-toggle', card).setAttribute('aria-expanded', 'true');
      $('.range-card-body', card).hidden = false;
      return validationFailure(input, `${invalid.name}의 시험 범위량을 입력해 주세요.`);
    }
  }

  if (route === 'setup/schedule') {
    for (const row of $$('.schedule-item')) {
      const start = $('.schedule-start', row);
      const end = $('.schedule-end', row);
      if (timeToMinutes(end.value) <= timeToMinutes(start.value)) return validationFailure(end, '고정 일정의 종료 시간을 다시 확인해 주세요.');
    }
    const conflicts = detectScheduleConflicts(state.schedules);
    if (conflicts.length) {
      showToast(`겹치는 고정 일정을 먼저 정리해 주세요. ${conflicts[0]}`);
      $('#scheduleConflictAlert')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
  }

  return true;
}

function validateAllSetup() {
  return SETUP_ROUTES.slice(0, -1).every(validateRoute);
}

function clearInvalidFields() {
  $$('[aria-invalid="true"]').forEach(element => element.removeAttribute('aria-invalid'));
}

function validationFailure(element, message) {
  if (element) {
    element.setAttribute('aria-invalid', 'true');
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  showToast(message);
  return false;
}

// ---------- 날짜와 공부시간 ----------

function renderPeriodPreview() {
  const preview = $('#periodPreview');
  if (!preview) return;
  const start = parseDate($('#studyStartDate').value);
  const examStart = parseDate($('#examStartDate').value);
  const end = parseDate($('#examEndDate').value);
  if (!start || !examStart || !end) {
    preview.textContent = '날짜를 정하면 준비 기간을 계산합니다.';
    return;
  }
  const preparationDays = Math.max(0, daysBetween(start, examStart));
  const examDays = Math.max(1, daysBetween(examStart, end) + 1);
  preview.innerHTML = `<strong>${preparationDays}일 동안 준비</strong>하고, 시험은 <strong>${examDays}일간</strong> 진행됩니다.`;
}


function renderSleepPreview() {
  const preview = $('#sleepWindowPreview');
  if (!preview) return;
  const currentSettings = collectSettings();
  const weekday = effectiveStudyWindow(currentSettings, false);
  const weekend = effectiveStudyWindow(currentSettings, true);
  const weekdayEnd = minutesToTime(weekday.end);
  const weekendEnd = minutesToTime(weekend.end);
  const notes = [
    `평일 계획 종료 ${weekdayEnd}${weekday.limitedBySleep ? ' · 수면시간 기준으로 앞당김' : ''}`,
    `주말 계획 종료 ${weekendEnd}${weekend.limitedBySleep ? ' · 수면시간 기준으로 앞당김' : ''}`
  ];
  preview.innerHTML = `<strong>수면 보호 적용</strong><span>${notes.join('<br>')}</span>`;
}

function applyTimePreset(name) {
  const preset = TIME_PRESETS[name];
  if (!preset) return;
  Object.entries(preset).forEach(([id, value]) => { $(`#${id}`).value = value; });
  $$('[data-time-preset]').forEach(button => button.classList.toggle('active', button.dataset.timePreset === name));
  syncSettings({ markDirty: true, save: true });
}

// ---------- 과목 입력 ----------

function renderSubjects() {
  const container = $('#subjectsContainer');
  container.innerHTML = '';
  state.subjects.forEach((subject, index) => appendSubjectCard(subject, index));
}

function appendSubjectCard(subject, index) {
  const fragment = $('#subjectTemplate').content.cloneNode(true);
  const card = $('.subject-card', fragment);
  card.dataset.subjectId = subject.id;
  $('.subject-number', card).textContent = String(index + 1);
  $('.subject-name', card).value = subject.name || '';
  $('.subject-exam-date', card).value = subject.examDate || state.settings.examStartDate;
  $('.subject-score', card).value = subject.score ?? '';
  $('.subject-target-score', card).value = subject.targetScore ?? 80;
  updateSubjectCardBadge(card, subject);
  $('#subjectsContainer').appendChild(fragment);
}

function updateSubjectCardBadge(card, subject) {
  const badge = $('.subject-risk-badge', card);
  const risk = riskLevel(subject);
  badge.textContent = subject.name ? risk.label : '입력 중';
  badge.className = `subject-risk-badge ${subject.name ? risk.key : ''}`;
}

function updateSubjectFromCard(card) {
  const subject = state.subjects.find(item => item.id === card.dataset.subjectId);
  if (!subject) return;
  subject.name = $('.subject-name', card).value.trim();
  subject.examDate = $('.subject-exam-date', card).value;
  subject.score = nullableNumber($('.subject-score', card).value);
  subject.targetScore = safeNumber($('.subject-target-score', card).value, 80);
  updateSubjectCardBadge(card, subject);
  syncSubjectToRangeCard(subject);
}

function addSubject() {
  const subject = { ...DEFAULT_SUBJECT, id: uid('subject'), examDate: state.settings.examStartDate };
  state.subjects.push(subject);
  renderSubjects();
  renderRangeSubjects();
  state.isPlanStale = Boolean(state.tasks.length);
  state = saveState(state);
  const card = $(`.subject-card[data-subject-id="${cssEscape(subject.id)}"]`);
  $('.subject-name', card)?.focus();
  card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function duplicateSubject(card) {
  updateSubjectFromCard(card);
  const source = state.subjects.find(item => item.id === card.dataset.subjectId);
  if (!source) return;
  const copy = { ...source, id: uid('subject'), name: source.name ? `${source.name} 복사` : '' };
  state.subjects.push(copy);
  renderSubjects();
  renderRangeSubjects();
  state.isPlanStale = Boolean(state.tasks.length);
  state = saveState(state);
  showToast('과목을 복제했습니다.');
}

function removeSubject(card) {
  if (state.subjects.length <= 1) {
    showToast('최소 한 과목은 남겨 두어야 합니다.');
    return;
  }
  const subject = state.subjects.find(item => item.id === card.dataset.subjectId);
  if (subject?.name && !confirm(`${subject.name} 과목을 삭제할까요?`)) return;
  state.subjects = state.subjects.filter(item => item.id !== card.dataset.subjectId);
  renderSubjects();
  renderRangeSubjects();
  state.isPlanStale = Boolean(state.tasks.length);
  state = saveState(state);
}

function syncSubjectToRangeCard(subject) {
  const card = $(`.range-subject-card[data-subject-id="${cssEscape(subject.id)}"]`);
  if (!card) return;
  $('.range-subject-name', card).textContent = subject.name || '이름 없는 과목';
  $('.range-subject-summary', card).textContent = subject.range || `${subject.units}${UNIT_LABELS[subject.unitType] || '단위'} · ${subject.material}`;
  $('.range-estimate', card).textContent = `예상 ${formatMinutes(estimateSubjectMinutes(subject))}`;
}

function renderRangeSubjects({ preserveOpen = false } = {}) {
  const container = $('#rangeSubjectsContainer');
  const openIds = preserveOpen
    ? new Set($$('.range-subject-card').filter(card => $('.range-card-toggle', card).getAttribute('aria-expanded') === 'true').map(card => card.dataset.subjectId))
    : new Set();
  container.innerHTML = '';
  state.subjects.forEach((subject, index) => {
    const fragment = $('#rangeSubjectTemplate').content.cloneNode(true);
    const card = $('.range-subject-card', fragment);
    card.dataset.subjectId = subject.id;
    $('.range-subject-name', card).textContent = subject.name || `과목 ${index + 1}`;
    $('.range-subject-summary', card).textContent = subject.range || `${subject.units}${UNIT_LABELS[subject.unitType] || '단위'} · ${subject.material}`;
    $('.range-estimate', card).textContent = `예상 ${formatMinutes(estimateSubjectMinutes(subject))}`;
    $('.subject-confidence', card).value = subject.confidence;
    $('.subject-difficulty', card).value = subject.difficulty;
    $('.subject-units', card).value = subject.units;
    $('.subject-unit-type', card).value = subject.unitType;
    $('.subject-material', card).value = subject.material;
    $('.subject-range', card).value = subject.range || '';
    $('.subject-weakness', card).value = subject.weakness;
    const shouldOpen = openIds.has(subject.id) || (!preserveOpen && index === 0);
    $('.range-card-toggle', card).setAttribute('aria-expanded', String(shouldOpen));
    $('.range-card-body', card).hidden = !shouldOpen;
    container.appendChild(fragment);
  });
}

function updateSubjectFromRangeCard(card) {
  const subject = state.subjects.find(item => item.id === card.dataset.subjectId);
  if (!subject) return;
  subject.confidence = safeNumber($('.subject-confidence', card).value, 3);
  subject.difficulty = safeNumber($('.subject-difficulty', card).value, 2);
  subject.units = safeNumber($('.subject-units', card).value, 20);
  subject.unitType = $('.subject-unit-type', card).value;
  subject.material = $('.subject-material', card).value;
  subject.range = $('.subject-range', card).value.trim();
  subject.weakness = $('.subject-weakness', card).value;
  $('.range-subject-summary', card).textContent = subject.range || `${subject.units}${UNIT_LABELS[subject.unitType] || '단위'} · ${subject.material}`;
  $('.range-estimate', card).textContent = `예상 ${formatMinutes(estimateSubjectMinutes(subject))}`;
}

// ---------- 반복 일정 ----------

function renderSchedules() {
  const container = $('#schedulesContainer');
  container.innerHTML = '';
  state.schedules.forEach(schedule => appendScheduleRow(schedule));
  updateEmptyScheduleState();
  renderScheduleConflicts();
}

function appendScheduleRow(schedule) {
  const fragment = $('#scheduleTemplate').content.cloneNode(true);
  const row = $('.schedule-item', fragment);
  row.dataset.scheduleId = schedule.id || uid('schedule');
  $('.schedule-day', row).value = String(schedule.day ?? 1);
  $('.schedule-label', row).value = schedule.label || '';
  $('.schedule-start', row).value = schedule.start || '18:00';
  $('.schedule-end', row).value = schedule.end || '20:30';
  $('#schedulesContainer').appendChild(fragment);
}

function addSchedule() {
  state.schedules.push({ id: uid('schedule'), day: 1, label: '', start: '18:00', end: '20:30' });
  renderSchedules();
  state.isPlanStale = Boolean(state.tasks.length);
  state = saveState(state);
  const row = $('#schedulesContainer').lastElementChild;
  $('.schedule-label', row)?.focus();
}

function syncSchedulesFromDOM() {
  state.schedules = $$('.schedule-item').map(row => ({
    id: row.dataset.scheduleId,
    day: safeNumber($('.schedule-day', row).value, 1),
    label: $('.schedule-label', row).value.trim() || '고정 일정',
    start: $('.schedule-start', row).value,
    end: $('.schedule-end', row).value
  }));
  renderScheduleConflicts();
}

function removeSchedule(row) {
  state.schedules = state.schedules.filter(schedule => schedule.id !== row.dataset.scheduleId);
  renderSchedules();
  state.isPlanStale = Boolean(state.tasks.length);
  state = saveState(state);
}

function updateEmptyScheduleState() {
  $('#emptyScheduleState').hidden = state.schedules.length > 0;
}

function renderScheduleConflicts() {
  updateEmptyScheduleState();
  const conflicts = detectScheduleConflicts(state.schedules);
  const alert = $('#scheduleConflictAlert');
  alert.hidden = !conflicts.length;
  alert.textContent = conflicts.join(' ');
}

// ---------- 계획 확인과 생성 ----------

function renderReviewPage() {
  const available = estimateAvailableMinutes(state);
  const needed = state.subjects.reduce((sum, subject) => sum + estimateSubjectMinutes(subject), 0);
  const preparationDays = daysBetween(state.settings.studyStartDate, state.settings.examStartDate);
  const ratio = available ? Math.round(needed / available * 100) : 999;
  const conflicts = detectScheduleConflicts(state.schedules);
  const subjectRows = state.subjects.map(subject => {
    const risk = riskLevel(subject);
    return `<div class="review-subject-item"><span><strong>${escapeHTML(subject.name || '이름 없는 과목')}</strong><small>${escapeHTML(subject.range || `${subject.units}${UNIT_LABELS[subject.unitType]} 범위`)}</small></span><span>${formatDate(subject.examDate)}<br>${formatMinutes(estimateSubjectMinutes(subject))} · ${risk.label}</span></div>`;
  }).join('');

  const checks = [
    `<div class="review-check">${preparationDays}일의 준비 기간을 사용합니다.</div>`,
    `<div class="review-check">${state.subjects.length}개 과목을 작은 공부 단위로 나눕니다.</div>`,
    `<div class="review-check">지나간 미완료 일정은 기록을 남기고 다음 빈 시간으로 옮깁니다.</div>`,
    ...(conflicts.length ? ['<div class="review-check warning">고정 일정 시간이 일부 겹칩니다. 중복 구간은 한 번만 제외합니다.</div>'] : []),
    ...(ratio > 100 ? [`<div class="review-check warning">예상 필요시간이 기본 가용시간보다 ${ratio - 100}% 많습니다.</div>`] : [])
  ].join('');

  $('#reviewSummary').innerHTML = `
    <div class="review-main">
      <div class="review-metrics">
        <article class="review-metric"><span>준비 기간</span><strong>${preparationDays}일</strong><small>${formatDate(state.settings.studyStartDate)}부터</small></article>
        <article class="review-metric"><span>예상 필요시간</span><strong>${formatMinutes(needed)}</strong><small>성적·난이도·범위 반영</small></article>
        <article class="review-metric"><span>기본 가용시간</span><strong>${formatMinutes(available)}</strong><small>완충 시간 제외</small></article>
      </div>
      <article class="capacity-card"><header><h2>시간 충족도</h2><span>${ratio <= 100 ? `약 ${formatMinutes(available - needed)} 여유` : `약 ${formatMinutes(needed - available)} 부족`}</span></header><div class="capacity-bar ${ratio > 100 ? 'over' : ''}"><span style="width:${clamp(ratio, 0, 100)}%"></span></div><div class="capacity-labels"><span>필요 ${formatMinutes(needed)}</span><span>가용 ${formatMinutes(available)}</span></div></article>
      <article class="paper-section"><div class="panel-heading"><h2>과목별 예상 학습량</h2></div><div class="review-subject-list">${subjectRows}</div></article>
    </div>
    <aside class="review-side"><article class="paper-section"><div class="panel-heading"><h2>계획 적용 기준</h2></div><div class="review-checklist">${checks}</div></article><article class="memo-card yellow"><h2>입력 요약</h2><div class="mini-stat-list"><div class="mini-stat"><span>반복 일정</span><strong>${state.schedules.length}개</strong></div><div class="mini-stat"><span>세션 길이</span><strong>${state.settings.sessionLength}분</strong></div><div class="mini-stat"><span>우선순위</span><strong>${planStyleLabel(state.settings.planStyle)}</strong></div><div class="mini-stat"><span>최소 수면</span><strong>${state.settings.minSleep}시간</strong></div></div></article></aside>`;

  const overCapacity = needed > available;
  $('#generateBarTitle').textContent = overCapacity ? '최대 공부시간 일부를 사용해야 합니다.' : '현실적인 범위 안에서 계획을 만들 수 있습니다.';
  $('#generateBarDescription').textContent = overCapacity ? '그래도 배치하지 못한 분량은 생성 후 정확히 알려드립니다.' : '개념 → 문제 → 인출 → 복습 순서로 일정을 만듭니다.';
}

function planStyleLabel(style) {
  return ({ balanced: '균형형', score: '성적 향상형', deadline: '마감 우선형' })[style] || '균형형';
}

function generatePlan() {
  syncSettings({ markDirty: false, save: false });
  if (!validateAllSetup()) return;
  const completedCount = state.tasks.filter(task => task.status === 'completed').length;
  if (completedCount && !confirm('계획을 다시 만들면 기존 완료 기록이 초기화됩니다. 계속할까요?')) return;
  state.tasks = buildTasks(state.subjects, state.settings);
  scheduleTasks(state, { keepCompleted: false, fromDate: todayLocal() });
  state.generatedAt = new Date().toISOString();
  state.isPlanStale = false;
  state = saveState(state);
  currentWeekStart = startOfWeek(todayLocal());
  navigate('dashboard/today');
  queueGoogleAutoSync();
  showToast('새 공부 노트를 만들었습니다.');
}

// ---------- 자동 미루기와 완료 기록 ----------

function recoverOverdueTasks({ refresh = false } = {}) {
  if (!state.tasks.length) return false;
  const todayKey = isoDate(todayLocal());
  const overdue = state.tasks.filter(task => task.status === 'pending' && task.scheduledDate && task.scheduledDate < todayKey);
  if (!overdue.length) return false;

  overdue.forEach(task => createRescheduledCopy(task, todayKey, { automatic: true }));
  scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
  state.recoveryNotice = `${overdue.length}개의 지난 미완료 일정이 기록을 남긴 채 오늘 이후로 미뤄졌습니다.`;
  state.recoveryNoticeDate = todayKey;
  state = saveState(state);

  if (refresh && DASHBOARD_ROUTES.includes(currentRoute)) {
    renderDashboardShell();
    renderCurrentDashboardPage();
  }
  return true;
}

function createRescheduledCopy(task, earliestDate, { automatic = false } = {}) {
  const originalDate = task.scheduledDate;
  const cloneId = uid('task');
  const rootTaskId = task.rootTaskId || task.id;
  task.status = 'rescheduled';
  task.movedAt = new Date().toISOString();
  task.lastMissedAt = task.movedAt;
  task.movedToTaskId = cloneId;
  task.movedAutomatically = automatic;

  state.tasks.push({
    ...task,
    id: cloneId,
    rootTaskId,
    status: 'pending',
    scheduledDate: null,
    startTime: null,
    endTime: null,
    isBuffer: false,
    completedAt: null,
    completedLate: false,
    movedAt: null,
    movedToTaskId: null,
    rescheduledFromDate: originalDate,
    rescheduledFromTaskId: task.id,
    rescheduledCount: Number(task.rescheduledCount || 0) + 1,
    earliestOverride: earliestDate,
    createdAt: new Date().toISOString()
  });
  return cloneId;
}

function completeTask(task) {
  saveUndoSnapshot();
  const isPastMovedRecord = task.status === 'rescheduled';

  if (isPastMovedRecord) {
    const result = completeHistoricalTask(state.tasks, task.id);
    if (!result.changed) {
      undoSnapshot = null;
      showToast(result.reason === 'already-completed'
        ? '이 미뤄진 공부는 후속 일정에서 이미 완료되었습니다.'
        : '완료 상태를 변경할 수 없는 일정입니다.');
      return;
    }
    state.tasks = result.tasks;
    scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
    persistAndRender();
    showToast('과거 일정의 실제 완료를 반영하고 연결된 미룬 일정만 제거했습니다.', '되돌리기', undoLastAction);
    return;
  }

  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  persistAndRender();
  showToast('공부 완료를 체크했습니다.', '되돌리기', undoLastAction);
}

function postponeTask(task) {
  if (task.status !== 'pending') return;
  saveUndoSnapshot();
  const baseDate = task.scheduledDate ? parseDate(task.scheduledDate) : todayLocal();
  const earliest = isoDate(addDays(baseDate > todayLocal() ? baseDate : todayLocal(), 1));
  createRescheduledCopy(task, earliest, { automatic: false });
  scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
  persistAndRender();
  showToast('원래 일정에 미뤄짐 표시를 남기고 새 시간으로 옮겼습니다.', '되돌리기', undoLastAction);
}

function openPartialDialog(task) {
  if (task.status !== 'pending') return;
  partialTaskId = task.id;
  $('#partialDialogTitle').textContent = task.title;
  $('#partialRange').value = 50;
  updatePartialDialogLabels();
  $('#partialDialog').showModal();
}

function updatePartialDialogLabels() {
  const task = state.tasks.find(item => item.id === partialTaskId);
  if (!task) return;
  const percent = safeNumber($('#partialRange').value, 50);
  const completed = Math.max(5, Math.round(task.duration * percent / 100));
  const remaining = Math.max(0, task.duration - completed);
  $('#partialPercentLabel').textContent = `${percent}%`;
  $('#partialTimeLabel').textContent = `${formatMinutes(completed)} 완료 · ${formatMinutes(remaining)} 남음`;
}

function confirmPartialCompletion() {
  const task = state.tasks.find(item => item.id === partialTaskId);
  if (!task || task.status !== 'pending') return;
  const percent = safeNumber($('#partialRange').value, 50);
  saveUndoSnapshot();
  const originalDuration = task.duration;
  const completedDuration = clamp(Math.round(originalDuration * percent / 100), 5, originalDuration - 5);
  const remainingDuration = originalDuration - completedDuration;
  const originalDate = task.scheduledDate ? parseDate(task.scheduledDate) : todayLocal();
  const baseTitle = task.baseTitle || task.title.replace(/ · 남은 분량$/, '');
  const rootTaskId = task.rootTaskId || task.id;

  task.duration = completedDuration;
  if (task.startTime) task.endTime = minutesToTime(timeToMinutes(task.startTime) + completedDuration);
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.partialPercent = percent;
  task.baseTitle = baseTitle;

  state.tasks.push({
    ...task,
    id: uid('task'),
    rootTaskId,
    title: `${baseTitle} · 남은 분량`,
    duration: remainingDuration,
    originalDuration: remainingDuration,
    status: 'pending',
    completedAt: null,
    partialPercent: null,
    scheduledDate: null,
    startTime: null,
    endTime: null,
    isBuffer: false,
    rescheduledFromDate: task.scheduledDate,
    rescheduledFromTaskId: task.id,
    rescheduledCount: Number(task.rescheduledCount || 0) + 1,
    earliestOverride: isoDate(addDays(originalDate > todayLocal() ? originalDate : todayLocal(), 1)),
    createdAt: new Date().toISOString()
  });

  $('#partialDialog').close();
  scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
  persistAndRender();
  showToast(`${percent}%를 완료하고 남은 분량만 다시 배치했습니다.`, '되돌리기', undoLastAction);
}

function rebalanceTasks(showMessage = false) {
  saveUndoSnapshot();
  recoverOverdueTasks();
  scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
  persistAndRender();
  if (showMessage) showToast('완료 기록과 미뤄짐 기록을 유지한 채 남은 계획을 정리했습니다.', '되돌리기', undoLastAction);
}

function saveUndoSnapshot() {
  undoSnapshot = typeof structuredClone === 'function' ? structuredClone(state) : JSON.parse(JSON.stringify(state));
}

function undoLastAction() {
  if (!undoSnapshot) return;
  state = undoSnapshot;
  undoSnapshot = null;
  state = saveState(state);
  renderDashboardShell();
  renderCurrentDashboardPage();
  queueGoogleAutoSync();
  showToast('이전 상태로 되돌렸습니다.');
}

function persistAndRender() {
  state = saveState(state);
  renderDashboardShell();
  renderCurrentDashboardPage();
  queueGoogleAutoSync();
}

// ---------- 대시보드 ----------

function renderDashboardShell() {
  $('#sidebarPlanName').textContent = state.settings.planName || '시험 계획';
  $('#sidebarPlanPeriod').textContent = `${formatShortDate(state.settings.studyStartDate)} – ${formatShortDate(state.settings.examEndDate)}`;
  const todayKey = isoDate(todayLocal());
  $('#todayCountBadge').textContent = String(state.tasks.filter(task => task.status === 'pending' && task.scheduledDate === todayKey).length);
  $('#historyCountBadge').textContent = String(state.tasks.filter(task => task.status === 'rescheduled').length);
}

function renderCurrentDashboardPage() {
  if (currentRoute === 'dashboard/today') renderTodayPage();
  if (currentRoute === 'dashboard/week') renderWeekPage();
  if (currentRoute === 'dashboard/history') renderHistoryPage();
  if (currentRoute === 'dashboard/subjects') renderSubjectsAnalysisPage();
  if (currentRoute === 'dashboard/tasks') renderTasksPage();
  if (currentRoute === 'dashboard/sync') renderSyncPage();
  if (currentRoute === 'dashboard/settings') renderSettingsPage();
}

function activeScheduledTasks() {
  return state.tasks.filter(task => ['pending', 'completed'].includes(task.status) && task.scheduledDate);
}

function renderTodayPage() {
  const today = todayLocal();
  const todayKey = isoDate(today);
  const todayTasks = state.tasks.filter(task => ['pending', 'completed'].includes(task.status) && task.scheduledDate === todayKey).sort(taskSort);
  const pendingToday = todayTasks.filter(task => task.status === 'pending');
  const completedToday = todayTasks.filter(task => task.status === 'completed');
  const totalTodayMinutes = todayTasks.reduce((sum, task) => sum + task.duration, 0);
  const completedTodayMinutes = completedToday.reduce((sum, task) => sum + task.duration, 0);
  const todayPercentage = totalTodayMinutes ? Math.round(completedTodayMinutes / totalTodayMinutes * 100) : 0;
  const overall = planProgress(state.tasks);
  const nextTask = pendingToday[0] || nextPendingTask();

  $('#todayDateLabel').textContent = formatDate(today, { year: true, weekday: true });
  $('#todayPageSummary').textContent = pendingToday.length ? `${pendingToday.length}개의 공부가 남아 있습니다.` : todayTasks.length ? '오늘 계획을 모두 끝냈습니다.' : '오늘 배치된 공부가 없습니다.';
  renderDashboardAlerts();
  renderNextTaskFeature(nextTask, pendingToday.includes(nextTask));
  $('#todayProgressLabel').textContent = `${completedToday.length}/${todayTasks.length}개 완료 · ${formatMinutes(completedTodayMinutes)}`;
  $('#todayProgressRing').style.setProperty('--progress', todayPercentage);
  $('#todayProgressRing').innerHTML = `<span>${todayPercentage}%</span>`;
  $('#todayTasks').innerHTML = todayTasks.length ? todayTasks.map(taskItemHTML).join('') : emptyStateHTML('오늘 예정된 공부가 없습니다.', '주간 계획에서 다음 일정을 확인하세요.');

  const daysLeft = Math.max(0, daysBetween(today, parseDate(state.settings.examStartDate)));
  const pendingMinutes = state.tasks.filter(task => task.status === 'pending').reduce((sum, task) => sum + task.duration, 0);
  const movedCount = state.tasks.filter(task => task.status === 'rescheduled').length;
  $('#todayStats').innerHTML = `<div class="mini-stat"><span>시험까지</span><strong>D-${daysLeft}</strong></div><div class="mini-stat"><span>전체 진행률</span><strong>${overall.percentage}%</strong></div><div class="mini-stat"><span>남은 학습량</span><strong>${formatMinutes(pendingMinutes)}</strong></div><div class="mini-stat"><span>미뤄진 기록</span><strong>${movedCount}개</strong></div>`;

  const highestRisk = [...state.subjects].sort((a, b) => subjectRisk(b) - subjectRisk(a))[0];
  const advice = highestRisk ? recommendationFor(highestRisk) : null;
  $('#dailyAdvice').innerHTML = advice ? `<strong>${escapeHTML(highestRisk.name)} · ${escapeHTML(advice.title)}</strong><p>${escapeHTML(advice.body)}</p>` : '<p>과목 정보를 입력하면 공부법을 추천합니다.</p>';
}

function renderDashboardAlerts() {
  const alerts = [];
  if (state.isPlanStale) alerts.push({
    type: 'warning',
    text: '설정이 바뀌어 현재 일정에는 아직 반영되지 않았습니다.',
    action: '<button type="button" data-route-link="setup/review">변경 반영하기</button>'
  });
  if (state.recoveryNotice && state.recoveryNoticeDate === isoDate(todayLocal())) alerts.push({ type: 'warning', text: state.recoveryNotice });
  state.warnings.forEach(warning => alerts.push({ type: warning.includes('어렵') ? 'danger' : 'warning', text: warning }));
  if (!alerts.length) alerts.push({ type: 'success', text: '현재 일정에 충돌이나 미배치 학습량이 없습니다.' });
  $('#dashboardAlerts').innerHTML = alerts.map(alert => `<div class="alert-item ${alert.type}"><span>${escapeHTML(alert.text)}</span>${alert.action || ''}</div>`).join('');
}

function renderNextTaskFeature(task, isTodayTask) {
  const feature = $('#nextTaskFeature');
  if (!task) {
    feature.className = 'next-task-feature empty';
    feature.innerHTML = '<div><span class="next-label">계획 완료</span><h2>남아 있는 학습 일정이 없습니다.</h2><p>시험 전 핵심 오답과 준비물을 확인하세요.</p></div>';
    return;
  }
  feature.className = 'next-task-feature';
  const when = isTodayTask ? `${task.startTime} 시작 · ${task.duration}분` : `${formatDate(task.scheduledDate)} ${task.startTime || ''} · ${task.duration}분`;
  feature.innerHTML = `<div><span class="next-label">${isTodayTask ? '다음 공부' : '다음 예정'}</span><h2>${escapeHTML(task.title)}</h2><p>${escapeHTML(task.material)} · ${escapeHTML(task.detail)} · ${escapeHTML(when)}</p></div><button class="primary-button large-button" type="button" data-task-action="focus" data-task-id="${escapeHTML(task.id)}">집중 시작</button>`;
}

function taskItemHTML(task) {
  const completed = task.status === 'completed';
  return `<article class="task-item" style="--task-color:${subjectColor(task.subjectId)}"><div class="task-time"><strong>${escapeHTML(task.startTime || '--:--')}</strong><span>${task.duration}분</span></div><span class="task-subject-line" aria-hidden="true"></span><div class="task-content"><h3>${escapeHTML(task.title)}</h3><p>${escapeHTML(task.detail)} · 완료 기준: ${escapeHTML(task.completion)}</p><div class="task-tags"><span class="task-tag">${escapeHTML(stageLabel(task.type))}</span>${task.isBuffer ? '<span class="task-tag rescheduled">여유시간 사용</span>' : ''}${task.rescheduledFromDate ? `<span class="task-tag rescheduled">${formatDate(task.rescheduledFromDate)}에서 미뤄옴</span>` : ''}${completed ? '<span class="task-tag">완료</span>' : ''}</div></div><div class="task-actions">${completed ? '<span class="status-pill completed">완료됨</span>' : `<button class="task-action-main" type="button" data-task-action="focus" data-task-id="${escapeHTML(task.id)}">시작</button><div class="task-inline-menu"><button class="task-action-more" type="button" data-task-menu aria-label="추가 작업" aria-haspopup="menu" aria-expanded="false">···</button><div class="task-menu-popover" hidden><button type="button" data-task-action="complete" data-task-id="${escapeHTML(task.id)}">공부했어요</button><button type="button" data-task-action="partial" data-task-id="${escapeHTML(task.id)}">일부만 했어요</button><button type="button" data-task-action="postpone" data-task-id="${escapeHTML(task.id)}">못했어요 · 미루기</button></div></div>`}</div></article>`;
}

function renderWeekPage() {
  const days = Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  const todayKey = isoDate(todayLocal());
  $('#weekRangeLabel').textContent = `${formatDate(days[0], { year: true })} – ${formatDate(days[6])}`;

  $('#calendarGrid').innerHTML = days.map(date => {
    const key = isoDate(date);
    const tasks = state.tasks.filter(task => task.scheduledDate === key && task.status !== 'cancelled').sort(taskSort);
    const total = tasks.filter(task => ['pending', 'completed'].includes(task.status)).reduce((sum, task) => sum + task.duration, 0);
    return `<article class="calendar-day ${key === todayKey ? 'today' : ''}"><header class="calendar-day-header"><strong>${KOREAN_DAYS[date.getDay()]}요일</strong><span>${formatShortDate(date)}</span></header><div class="calendar-day-tasks">${tasks.length ? tasks.map(calendarTaskHTML).join('') : '<div class="calendar-empty">일정 없음</div>'}</div><div class="day-total">총 ${formatMinutes(total)}</div></article>`;
  }).join('');

  $('#weekList').innerHTML = days.map(date => {
    const key = isoDate(date);
    const tasks = state.tasks.filter(task => task.scheduledDate === key && task.status !== 'cancelled').sort(taskSort);
    return `<article class="mobile-day ${key === todayKey ? 'today' : ''}"><header><strong>${KOREAN_DAYS[date.getDay()]}요일</strong><span>${formatDate(date)}</span></header>${tasks.length ? tasks.map(task => `<div class="mobile-calendar-task"><strong>${escapeHTML(task.title)}</strong><span>${escapeHTML(task.startTime || '--:--')} · ${task.duration}분 · ${escapeHTML(taskStatus(task).label)}</span></div>`).join('') : '<div class="calendar-empty">일정 없음</div>'}</article>`;
  }).join('');
}

function calendarTaskHTML(task) {
  const status = taskStatus(task);
  return `<div class="calendar-task ${task.status === 'completed' ? 'completed' : ''} ${task.status === 'rescheduled' ? 'rescheduled' : ''}" style="--task-color:${subjectColor(task.subjectId)}" title="${escapeHTML(task.title)}"><strong>${escapeHTML(task.title)}</strong><span>${escapeHTML(task.startTime || '--:--')} · ${task.duration}분 · ${escapeHTML(status.label)}</span></div>`;
}

function renderHistoryPage() {
  const todayKey = isoDate(todayLocal());
  const history = state.tasks.filter(task => task.status !== 'cancelled' && task.scheduledDate && (task.scheduledDate < todayKey || task.status === 'rescheduled')).sort((a, b) => taskSort(b, a));
  const moved = history.filter(task => task.status === 'rescheduled').length;
  const completed = history.filter(task => task.status === 'completed').length;
  $('#historySummary').innerHTML = `<strong>${history.length}개의 지난 기록</strong> · 완료 ${completed}개 · 미뤄짐 ${moved}개`;
  $('#historyTasks').innerHTML = history.length ? history.map(historyItemHTML).join('') : emptyStateHTML('아직 지난 기록이 없습니다.', '공부 일정이 지나면 이곳에 완료와 미뤄짐 기록이 남습니다.');
}

function historyItemHTML(task) {
  const status = taskStatus(task);
  const moved = task.status === 'rescheduled';
  return `<article class="history-item ${moved ? 'moved' : ''}"><div class="history-date"><strong>${formatDate(task.scheduledDate)}</strong><span>${escapeHTML(task.startTime || '--:--')} · ${task.duration}분</span></div><div class="history-content"><h3>${escapeHTML(task.title)}</h3><p>${escapeHTML(task.subjectName)} · ${escapeHTML(task.detail)}</p><span class="status-pill ${status.key}">${escapeHTML(status.label)}</span></div><div class="history-actions">${moved ? `<button class="primary-button" type="button" data-task-action="past-complete" data-task-id="${escapeHTML(task.id)}">사실 공부했음</button>` : task.status === 'completed' ? '<span class="status-pill completed">체크됨</span>' : ''}</div></article>`;
}

function renderSubjectsAnalysisPage() {
  $('#subjectAnalysisGrid').innerHTML = state.subjects.map(subject => {
    const progress = subjectProgress(state.tasks, subject.id);
    const risk = riskLevel(subject);
    const advice = recommendationFor(subject);
    const daysLeft = Math.max(0, daysBetween(todayLocal(), subject.examDate));
    return `<article class="analysis-card" style="--subject-color:${subjectColor(subject.id)}"><header><div><h2>${escapeHTML(subject.name)}</h2><p>${formatDate(subject.examDate)} 시험 · ${risk.label}</p></div><div class="readiness-score"><strong>${progress.percentage}%</strong><span>계획 진행률</span></div></header><div class="progress-track"><span style="width:${progress.percentage}%"></span></div><div class="analysis-metrics"><div class="analysis-metric"><span>시험까지</span><strong>D-${daysLeft}</strong></div><div class="analysis-metric"><span>완료 학습</span><strong>${formatMinutes(progress.completed)}</strong></div><div class="analysis-metric"><span>남은 일정</span><strong>${progress.pendingCount}개</strong></div></div><div class="method-box"><strong>${escapeHTML(advice.title)}</strong><p>${escapeHTML(advice.body)}</p></div></article>`;
  }).join('');
}

function renderTasksPage() {
  updateSubjectFilterOptions();
  const query = $('#taskSearch').value.trim().toLowerCase();
  const subjectId = $('#subjectFilter').value;
  const statusFilter = $('#taskFilter').value;
  const tasks = [...state.tasks].filter(task => {
    if (task.status === 'cancelled') return false;
    const matchesQuery = !query || `${task.title} ${task.subjectName} ${task.detail}`.toLowerCase().includes(query);
    const matchesSubject = subjectId === 'all' || task.subjectId === subjectId;
    const status = taskStatus(task).key;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'pending' && task.status === 'pending') || status === statusFilter;
    return matchesQuery && matchesSubject && matchesStatus;
  }).sort(taskSort);
  const pendingMinutes = tasks.filter(task => task.status === 'pending').reduce((sum, task) => sum + task.duration, 0);
  const visibleTasks = tasks.slice(0, taskDisplayLimit);
  const visibleText = tasks.length > visibleTasks.length ? ` · ${visibleTasks.length}개 표시 중` : '';
  $('#taskResultSummary').textContent = `${tasks.length}개 일정${visibleText} · 남은 학습량 ${formatMinutes(pendingMinutes)}`;
  $('#allTasks').innerHTML = visibleTasks.length ? `<table class="task-table"><thead><tr><th>학습 내용</th><th>과목</th><th>단계</th><th>일정</th><th>시간</th><th>상태</th><th>처리</th></tr></thead><tbody>${visibleTasks.map(taskTableRowHTML).join('')}</tbody></table>` : emptyStateHTML('조건에 맞는 일정이 없습니다.', '검색어나 필터를 변경해 보세요.');
  const loadMore = $('#loadMoreTasksButton');
  if (loadMore) {
    loadMore.hidden = visibleTasks.length >= tasks.length;
    loadMore.textContent = `일정 더 보기 (${tasks.length - visibleTasks.length}개 남음)`;
  }
}

function resetTaskListAndRender() {
  taskDisplayLimit = 60;
  renderTasksPage();
}

function updateSubjectFilterOptions() {
  const select = $('#subjectFilter');
  const current = select.value || 'all';
  select.innerHTML = '<option value="all">모든 과목</option>' + state.subjects.map(subject => `<option value="${escapeHTML(subject.id)}">${escapeHTML(subject.name)}</option>`).join('');
  select.value = [...select.options].some(option => option.value === current) ? current : 'all';
}

function taskTableRowHTML(task) {
  const status = taskStatus(task);
  let action = '—';
  if (task.status === 'pending') {
    action = `<div class="table-action-row"><button type="button" data-task-action="complete" data-task-id="${escapeHTML(task.id)}">완료</button><button type="button" data-task-action="partial" data-task-id="${escapeHTML(task.id)}">일부</button><button type="button" data-task-action="postpone" data-task-id="${escapeHTML(task.id)}">미루기</button></div>`;
  } else if (task.status === 'rescheduled') {
    action = `<button type="button" data-task-action="past-complete" data-task-id="${escapeHTML(task.id)}">사실 완료함</button>`;
  }
  return `<tr><td class="task-table-title" data-label="학습 내용"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.detail)}</small></td><td data-label="과목">${escapeHTML(task.subjectName)}</td><td data-label="단계">${escapeHTML(TYPE_LABELS[task.type] || task.type)}</td><td data-label="일정">${task.scheduledDate ? `${formatDate(task.scheduledDate)} ${escapeHTML(task.startTime || '')}` : '미배치'}</td><td data-label="시간">${task.duration}분</td><td data-label="상태"><span class="status-pill ${status.key}">${escapeHTML(status.label)}</span></td><td data-label="처리">${action}</td></tr>`;
}

function nextPendingTask() {
  return state.tasks.filter(task => task.status === 'pending' && task.scheduledDate).sort(taskSort)[0] || null;
}

function taskSort(first, second) {
  const firstDate = first.scheduledDate || '9999-12-31';
  const secondDate = second.scheduledDate || '9999-12-31';
  return firstDate.localeCompare(secondDate)
    || String(first.startTime || '99:99').localeCompare(String(second.startTime || '99:99'))
    || Number(second.priority || 0) - Number(first.priority || 0);
}

function subjectColor(id) {
  let hash = 0;
  for (const character of String(id)) hash = ((hash << 5) - hash) + character.charCodeAt(0);
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

function emptyStateHTML(title, description) {
  return `<div class="empty-state"><strong>${escapeHTML(title)}</strong><p>${escapeHTML(description)}</p></div>`;
}

// ---------- 일정 작업과 집중 타이머 ----------

function toggleTaskMenu(button) {
  const menu = button.nextElementSibling;
  const shouldOpen = menu.hidden;
  closeAllTaskMenus();
  menu.hidden = !shouldOpen;
  button.setAttribute('aria-expanded', String(shouldOpen));
  if (shouldOpen) menu.querySelector('button')?.focus({ preventScroll: true });
}

function closeAllTaskMenus() {
  $$('.task-menu-popover').forEach(menu => {
    menu.hidden = true;
    menu.previousElementSibling?.setAttribute('aria-expanded', 'false');
  });
}

function handleTaskAction(taskId, action) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  if (action === 'focus') openFocusDialog(task);
  if (action === 'complete' || action === 'past-complete') completeTask(task);
  if (action === 'partial') openPartialDialog(task);
  if (action === 'postpone') postponeTask(task);
}

function openFocusDialog(task) {
  if (task.status !== 'pending') return;
  focusTaskId = task.id;
  focusInitialSeconds = task.duration * 60;
  focusSeconds = focusInitialSeconds;
  $('#focusTaskTitle').textContent = task.title;
  $('#focusTaskMeta').textContent = `${task.subjectName} · ${task.duration}분 · ${task.detail}`;
  $('#focusToggleButton').textContent = '시작';
  updateFocusTimerDisplay();
  $('#focusDialog').showModal();
}

function toggleFocusTimer() {
  if (focusTimerId) {
    pauseFocusTimer();
    $('#focusToggleButton').textContent = '계속';
    return;
  }
  if (focusSeconds <= 0) resetFocusTimer();
  $('#focusToggleButton').textContent = '잠시 멈춤';
  focusEndsAt = Date.now() + focusSeconds * 1000;
  const tick = () => {
    focusSeconds = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
    updateFocusTimerDisplay();
    if (focusSeconds === 0) {
      pauseFocusTimer({ preserveRemaining: true });
      $('#focusToggleButton').textContent = '끝남';
      showToast('집중 시간이 끝났습니다. 실제 완료 상태를 선택하세요.');
    }
  };
  tick();
  focusTimerId = window.setInterval(tick, 250);
}

function pauseFocusTimer({ preserveRemaining = false } = {}) {
  if (focusTimerId && !preserveRemaining) focusSeconds = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
  if (focusTimerId) clearInterval(focusTimerId);
  focusTimerId = null;
  focusEndsAt = 0;
  updateFocusTimerDisplay();
}

function resetFocusTimer() {
  pauseFocusTimer();
  focusSeconds = focusInitialSeconds;
  focusEndsAt = 0;
  $('#focusToggleButton').textContent = '시작';
  updateFocusTimerDisplay();
}

function updateFocusTimerDisplay() {
  const minutes = Math.floor(focusSeconds / 60);
  const seconds = focusSeconds % 60;
  $('#focusTimer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.title = focusTimerId ? `${$('#focusTimer').textContent} · 집중 중` : pageTitleForRoute(currentRoute);
}

function closeFocusDialog() {
  pauseFocusTimer();
  if ($('#focusDialog').open) $('#focusDialog').close();
  focusTaskId = null;
  document.title = pageTitleForRoute(currentRoute);
}

// ---------- Google Calendar ----------

function resolvedGoogleClientId() {
  return getConfiguredGoogleClientId() || state.calendar?.clientId || '';
}

function hydrateCalendarSettings() {
  const configuredClientId = getConfiguredGoogleClientId();
  const input = $('#googleClientId');
  input.value = configuredClientId || state.calendar?.clientId || '';
  input.readOnly = Boolean(configuredClientId);
  input.setAttribute('aria-readonly', configuredClientId ? 'true' : 'false');
  $('#googleClientIdSource').textContent = configuredClientId
    ? 'config.js에 설정되어 있어 사이트 사용자는 입력할 필요가 없습니다.'
    : '배포자가 config.js에 등록하면 이 입력칸은 자동으로 잠깁니다.';
  $('#googleAutoSync').checked = Boolean(state.calendar?.autoSync);
}

function renderSyncPage() {
  hydrateCalendarSettings();
  const environment = googleOAuthEnvironment();
  const connected = googleIsConnected();
  const clientId = resolvedGoogleClientId();
  const lastSync = state.calendar?.lastSyncAt ? new Date(state.calendar.lastSyncAt).toLocaleString('ko-KR') : '아직 동기화하지 않음';
  const calendarName = state.calendar?.calendarName || 'STUNO 공부 계획';

  $('#googleOriginValue').textContent = environment.origin || '확인할 수 없음';
  $('#googleEnvironmentStatus').className = `connection-status ${environment.ready ? 'connected' : 'error'}`;
  $('#googleEnvironmentStatus').textContent = environment.ready
    ? '현재 주소는 Google OAuth를 사용할 수 있습니다.'
    : environment.message;

  $('#googleConnectButton').disabled = !environment.ready || googleSyncInFlight;
  $('#googleDisconnectButton').disabled = !connected || googleSyncInFlight;
  $('#googleSyncButton').disabled = !connected || googleSyncInFlight;
  $('#googleAutoSync').disabled = !connected;

  const calendarLink = $('#googleCalendarOpenLink');
  calendarLink.href = googleCalendarWebUrl(state.calendar?.calendarId);
  calendarLink.hidden = !state.calendar?.calendarId;
  $('#googleCalendarName').textContent = state.calendar?.calendarId
    ? `${calendarName} · 전용 보조 캘린더 연결됨`
    : '연결 후 STUNO 전용 보조 캘린더가 자동으로 만들어집니다.';

  renderGoogleConnectionStatus();
  const resultBox = $('#googleSyncResult');
  resultBox.className = 'sync-result';
  resultBox.textContent = `마지막 동기화: ${lastSync} · 바뀐 일정만 전송합니다.`;
}

function renderGoogleConnectionStatus(message = '', forceError = false) {
  const status = $('#googleConnectionStatus');
  const info = googleConnectionInfo();
  if (info.connected && !forceError) {
    const expires = info.expiresAt ? new Date(info.expiresAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
    status.className = 'connection-status connected';
    status.textContent = message || `Google 계정 연결됨${expires ? ` · 권한 ${expires}까지` : ''}`;
  } else {
    status.className = `connection-status${forceError ? ' error' : ''}`;
    status.textContent = message || '연결되지 않음 · 보안을 위해 새로고침 후에는 다시 연결해야 합니다.';
  }
}

async function connectGoogle() {
  const clientId = resolvedGoogleClientId();
  if (!isValidGoogleClientId(clientId)) {
    const details = $('.oauth-details');
    if (details) details.open = true;
    $('#googleClientId').focus();
    renderGoogleConnectionStatus('OAuth 웹 클라이언트 ID를 먼저 등록해 주세요.', true);
    showToast('Google Cloud의 OAuth 웹 클라이언트 ID가 필요합니다.');
    return;
  }
  if (!getConfiguredGoogleClientId()) state.calendar.clientId = clientId;
  persistStateNow();
  const button = $('#googleConnectButton');
  button.disabled = true;
  button.textContent = 'Google 확인 중…';
  try {
    await connectGoogleCalendar(clientId);
    renderGoogleConnectionStatus('Google 계정이 연결되었습니다. STUNO 캘린더를 준비합니다.');
    await syncWithGoogle({ initial: true });
  } catch (error) {
    renderGoogleConnectionStatus(error.message, true);
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Google Calendar 연결';
    if (currentRoute === 'dashboard/sync') renderSyncControlsOnly();
  }
}

function disconnectGoogle() {
  disconnectGoogleCalendar();
  googleAutoSyncDebounced.cancel?.();
  renderGoogleConnectionStatus('연결을 해제했습니다. Google Calendar의 기존 일정은 유지됩니다.');
  renderSyncControlsOnly();
  showToast('Google 연결을 해제했습니다.');
}

function renderSyncControlsOnly() {
  const connected = googleIsConnected();
  const environment = googleOAuthEnvironment();
  const clientId = resolvedGoogleClientId();
  $('#googleConnectButton').disabled = !environment.ready || googleSyncInFlight;
  $('#googleDisconnectButton').disabled = !connected || googleSyncInFlight;
  $('#googleSyncButton').disabled = !connected || googleSyncInFlight;
  $('#googleAutoSync').disabled = !connected;
  const calendarLink = $('#googleCalendarOpenLink');
  calendarLink.href = googleCalendarWebUrl(state.calendar?.calendarId);
  calendarLink.hidden = !state.calendar?.calendarId;
}

async function syncWithGoogle({ silent = false, initial = false } = {}) {
  if (googleSyncInFlight) return;
  if (!googleIsConnected()) {
    if (!silent) showToast('먼저 Google Calendar를 연결해 주세요.');
    return;
  }
  googleSyncInFlight = true;
  const button = $('#googleSyncButton');
  const resultBox = $('#googleSyncResult');
  if (button) {
    button.disabled = true;
    button.textContent = initial ? '처음 일정 보내는 중…' : '동기화 중…';
  }
  if (resultBox) {
    resultBox.className = 'sync-result working';
    resultBox.textContent = 'STUNO 전용 캘린더와 일정을 확인하고 있습니다.';
  }
  try {
    const result = await syncGoogleCalendar({
      tasks: state.tasks,
      eventMap: state.calendar.eventMap,
      calendarId: state.calendar.calendarId,
      planName: state.settings.planName,
      onProgress: progress => {
        if (!resultBox) return;
        resultBox.textContent = `${progress.processed}/${progress.total || 0} 처리 · 생성 ${progress.created} · 수정 ${progress.updated} · 삭제 ${progress.removed} · 변경 없음 ${progress.skipped}`;
      }
    });
    state.calendar.calendarId = result.calendarId;
    state.calendar.calendarName = result.calendarName;
    state.calendar.eventMap = result.eventMap;
    state.calendar.lastSyncAt = new Date().toISOString();
    state = saveState(state);

    if (resultBox) {
      resultBox.className = 'sync-result success';
      resultBox.textContent = `${result.calendarCreated ? 'STUNO 캘린더 생성 완료 · ' : ''}생성 ${result.created}개 · 수정 ${result.updated}개 · 삭제 ${result.removed}개 · 변경 없음 ${result.skipped}개`;
    }
    $('#googleCalendarName').textContent = `${result.calendarName} · 전용 보조 캘린더 연결됨`;
    renderGoogleConnectionStatus('Google 계정과 STUNO 캘린더가 연결되어 있습니다.');
    if (!silent) showToast(initial ? 'Google Calendar 연결과 첫 동기화를 완료했습니다.' : 'Google Calendar 동기화를 완료했습니다.');
  } catch (error) {
    if (resultBox) {
      resultBox.className = 'sync-result error';
      resultBox.textContent = `동기화 실패: ${error.message}`;
    }
    const expired = /만료|다시 연결/.test(error.message);
    renderGoogleConnectionStatus(expired ? error.message : 'Google 계정은 연결됐지만 동기화 중 문제가 발생했습니다.', expired);
    if (!silent) showToast(error.message);
  } finally {
    googleSyncInFlight = false;
    if (button) {
      button.disabled = !googleIsConnected();
      button.textContent = '지금 동기화';
    }
    renderSyncControlsOnly();
  }
}

function queueGoogleAutoSync() {
  if (!state.calendar?.autoSync || !googleIsConnected()) return;
  googleAutoSyncDebounced();
}

// ---------- 데이터 백업과 복원 ----------

function exportDataBackup() {
  persistStateNow();
  const backup = createBackupFile(state, document.documentElement.dataset.theme || loadTheme());
  downloadBlob(backup.content, backup.filename, 'application/json;charset=utf-8');
  showToast('STUNO 백업 파일을 저장했습니다.');
}

async function importDataBackup(event) {
  const input = event.currentTarget;
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const backup = parseBackupText(await file.text(), file.size);
    if (!confirm('현재 데이터를 백업 파일의 내용으로 바꿀까요? 이 작업은 되돌릴 수 없습니다.')) return;
    suppressPersistence = true;
    saveDebounced.cancel?.();
    state = normalizeState(backup.state);
    state.profile.started = true;
    state = saveState(state);
    if (backup.theme) saveTheme(normalizeTheme(backup.theme));
    location.hash = state.tasks.length ? '#/dashboard/today' : '#/setup/basic';
    location.reload();
  } catch (error) {
    showToast(error.message || '백업 파일을 불러오지 못했습니다.');
  } finally {
    if (input) input.value = '';
  }
}

// ---------- ICS 내보내기 ----------

function exportICS() {
  const calendar = createIcsExport(state.tasks, state.settings.planName);
  if (!calendar.count) {
    showToast('내보낼 예정 일정이 없습니다.');
    return;
  }
  downloadBlob(calendar.content, calendar.filename, 'text/calendar;charset=utf-8');
  showToast(`${calendar.count}개의 일정을 캘린더 파일로 만들었습니다.`);
}

// ---------- 공통 UI ----------

function setTheme(theme, { persist = true } = {}) {
  const normalized = applyAppTheme(normalizeTheme(theme));
  if (persist) saveTheme(normalized);
  $$('.theme-choice button').forEach(button => {
    const active = button.dataset.themeChoice === normalized;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || document.body.dataset.theme || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function resetAll() {
  if (!confirm('이 기기에 저장된 입력과 계획을 모두 삭제할까요? Google Calendar에 이미 만든 일정은 직접 삭제하거나 동기화 전에 정리해야 합니다.')) return;
  suppressPersistence = true;
  saveDebounced.cancel?.();
  clearStoredState();
  location.hash = '#/welcome';
  location.reload();
}

function showToast(message, actionLabel = '', actionCallback = null) {
  clearTimeout(showToast.timer);
  $('#toastMessage').textContent = message;
  const actionButton = $('#toastAction');
  toastActionCallback = actionCallback;
  actionButton.hidden = !actionLabel;
  actionButton.textContent = actionLabel;
  $('#toast').classList.add('show');
  showToast.timer = setTimeout(hideToast, actionLabel ? 5000 : 3000);
}

function hideToast() {
  $('#toast').classList.remove('show');
  toastActionCallback = null;
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    await registration.update();
  } catch (error) {
    console.warn('서비스 워커 등록 실패', error);
  }
}

