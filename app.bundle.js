/* StudyFlow generated bundle. Edit the modular source files, then run tools/build.py. */
'use strict';

/* --- js/constants.js --- */
const STORAGE_KEY = 'studyflow-v4';
const LEGACY_STORAGE_KEYS = ['studyflow-ai-v1', 'studyflow-v2', 'studyflow-v3'];
const THEME_KEY = 'studyflow-theme';

const ROUTES = [
  'setup/exam',
  'setup/subjects',
  'setup/schedule',
  'setup/review',
  'dashboard/today',
  'dashboard/week',
  'dashboard/subjects',
  'dashboard/tasks'
];

const SETUP_ROUTES = ['setup/exam', 'setup/subjects', 'setup/schedule', 'setup/review'];
const DASHBOARD_ROUTES = ['dashboard/today', 'dashboard/week', 'dashboard/subjects', 'dashboard/tasks'];

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
const SUBJECT_COLORS = ['#176b5b', '#8a5a22', '#4d6497', '#845887', '#a34d46', '#4b7250', '#6f5f9a', '#2f7180'];

const TIME_PRESETS = {
  light: { weekdayTarget: 90, weekdayMax: 150, weekendTarget: 180, weekendMax: 270 },
  balanced: { weekdayTarget: 150, weekdayMax: 210, weekendTarget: 300, weekendMax: 420 },
  intensive: { weekdayTarget: 210, weekdayMax: 300, weekendTarget: 420, weekendMax: 540 }
};

const DEFAULT_SETTINGS = {
  planName: '2학기 중간고사',
  grade: '2',
  studyStartDate: '',
  examStartDate: '',
  examEndDate: '',
  weekdayTarget: 150,
  weekendTarget: 300,
  weekdayMax: 210,
  weekendMax: 420,
  weekdayStart: '18:30',
  weekdayEnd: '23:00',
  weekendStart: '10:00',
  weekendEnd: '22:30',
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
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), wait);
  };
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
  return (name || 'studyflow').replace(/[\\/:*?"<>|]/g, '-').trim();
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
function defaultDates() {
  const today = todayLocal();
  const examStart = addDays(today, 21);
  return {
    studyStartDate: isoDate(today),
    examStartDate: isoDate(examStart),
    examEndDate: isoDate(addDays(examStart, 4))
  };
}

function createDefaultState() {
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

function normalizeState(rawState) {
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

function loadState() {
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

function saveState(state) {
  const nextState = { ...state, version: 4, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
}

function clearStoredState() {
  [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].forEach(key => localStorage.removeItem(key));
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
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
        tasks.push({
          id: uid('task'),
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
  const configuredStart = timeToMinutes(weekend ? settings.weekendStart : settings.weekdayStart);
  const end = timeToMinutes(weekend ? settings.weekendEnd : settings.weekdayEnd);
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
  const candidates = state.tasks.filter(task => task.status !== 'completed');
  candidates.forEach(task => {
    task.status = 'pending';
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
    .filter(task => task.status !== 'completed' && task.isBuffer)
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
    const windowStart = timeToMinutes(weekend ? settings.weekendStart : settings.weekdayStart);
    const windowEnd = timeToMinutes(weekend ? settings.weekendEnd : settings.weekdayEnd);
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
  const subjectTasks = tasks.filter(task => task.subjectId === subjectId);
  const total = subjectTasks.reduce((sum, task) => sum + Number(task.duration || 0), 0);
  const completed = subjectTasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + Number(task.duration || 0), 0);
  return {
    total,
    completed,
    percentage: total ? Math.round(completed / total * 100) : 0,
    pendingCount: subjectTasks.filter(task => task.status !== 'completed').length
  };
}

function planProgress(tasks) {
  const total = tasks.reduce((sum, task) => sum + Number(task.duration || 0), 0);
  const completed = tasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + Number(task.duration || 0), 0);
  return { total, completed, percentage: total ? Math.round(completed / total * 100) : 0 };
}

function taskStatus(task) {
  if (task.status === 'completed') return { key: 'completed', label: '완료' };
  if (!task.scheduledDate) return { key: 'unscheduled', label: '미배치' };
  if (task.rescheduledCount > 0) return { key: 'rescheduled', label: `재배치 ${task.rescheduledCount}회` };
  return { key: 'pending', label: task.isBuffer ? '여유시간 사용' : '예정' };
}

function stageLabel(type) {
  return TYPE_LABELS[type] || type;
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
let undoSnapshot = null;
let toastActionCallback = null;

const saveDebounced = debounce(() => {
  state = saveState(state);
  setSaveStatus('saved');
}, 450);

window.addEventListener('DOMContentLoaded', init);

function init() {
  applyTheme(loadTheme());
  ensureInitialSubject();
  recoverOverdueTasks();
  hydrateSettings();
  renderSubjects();
  renderSchedules();
  bindEvents();
  hydrating = false;
  syncSetupState({ markDirty: false, save: false });
  resolveInitialRoute();
  registerServiceWorker();
}


function recoverOverdueTasks() {
  if (!state.tasks.length) return;
  const todayKey = isoDate(todayLocal());
  const overdue = state.tasks.filter(task => task.status !== 'completed' && task.scheduledDate && task.scheduledDate < todayKey);
  if (!overdue.length) return;
  overdue.forEach(task => {
    task.rescheduledCount = Number(task.rescheduledCount || 0) + 1;
    task.lastMissedAt = new Date().toISOString();
    task.earliestOverride = todayKey;
    task.scheduledDate = null;
    task.startTime = null;
    task.endTime = null;
  });
  scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
  state.recoveryNotice = `${overdue.length}개의 지난 미완료 일정을 오늘 이후로 자동 재배치했습니다.`;
  state.recoveryNoticeDate = todayKey;
  state = saveState(state);
}

function ensureInitialSubject() {
  if (state.subjects.length) return;
  state.subjects.push({
    ...DEFAULT_SUBJECT,
    id: uid('subject'),
    examDate: state.settings.examStartDate
  });
}

function bindEvents() {
  window.addEventListener('hashchange', () => renderRoute(routeFromHash()));
  document.body.addEventListener('click', handleDelegatedClick);
  $('#plannerForm').addEventListener('input', handleFormInput);
  $('#plannerForm').addEventListener('change', handleFormInput);

  $('#addSubjectButton').addEventListener('click', () => addSubject());
  $('#addScheduleButton').addEventListener('click', () => addSchedule());
  $('#generatePlanButton').addEventListener('click', generatePlan);
  $('#themeToggle').addEventListener('click', toggleTheme);
  $('#resetButton').addEventListener('click', resetAll);
  $('#editPlanButton').addEventListener('click', () => navigate('setup/exam'));
  $('#exportIcsButton').addEventListener('click', exportICS);
  $('#quickRebalanceButton').addEventListener('click', () => rebalanceTasks(true));
  $('#rebalanceButton').addEventListener('click', () => rebalanceTasks(true));

  $('#prevWeekButton').addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, -7);
    renderWeekPage();
  });
  $('#nextWeekButton').addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, 7);
    renderWeekPage();
  });
  $('#todayWeekButton').addEventListener('click', () => {
    currentWeekStart = startOfWeek(todayLocal());
    renderWeekPage();
  });

  $('#taskSearch').addEventListener('input', renderTasksPage);
  $('#subjectFilter').addEventListener('change', renderTasksPage);
  $('#taskFilter').addEventListener('change', renderTasksPage);

  $('#partialRange').addEventListener('input', updatePartialDialogLabels);
  $('#confirmPartialButton').addEventListener('click', confirmPartialCompletion);
  $('#partialDialog').addEventListener('close', () => { partialTaskId = null; });

  $('#focusToggleButton').addEventListener('click', toggleFocusTimer);
  $('#focusResetButton').addEventListener('click', resetFocusTimer);
  $('#closeFocusButton').addEventListener('click', closeFocusDialog);
  $('#focusDialog').addEventListener('close', pauseFocusTimer);

  $('#toastAction').addEventListener('click', () => {
    if (toastActionCallback) toastActionCallback();
    hideToast();
  });
}

function handleDelegatedClick(event) {
  const routeLink = event.target.closest('[data-route-link]');
  if (routeLink) {
    event.preventDefault();
    const target = routeLink.dataset.routeLink;
    if (canNavigateTo(target)) navigate(target);
    return;
  }

  const nextButton = event.target.closest('[data-next-route]');
  if (nextButton) {
    const target = nextButton.dataset.nextRoute;
    if (validateRoute(currentRoute)) navigate(target);
    return;
  }

  const previousButton = event.target.closest('[data-prev-route]');
  if (previousButton) {
    navigate(previousButton.dataset.prevRoute);
    return;
  }

  const presetButton = event.target.closest('[data-time-preset]');
  if (presetButton) {
    applyTimePreset(presetButton.dataset.timePreset);
    return;
  }

  const subjectToggle = event.target.closest('.subject-toggle');
  if (subjectToggle) {
    toggleSubjectCard(subjectToggle.closest('.subject-card'));
    return;
  }

  const detailsToggle = event.target.closest('.details-toggle');
  if (detailsToggle) {
    toggleSubjectDetails(detailsToggle.closest('.subject-card'));
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

  const removeScheduleButton = event.target.closest('.remove-schedule');
  if (removeScheduleButton) {
    removeSchedule(removeScheduleButton.closest('.schedule-item'));
    return;
  }

  const quickPartial = event.target.closest('[data-partial-value]');
  if (quickPartial) {
    $('#partialRange').value = quickPartial.dataset.partialValue;
    updatePartialDialogLabels();
    return;
  }

  const taskMenuButton = event.target.closest('[data-task-menu]');
  if (taskMenuButton) {
    toggleTaskMenu(taskMenuButton);
    return;
  }

  const taskActionButton = event.target.closest('[data-task-action]');
  if (taskActionButton) {
    closeAllTaskMenus();
    handleTaskAction(taskActionButton.dataset.taskId, taskActionButton.dataset.taskAction);
    return;
  }

  const focusResult = event.target.closest('[data-focus-result]');
  if (focusResult) {
    const action = focusResult.dataset.focusResult;
    const taskId = focusTaskId;
    closeFocusDialog();
    if (taskId) handleTaskAction(taskId, action);
    return;
  }

  if (!event.target.closest('.task-inline-menu')) closeAllTaskMenus();
}

function handleFormInput(event) {
  if (hydrating) return;
  if (event.target.closest('.subject-card')) syncSubjectCard(event.target.closest('.subject-card'));
  if (event.target.closest('.schedule-item')) renderScheduleConflicts();
  renderPeriodPreview();
  syncSetupState({ markDirty: true, save: true });
}

function resolveInitialRoute() {
  const requested = routeFromHash();
  const fallback = state.tasks.length ? 'dashboard/today' : 'setup/exam';
  if (!requested || !ROUTES.includes(requested) || (DASHBOARD_ROUTES.includes(requested) && !state.tasks.length)) {
    navigate(fallback, { replace: true });
  } else {
    renderRoute(requested);
  }
}

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

function canNavigateTo(target) {
  if (DASHBOARD_ROUTES.includes(target) && !state.tasks.length) {
    showToast('먼저 학습 계획을 생성해 주세요.');
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
    navigate('setup/exam', { replace: true });
    return;
  }

  currentRoute = route;
  $$('.page[data-route-page]').forEach(page => {
    page.hidden = page.dataset.routePage !== route;
  });

  const isSetup = SETUP_ROUTES.includes(route);
  $('#setupSidebar').hidden = !isSetup;
  $('#dashboardSidebar').hidden = isSetup;
  $('#mobileDashboardNav').hidden = isSetup;

  $$('[data-route-link]').forEach(link => {
    link.classList.toggle('active', link.dataset.routeLink === route);
  });

  if (isSetup) {
    updateSetupNavigation(route);
    if (route === 'setup/exam') renderPeriodPreview();
    if (route === 'setup/subjects') updateAllSubjectCards();
    if (route === 'setup/schedule') renderScheduleConflicts();
    if (route === 'setup/review') {
      syncSetupState({ markDirty: false, save: true });
      renderReviewPage();
    }
  } else {
    renderDashboardShell();
    if (route === 'dashboard/today') renderTodayPage();
    if (route === 'dashboard/week') renderWeekPage();
    if (route === 'dashboard/subjects') renderSubjectsAnalysisPage();
    if (route === 'dashboard/tasks') renderTasksPage();
  }

  document.title = pageTitleForRoute(route);
  $('#pageContent').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function pageTitleForRoute(route) {
  const titles = {
    'setup/exam': '시험 설정',
    'setup/subjects': '과목 분석',
    'setup/schedule': '생활 일정',
    'setup/review': '최종 확인',
    'dashboard/today': '오늘의 공부',
    'dashboard/week': '주간 계획',
    'dashboard/subjects': '과목 분석',
    'dashboard/tasks': '전체 일정'
  };
  return `${titles[route] || 'StudyFlow'} · StudyFlow`;
}

function updateSetupNavigation(route) {
  const index = SETUP_ROUTES.indexOf(route);
  $('#setupProgressText').textContent = `${index + 1} / ${SETUP_ROUTES.length}`;
  $$('.step-nav a').forEach((link, linkIndex) => {
    link.classList.toggle('completed', linkIndex < index);
  });
}

function validateRoute(route) {
  clearInvalidFields();
  syncSetupState({ markDirty: false, save: false });

  if (route === 'setup/exam') {
    const required = [$('#planName'), $('#studyStartDate'), $('#examStartDate'), $('#examEndDate')];
    const empty = required.find(input => !input.value.trim());
    if (empty) return validationFailure(empty, '필수 시험 정보를 입력해 주세요.');

    const studyStart = parseDate($('#studyStartDate').value);
    const examStart = parseDate($('#examStartDate').value);
    const examEnd = parseDate($('#examEndDate').value);
    if (examStart < studyStart) return validationFailure($('#examStartDate'), '시험 시작일은 준비 시작일보다 늦어야 합니다.');
    if (examEnd < examStart) return validationFailure($('#examEndDate'), '시험 종료일을 다시 확인해 주세요.');
    if (timeToMinutes($('#weekdayEnd').value) <= timeToMinutes($('#weekdayStart').value)) {
      return validationFailure($('#weekdayEnd'), '평일 공부 종료 시간을 다시 확인해 주세요.');
    }
    if (timeToMinutes($('#weekendEnd').value) <= timeToMinutes($('#weekendStart').value)) {
      return validationFailure($('#weekendEnd'), '주말 공부 종료 시간을 다시 확인해 주세요.');
    }
    if (safeNumber($('#weekdayMax').value) < safeNumber($('#weekdayTarget').value)) {
      return validationFailure($('#weekdayMax'), '평일 최대 공부시간은 희망 공부시간보다 짧을 수 없습니다.');
    }
    if (safeNumber($('#weekendMax').value) < safeNumber($('#weekendTarget').value)) {
      return validationFailure($('#weekendMax'), '주말 최대 공부시간은 희망 공부시간보다 짧을 수 없습니다.');
    }
  }

  if (route === 'setup/subjects') {
    const cards = $$('.subject-card');
    if (!cards.length) {
      showToast('최소 한 과목을 추가해 주세요.');
      return false;
    }
    for (const card of cards) {
      const nameInput = $('.subject-name', card);
      const dateInput = $('.subject-exam-date', card);
      if (!nameInput.value.trim()) {
        expandSubjectCard(card);
        card.classList.add('invalid');
        return validationFailure(nameInput, '모든 과목의 이름을 입력해 주세요.');
      }
      if (!dateInput.value) {
        expandSubjectCard(card);
        card.classList.add('invalid');
        return validationFailure(dateInput, '모든 과목의 시험 날짜를 입력해 주세요.');
      }
      if (parseDate(dateInput.value) < parseDate(state.settings.studyStartDate)) {
        expandSubjectCard(card);
        card.classList.add('invalid');
        return validationFailure(dateInput, `${nameInput.value} 시험 날짜가 준비 시작일보다 빠릅니다.`);
      }
    }
  }

  if (route === 'setup/schedule') {
    for (const row of $$('.schedule-item')) {
      const start = $('.schedule-start', row);
      const end = $('.schedule-end', row);
      if (timeToMinutes(end.value) <= timeToMinutes(start.value)) {
        return validationFailure(end, '고정 일정의 종료 시간을 다시 확인해 주세요.');
      }
    }
  }

  return true;
}

function validateAllSetup() {
  return SETUP_ROUTES.slice(0, 3).every(validateRoute);
}

function clearInvalidFields() {
  $$('[aria-invalid="true"]').forEach(element => element.removeAttribute('aria-invalid'));
  $$('.subject-card.invalid').forEach(card => card.classList.remove('invalid'));
}

function validationFailure(element, message) {
  element.setAttribute('aria-invalid', 'true');
  element.focus({ preventScroll: true });
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast(message);
  return false;
}

function hydrateSettings() {
  const fields = [
    'planName', 'grade', 'studyStartDate', 'examStartDate', 'examEndDate',
    'weekdayTarget', 'weekendTarget', 'weekdayMax', 'weekendMax',
    'weekdayStart', 'weekdayEnd', 'weekendStart', 'weekendEnd',
    'sessionLength', 'breakLength', 'minSleep', 'planStyle'
  ];
  fields.forEach(id => {
    const element = $(`#${id}`);
    if (element && state.settings[id] != null) element.value = state.settings[id];
  });
}

function collectSettings() {
  return {
    planName: $('#planName').value.trim(),
    grade: $('#grade').value,
    studyStartDate: $('#studyStartDate').value,
    examStartDate: $('#examStartDate').value,
    examEndDate: $('#examEndDate').value,
    weekdayTarget: safeNumber($('#weekdayTarget').value, 150),
    weekendTarget: safeNumber($('#weekendTarget').value, 300),
    weekdayMax: safeNumber($('#weekdayMax').value, 210),
    weekendMax: safeNumber($('#weekendMax').value, 420),
    weekdayStart: $('#weekdayStart').value,
    weekdayEnd: $('#weekdayEnd').value,
    weekendStart: $('#weekendStart').value,
    weekendEnd: $('#weekendEnd').value,
    sessionLength: safeNumber($('#sessionLength').value, 40),
    breakLength: safeNumber($('#breakLength').value, 10),
    minSleep: safeNumber($('#minSleep').value, 8),
    planStyle: $('#planStyle').value
  };
}

function collectSubjects() {
  return $$('.subject-card').map(card => readSubjectCard(card));
}

function readSubjectCard(card) {
  return {
    id: card.dataset.subjectId || uid('subject'),
    name: $('.subject-name', card).value.trim(),
    examDate: $('.subject-exam-date', card).value,
    score: nullableNumber($('.subject-score', card).value),
    targetScore: safeNumber($('.subject-target-score', card).value, 80),
    confidence: safeNumber($('.subject-confidence', card).value, 3),
    difficulty: safeNumber($('.subject-difficulty', card).value, 2),
    units: safeNumber($('.subject-units', card).value, 20),
    unitType: $('.subject-unit-type', card).value,
    material: $('.subject-material', card).value,
    range: $('.subject-range', card).value.trim(),
    weakness: $('.subject-weakness', card).value
  };
}

function collectSchedules() {
  return $$('.schedule-item').map(row => ({
    id: row.dataset.scheduleId || uid('schedule'),
    day: safeNumber($('.schedule-day', row).value, 1),
    label: $('.schedule-label', row).value.trim() || '고정 일정',
    start: $('.schedule-start', row).value,
    end: $('.schedule-end', row).value
  }));
}

function syncSetupState({ markDirty = false, save = true } = {}) {
  state.settings = collectSettings();
  state.subjects = collectSubjects();
  state.schedules = collectSchedules();
  if (markDirty && state.tasks.length) state.isPlanStale = true;
  if (save) {
    setSaveStatus('saving');
    saveDebounced();
  }
}

function setSaveStatus(status) {
  const dot = $('.save-dot');
  const label = $('#saveStatus');
  dot.classList.toggle('saving', status === 'saving');
  label.textContent = status === 'saving' ? '저장 중…' : '저장됨';
}

function renderPeriodPreview() {
  const preview = $('#periodPreview');
  const start = parseDate($('#studyStartDate').value);
  const examStart = parseDate($('#examStartDate').value);
  const examEnd = parseDate($('#examEndDate').value);
  preview.classList.remove('error');
  if (!start || !examStart || !examEnd) {
    preview.textContent = '날짜를 입력하면 준비 기간을 계산합니다.';
    return;
  }
  if (examStart < start || examEnd < examStart) {
    preview.classList.add('error');
    preview.textContent = '날짜 순서를 다시 확인해 주세요.';
    return;
  }
  const prepDays = daysBetween(start, examStart);
  const examDays = daysBetween(examStart, examEnd) + 1;
  preview.textContent = `${prepDays}일 준비 · ${examDays}일 시험`;
}

function applyTimePreset(key) {
  const preset = TIME_PRESETS[key];
  if (!preset) return;
  Object.entries(preset).forEach(([id, value]) => { $(`#${id}`).value = value; });
  $$('[data-time-preset]').forEach(button => button.classList.toggle('active', button.dataset.timePreset === key));
  syncSetupState({ markDirty: true, save: true });
  showToast('공부시간 프리셋을 적용했습니다.');
}

function renderSubjects() {
  const container = $('#subjectsContainer');
  container.innerHTML = '';
  state.subjects.forEach((subject, index) => appendSubjectCard(subject, { expanded: index === 0 }));
}

function addSubject() {
  syncSetupState({ markDirty: true, save: false });
  const subject = {
    ...DEFAULT_SUBJECT,
    id: uid('subject'),
    examDate: state.settings.examStartDate
  };
  state.subjects.push(subject);
  const card = appendSubjectCard(subject, { expanded: true });
  syncSetupState({ markDirty: true, save: true });
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('.subject-name', card).focus();
}

function appendSubjectCard(subject, { expanded = false } = {}) {
  const fragment = $('#subjectTemplate').content.cloneNode(true);
  const card = $('.subject-card', fragment);
  card.dataset.subjectId = subject.id || uid('subject');
  card.style.setProperty('--subject-color', subjectColor(card.dataset.subjectId));
  card.classList.toggle('expanded', expanded);
  $('.subject-toggle', card).setAttribute('aria-expanded', String(expanded));

  $('.subject-name', card).value = subject.name || '';
  $('.subject-exam-date', card).value = subject.examDate || state.settings.examStartDate;
  $('.subject-score', card).value = subject.score ?? '';
  $('.subject-target-score', card).value = subject.targetScore ?? 80;
  $('.subject-confidence', card).value = subject.confidence ?? 3;
  $('.subject-difficulty', card).value = subject.difficulty ?? 2;
  $('.subject-units', card).value = subject.units ?? 20;
  $('.subject-unit-type', card).value = subject.unitType || 'page';
  $('.subject-material', card).value = subject.material || '교과서·학교 학습지';
  $('.subject-range', card).value = subject.range || '';
  $('.subject-weakness', card).value = subject.weakness || 'none';

  const hasDetails = Boolean(subject.range || subject.weakness !== 'none' || subject.material === '자료 부족');
  $('.details-toggle', card).setAttribute('aria-expanded', String(hasDetails));
  $('.subject-details', card).hidden = !hasDetails;
  $('.details-toggle span', card).textContent = '+';

  $('#subjectsContainer').appendChild(fragment);
  const appended = $('#subjectsContainer').lastElementChild;
  syncSubjectCard(appended);
  return appended;
}

function syncSubjectCard(card) {
  const subject = readSubjectCard(card);
  const displayName = subject.name || '새 과목';
  const examLabel = subject.examDate ? `${formatDate(subject.examDate)} 시험` : '시험 날짜 미입력';
  const scoreLabel = subject.score == null ? '이전 성적 없음' : `${subject.score}점 → ${subject.targetScore}점`;
  const risk = riskLevel(subject);
  const advice = recommendationFor(subject);

  $('.subject-display-name', card).textContent = displayName;
  $('.subject-summary', card).textContent = `${examLabel} · ${scoreLabel}`;
  const badge = $('.subject-risk-badge', card);
  badge.textContent = subject.name ? risk.label : '입력 중';
  badge.className = `subject-risk-badge${subject.name ? ` ${risk.key}` : ''}`;
  $('.subject-estimated-time', card).textContent = formatMinutes(estimateSubjectMinutes(subject));
  $('.subject-method-preview', card).textContent = advice.title;
  card.classList.remove('invalid');
}

function updateAllSubjectCards() {
  $$('.subject-card').forEach(syncSubjectCard);
}

function toggleSubjectCard(card) {
  const expanded = !card.classList.contains('expanded');
  card.classList.toggle('expanded', expanded);
  $('.subject-toggle', card).setAttribute('aria-expanded', String(expanded));
}

function expandSubjectCard(card) {
  card.classList.add('expanded');
  $('.subject-toggle', card).setAttribute('aria-expanded', 'true');
}

function toggleSubjectDetails(card) {
  const button = $('.details-toggle', card);
  const details = $('.subject-details', card);
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  details.hidden = !expanded;
}

function duplicateSubject(card) {
  syncSetupState({ markDirty: true, save: false });
  const source = readSubjectCard(card);
  const copy = { ...source, id: uid('subject'), name: source.name ? `${source.name} 복사` : '' };
  state.subjects.push(copy);
  const newCard = appendSubjectCard(copy, { expanded: true });
  syncSetupState({ markDirty: true, save: true });
  newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('과목을 복제했습니다.');
}

function removeSubject(card) {
  if ($$('.subject-card').length <= 1) {
    showToast('최소 한 과목은 남겨 두어야 합니다.');
    return;
  }
  const name = $('.subject-name', card).value.trim();
  if (name && !confirm(`${name} 과목을 삭제할까요?`)) return;
  card.remove();
  syncSetupState({ markDirty: true, save: true });
  showToast('과목을 삭제했습니다.');
}

function subjectColor(id) {
  let hash = 0;
  for (const character of String(id)) hash = ((hash << 5) - hash) + character.charCodeAt(0);
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

function renderSchedules() {
  const container = $('#schedulesContainer');
  container.innerHTML = '';
  state.schedules.forEach(schedule => appendScheduleRow(schedule));
  updateEmptyScheduleState();
  renderScheduleConflicts();
}

function addSchedule() {
  const schedule = { id: uid('schedule'), day: 1, label: '', start: '18:00', end: '20:30' };
  appendScheduleRow(schedule);
  syncSetupState({ markDirty: true, save: true });
  updateEmptyScheduleState();
  const row = $('#schedulesContainer').lastElementChild;
  $('.schedule-label', row).focus();
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

function removeSchedule(row) {
  row.remove();
  syncSetupState({ markDirty: true, save: true });
  updateEmptyScheduleState();
  renderScheduleConflicts();
}

function updateEmptyScheduleState() {
  $('#emptyScheduleState').hidden = $$('.schedule-item').length > 0;
}

function renderScheduleConflicts() {
  updateEmptyScheduleState();
  const conflicts = detectScheduleConflicts(collectSchedules());
  const alert = $('#scheduleConflictAlert');
  if (!conflicts.length) {
    alert.hidden = true;
    alert.textContent = '';
    return;
  }
  alert.hidden = false;
  alert.textContent = conflicts.join(' ');
}

function renderReviewPage() {
  const available = estimateAvailableMinutes(state);
  const needed = state.subjects.reduce((sum, subject) => sum + estimateSubjectMinutes(subject), 0);
  const preparationDays = daysBetween(state.settings.studyStartDate, state.settings.examStartDate);
  const ratio = available ? Math.round(needed / available * 100) : 999;
  const capacityWidth = clamp(ratio, 0, 100);
  const conflicts = detectScheduleConflicts(state.schedules);

  const subjectRows = state.subjects.map(subject => {
    const risk = riskLevel(subject);
    return `
      <div class="review-subject-item">
        <span><strong>${escapeHTML(subject.name || '이름 없는 과목')}</strong><small>${escapeHTML(subject.range || `${subject.units}${UNIT_LABELS[subject.unitType]} 범위`)}</small></span>
        <span>${formatDate(subject.examDate)}<br>${formatMinutes(estimateSubjectMinutes(subject))} · ${risk.label}</span>
      </div>`;
  }).join('');

  const checks = [
    `<div class="review-check">${preparationDays}일의 준비 기간을 사용합니다.</div>`,
    `<div class="review-check">${state.subjects.length}개 과목을 작은 학습 단위로 분할합니다.</div>`,
    `<div class="review-check">희망 공부시간의 15%를 미완료 대응용으로 남깁니다.</div>`,
    ...(conflicts.length ? [`<div class="review-check warning">고정 일정 시간이 일부 겹치지만 중복 시간은 한 번만 제외합니다.</div>`] : []),
    ...(ratio > 100 ? [`<div class="review-check warning">예상 필요시간이 기본 가용시간보다 ${ratio - 100}% 많습니다. 최대 공부시간 일부가 사용될 수 있습니다.</div>`] : [])
  ].join('');

  $('#reviewSummary').innerHTML = `
    <div class="review-main">
      <div class="review-metrics">
        <article class="review-metric"><span>준비 기간</span><strong>${preparationDays}일</strong><small>${formatDate(state.settings.studyStartDate)}부터</small></article>
        <article class="review-metric"><span>예상 필요시간</span><strong>${formatMinutes(needed)}</strong><small>성적·난이도·범위 반영</small></article>
        <article class="review-metric"><span>기본 가용시간</span><strong>${formatMinutes(available)}</strong><small>완충 시간 제외</small></article>
      </div>
      <article class="capacity-card">
        <header><h2>시간 충족도</h2><span>${ratio <= 100 ? `약 ${formatMinutes(available - needed)} 여유` : `약 ${formatMinutes(needed - available)} 부족`}</span></header>
        <div class="capacity-bar ${ratio > 100 ? 'over' : ''}"><span style="width:${capacityWidth}%"></span></div>
        <div class="capacity-labels"><span>필요 ${formatMinutes(needed)}</span><span>가용 ${formatMinutes(available)}</span></div>
      </article>
      <article class="panel">
        <div class="panel-heading"><div><h2>과목별 예상 학습량</h2></div></div>
        <div class="review-subject-list">${subjectRows}</div>
      </article>
    </div>
    <aside class="review-side">
      <article class="panel">
        <div class="panel-heading"><div><h2>계획 적용 기준</h2></div></div>
        <div class="review-checklist">${checks}</div>
      </article>
      <article class="panel compact-panel">
        <div class="panel-heading"><div><h2>입력 요약</h2></div></div>
        <div class="mini-stat-list">
          <div class="mini-stat"><span>반복 일정</span><strong>${state.schedules.length}개</strong></div>
          <div class="mini-stat"><span>세션 길이</span><strong>${state.settings.sessionLength}분</strong></div>
          <div class="mini-stat"><span>우선순위</span><strong>${planStyleLabel(state.settings.planStyle)}</strong></div>
          <div class="mini-stat"><span>최소 수면</span><strong>${state.settings.minSleep}시간</strong></div>
        </div>
      </article>
    </aside>`;

  const overCapacity = needed > available;
  $('#generateBarTitle').textContent = overCapacity ? '일부 최대 공부시간을 사용해야 합니다.' : '현실적인 범위 안에서 계획을 만들 수 있습니다.';
  $('#generateBarDescription').textContent = overCapacity
    ? '그래도 배치하지 못한 분량은 계획 생성 후 경고로 정확히 표시합니다.'
    : '개념, 문제 연습, 인출, 누적 복습 순서로 캘린더를 구성합니다.';
}

function planStyleLabel(style) {
  return ({ balanced: '균형형', score: '성적 향상형', deadline: '마감 우선형' })[style] || '균형형';
}

function generatePlan() {
  syncSetupState({ markDirty: false, save: false });
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
  showToast('학습 계획을 생성했습니다.');
}

function renderDashboardShell() {
  $('#sidebarPlanName').textContent = state.settings.planName || '시험 계획';
  $('#sidebarPlanPeriod').textContent = `${formatShortDate(state.settings.studyStartDate)} – ${formatShortDate(state.settings.examEndDate)}`;
  const todayKey = isoDate(todayLocal());
  const todayPending = state.tasks.filter(task => task.scheduledDate === todayKey && task.status !== 'completed').length;
  $('#todayCountBadge').textContent = String(todayPending);
}

function renderTodayPage() {
  const today = todayLocal();
  const todayKey = isoDate(today);
  const todayTasks = state.tasks
    .filter(task => task.scheduledDate === todayKey)
    .sort(taskSort);
  const pendingToday = todayTasks.filter(task => task.status !== 'completed');
  const completedToday = todayTasks.filter(task => task.status === 'completed');
  const totalTodayMinutes = todayTasks.reduce((sum, task) => sum + task.duration, 0);
  const completedTodayMinutes = completedToday.reduce((sum, task) => sum + task.duration, 0);
  const todayPercentage = totalTodayMinutes ? Math.round(completedTodayMinutes / totalTodayMinutes * 100) : 0;
  const overall = planProgress(state.tasks);
  const nextTask = pendingToday[0] || nextPendingTask();

  $('#todayDateLabel').textContent = formatDate(today, { year: true, weekday: true });
  $('#todayPageSummary').textContent = pendingToday.length
    ? `${pendingToday.length}개의 공부가 남아 있습니다. 한 번에 하나씩 끝내세요.`
    : todayTasks.length ? '오늘 계획을 모두 끝냈습니다.' : '오늘 배치된 공부가 없습니다.';

  renderDashboardAlerts();
  renderNextTaskFeature(nextTask, pendingToday.length > 0);
  $('#todayProgressLabel').textContent = `${completedToday.length}/${todayTasks.length}개 완료 · ${formatMinutes(completedTodayMinutes)}`;
  $('#todayProgressRing').style.setProperty('--progress', todayPercentage);
  $('#todayProgressRing').innerHTML = `<span>${todayPercentage}%</span>`;
  $('#todayTasks').innerHTML = todayTasks.length
    ? todayTasks.map(task => taskItemHTML(task)).join('')
    : emptyStateHTML('오늘 예정된 공부가 없습니다.', '주간 계획에서 다음 일정을 확인하세요.');

  const examStart = parseDate(state.settings.examStartDate);
  const daysLeft = Math.max(0, daysBetween(today, examStart));
  const pendingMinutes = state.tasks.filter(task => task.status !== 'completed').reduce((sum, task) => sum + task.duration, 0);
  const bufferMinutes = state.tasks.filter(task => task.status !== 'completed' && task.isBuffer).reduce((sum, task) => sum + task.duration, 0);
  $('#todayStats').innerHTML = `
    <div class="mini-stat"><span>시험까지</span><strong>D-${daysLeft}</strong></div>
    <div class="mini-stat"><span>전체 진행률</span><strong>${overall.percentage}%</strong></div>
    <div class="mini-stat"><span>남은 학습량</span><strong>${formatMinutes(pendingMinutes)}</strong></div>
    <div class="mini-stat"><span>여유시간 사용</span><strong>${formatMinutes(bufferMinutes)}</strong></div>`;

  const highestRisk = [...state.subjects].sort((a, b) => subjectRisk(b) - subjectRisk(a))[0];
  const advice = highestRisk ? recommendationFor(highestRisk) : null;
  $('#dailyAdvice').innerHTML = advice
    ? `<strong>${escapeHTML(highestRisk.name)} · ${escapeHTML(advice.title)}</strong><p>${escapeHTML(advice.body)}</p>`
    : '<p>과목 정보를 입력하면 공부법을 추천합니다.</p>';
}

function renderDashboardAlerts() {
  const alerts = [];
  if (state.isPlanStale) alerts.push({ type: 'warning', text: '계획 설정이 변경되었습니다. 설정 화면의 최종 확인에서 계획을 다시 생성해야 변경 내용이 반영됩니다.' });
  if (state.recoveryNotice && state.recoveryNoticeDate === isoDate(todayLocal())) alerts.push({ type: 'warning', text: state.recoveryNotice });
  state.warnings.forEach(warning => alerts.push({ type: warning.includes('어렵') ? 'danger' : 'warning', text: warning }));
  if (!alerts.length) alerts.push({ type: 'success', text: '현재 일정에서 충돌이나 미배치 학습량이 발견되지 않았습니다.' });
  $('#dashboardAlerts').innerHTML = alerts.map(alert => `<div class="alert-item ${alert.type}">${escapeHTML(alert.text)}</div>`).join('');
}

function renderNextTaskFeature(task, isTodayTask) {
  const feature = $('#nextTaskFeature');
  if (!task) {
    feature.className = 'next-task-feature empty';
    feature.innerHTML = `<div><span class="next-label">계획 완료</span><h2>남아 있는 학습 일정이 없습니다.</h2><p>시험 전 핵심 오답과 준비물을 마지막으로 확인하세요.</p></div>`;
    return;
  }
  feature.className = 'next-task-feature';
  const when = isTodayTask
    ? `${task.startTime} 시작 · ${task.duration}분`
    : `${formatDate(task.scheduledDate)} ${task.startTime || ''} · ${task.duration}분`;
  feature.innerHTML = `
    <div>
      <span class="next-label">${isTodayTask ? '다음 공부' : '다음 예정'}</span>
      <h2>${escapeHTML(task.title)}</h2>
      <p>${escapeHTML(task.material)} · ${escapeHTML(task.detail)} · ${when}</p>
    </div>
    <button class="primary-button large-button" type="button" data-task-action="focus" data-task-id="${task.id}">집중 시작</button>`;
}

function taskItemHTML(task) {
  const color = subjectColor(task.subjectId);
  const status = taskStatus(task);
  const completed = task.status === 'completed';
  return `
    <article class="task-item" style="--task-color:${color}">
      <div class="task-time"><strong>${task.startTime || '--:--'}</strong><span>${task.duration}분</span></div>
      <span class="task-subject-line" aria-hidden="true"></span>
      <div class="task-content">
        <h3>${escapeHTML(task.title)}</h3>
        <p>${escapeHTML(task.detail)} · 완료 기준: ${escapeHTML(task.completion)}</p>
        <div class="task-tags">
          <span class="task-tag">${escapeHTML(stageLabel(task.type))}</span>
          ${task.isBuffer ? '<span class="task-tag rescheduled">여유시간 사용</span>' : ''}
          ${task.rescheduledCount ? `<span class="task-tag rescheduled">재배치 ${task.rescheduledCount}회</span>` : ''}
          ${completed ? '<span class="task-tag">완료</span>' : ''}
        </div>
      </div>
      <div class="task-actions">
        ${completed
          ? '<span class="status-pill completed">완료됨</span>'
          : `<button class="task-action-main" type="button" data-task-action="focus" data-task-id="${task.id}">시작</button>
             <div class="task-inline-menu">
               <button class="task-action-more" type="button" data-task-menu aria-label="추가 작업">···</button>
               <div class="task-menu-popover" hidden>
                 <button type="button" data-task-action="complete" data-task-id="${task.id}">바로 완료 처리</button>
                 <button type="button" data-task-action="partial" data-task-id="${task.id}">일부만 완료</button>
                 <button type="button" data-task-action="postpone" data-task-id="${task.id}">못함 · 뒤로 미루기</button>
               </div>
             </div>`}
      </div>
    </article>`;
}

function nextPendingTask() {
  return state.tasks
    .filter(task => task.status !== 'completed' && task.scheduledDate)
    .sort(taskSort)[0] || null;
}

function taskSort(first, second) {
  const firstDate = first.scheduledDate || '9999-12-31';
  const secondDate = second.scheduledDate || '9999-12-31';
  return firstDate.localeCompare(secondDate)
    || String(first.startTime || '99:99').localeCompare(String(second.startTime || '99:99'))
    || Number(second.priority || 0) - Number(first.priority || 0);
}

function toggleTaskMenu(button) {
  const menu = button.nextElementSibling;
  const shouldOpen = menu.hidden;
  closeAllTaskMenus();
  menu.hidden = !shouldOpen;
}

function closeAllTaskMenus() {
  $$('.task-menu-popover').forEach(menu => { menu.hidden = true; });
}

function handleTaskAction(taskId, action) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  if (action === 'focus') openFocusDialog(task);
  if (action === 'complete') completeTask(task);
  if (action === 'partial') openPartialDialog(task);
  if (action === 'postpone') postponeTask(task);
}

function saveUndoSnapshot() {
  undoSnapshot = typeof structuredClone === 'function'
    ? structuredClone(state)
    : JSON.parse(JSON.stringify(state));
}

function completeTask(task) {
  saveUndoSnapshot();
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  persistAndRender();
  showToast('완료 처리했습니다.', '되돌리기', undoLastAction);
}

function postponeTask(task) {
  saveUndoSnapshot();
  const baseDate = task.scheduledDate ? parseDate(task.scheduledDate) : todayLocal();
  task.rescheduledCount = Number(task.rescheduledCount || 0) + 1;
  task.lastMissedAt = new Date().toISOString();
  task.earliestOverride = isoDate(addDays(baseDate > todayLocal() ? baseDate : todayLocal(), 1));
  task.scheduledDate = null;
  task.startTime = null;
  task.endTime = null;
  scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
  persistAndRender();
  showToast('남은 일정으로 다시 배치했습니다.', '되돌리기', undoLastAction);
}

function openPartialDialog(task) {
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
  if (!task) return;
  const percent = safeNumber($('#partialRange').value, 50);
  saveUndoSnapshot();
  const originalDuration = task.duration;
  const completedDuration = clamp(Math.round(originalDuration * percent / 100), 5, originalDuration - 5);
  const remainingDuration = originalDuration - completedDuration;
  const originalDate = task.scheduledDate ? parseDate(task.scheduledDate) : todayLocal();
  const baseTitle = task.baseTitle || task.title.replace(/ · 남은 분량$/, '');

  task.duration = completedDuration;
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.partialPercent = percent;
  task.baseTitle = baseTitle;

  state.tasks.push({
    ...task,
    id: uid('task'),
    title: `${baseTitle} · 남은 분량`,
    baseTitle,
    duration: remainingDuration,
    originalDuration: remainingDuration,
    status: 'pending',
    completedAt: null,
    partialPercent: null,
    scheduledDate: null,
    startTime: null,
    endTime: null,
    isBuffer: false,
    rescheduledCount: Number(task.rescheduledCount || 0) + 1,
    earliestOverride: isoDate(addDays(originalDate > todayLocal() ? originalDate : todayLocal(), 1)),
    createdAt: new Date().toISOString()
  });

  $('#partialDialog').close();
  scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
  persistAndRender();
  showToast(`${percent}%를 완료하고 남은 분량을 재배치했습니다.`, '되돌리기', undoLastAction);
}

function rebalanceTasks(showMessage = false) {
  saveUndoSnapshot();
  scheduleTasks(state, { keepCompleted: true, fromDate: todayLocal() });
  persistAndRender();
  if (showMessage) showToast('완료 기록을 유지하고 남은 계획을 재조정했습니다.', '되돌리기', undoLastAction);
}

function undoLastAction() {
  if (!undoSnapshot) return;
  state = undoSnapshot;
  undoSnapshot = null;
  state = saveState(state);
  renderCurrentDashboardPage();
  showToast('이전 상태로 되돌렸습니다.');
}

function persistAndRender() {
  state = saveState(state);
  renderDashboardShell();
  renderCurrentDashboardPage();
}

function renderCurrentDashboardPage() {
  if (currentRoute === 'dashboard/today') renderTodayPage();
  if (currentRoute === 'dashboard/week') renderWeekPage();
  if (currentRoute === 'dashboard/subjects') renderSubjectsAnalysisPage();
  if (currentRoute === 'dashboard/tasks') renderTasksPage();
}

function openFocusDialog(task) {
  focusTaskId = task.id;
  focusInitialSeconds = Math.max(60, Number(task.duration || 40) * 60);
  focusSeconds = focusInitialSeconds;
  $('#focusTaskTitle').textContent = task.title;
  $('#focusTaskMeta').textContent = `${task.material} · ${task.detail}`;
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
  $('#focusToggleButton').textContent = '일시정지';
  focusTimerId = setInterval(() => {
    focusSeconds = Math.max(0, focusSeconds - 1);
    updateFocusTimerDisplay();
    if (focusSeconds === 0) {
      pauseFocusTimer();
      $('#focusToggleButton').textContent = '끝남';
      showToast('집중 시간이 끝났습니다. 실제 완료 상태를 선택하세요.');
    }
  }, 1000);
}

function pauseFocusTimer() {
  if (focusTimerId) clearInterval(focusTimerId);
  focusTimerId = null;
}

function resetFocusTimer() {
  pauseFocusTimer();
  focusSeconds = focusInitialSeconds;
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

function renderWeekPage() {
  const days = Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  const todayKey = isoDate(todayLocal());
  $('#weekRangeLabel').textContent = `${formatDate(days[0], { year: true })} – ${formatDate(days[6])}`;

  $('#calendarGrid').innerHTML = days.map(date => {
    const key = isoDate(date);
    const tasks = state.tasks.filter(task => task.scheduledDate === key).sort(taskSort);
    const total = tasks.reduce((sum, task) => sum + task.duration, 0);
    return `
      <article class="calendar-day ${key === todayKey ? 'today' : ''}">
        <header class="calendar-day-header"><strong>${KOREAN_DAYS[date.getDay()]}요일</strong><span>${formatShortDate(date)}</span></header>
        <div class="calendar-day-tasks">
          ${tasks.length ? tasks.map(calendarTaskHTML).join('') : '<div class="calendar-empty">일정 없음</div>'}
        </div>
        <div class="day-total">총 ${formatMinutes(total)}</div>
      </article>`;
  }).join('');

  $('#weekList').innerHTML = days.map(date => {
    const key = isoDate(date);
    const tasks = state.tasks.filter(task => task.scheduledDate === key).sort(taskSort);
    return `
      <article class="mobile-day ${key === todayKey ? 'today' : ''}">
        <header><strong>${KOREAN_DAYS[date.getDay()]}요일</strong><span>${formatDate(date)}</span></header>
        ${tasks.length ? tasks.map(task => `
          <div class="mobile-calendar-task">
            <strong>${escapeHTML(task.title)}</strong>
            <span>${task.startTime}–${task.endTime} · ${task.duration}분 · ${task.status === 'completed' ? '완료' : stageLabel(task.type)}</span>
          </div>`).join('') : '<div class="calendar-empty">일정 없음</div>'}
      </article>`;
  }).join('');
}

function calendarTaskHTML(task) {
  return `
    <div class="calendar-task ${task.status === 'completed' ? 'completed' : ''}" style="--task-color:${subjectColor(task.subjectId)}" title="${escapeHTML(task.title)}">
      <strong>${escapeHTML(task.title)}</strong>
      <span>${task.startTime} · ${task.duration}분</span>
    </div>`;
}

function renderSubjectsAnalysisPage() {
  $('#subjectAnalysisGrid').innerHTML = state.subjects.map(subject => {
    const progress = subjectProgress(state.tasks, subject.id);
    const risk = riskLevel(subject);
    const advice = recommendationFor(subject);
    const daysLeft = Math.max(0, daysBetween(todayLocal(), subject.examDate));
    return `
      <article class="analysis-card" style="--subject-color:${subjectColor(subject.id)}">
        <header>
          <div><h2>${escapeHTML(subject.name)}</h2><p>${formatDate(subject.examDate)} 시험 · ${risk.label}</p></div>
          <div class="readiness-score"><strong>${progress.percentage}%</strong><span>계획 진행률</span></div>
        </header>
        <div class="progress-track"><span style="width:${progress.percentage}%"></span></div>
        <div class="analysis-metrics">
          <div class="analysis-metric"><span>시험까지</span><strong>D-${daysLeft}</strong></div>
          <div class="analysis-metric"><span>완료 학습</span><strong>${formatMinutes(progress.completed)}</strong></div>
          <div class="analysis-metric"><span>남은 일정</span><strong>${progress.pendingCount}개</strong></div>
        </div>
        <div class="method-box"><strong>${escapeHTML(advice.title)}</strong><p>${escapeHTML(advice.body)}</p></div>
      </article>`;
  }).join('');
}

function renderTasksPage() {
  updateSubjectFilterOptions();
  const query = $('#taskSearch').value.trim().toLowerCase();
  const subjectId = $('#subjectFilter').value;
  const statusFilter = $('#taskFilter').value;
  const tasks = [...state.tasks].filter(task => {
    const matchesQuery = !query || `${task.title} ${task.subjectName} ${task.detail}`.toLowerCase().includes(query);
    const matchesSubject = subjectId === 'all' || task.subjectId === subjectId;
    const status = taskStatus(task).key;
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'pending' && task.status !== 'completed' && task.scheduledDate)
      || status === statusFilter;
    return matchesQuery && matchesSubject && matchesStatus;
  }).sort(taskSort);

  const pendingMinutes = tasks.filter(task => task.status !== 'completed').reduce((sum, task) => sum + task.duration, 0);
  $('#taskResultSummary').textContent = `${tasks.length}개 일정 · 남은 학습량 ${formatMinutes(pendingMinutes)}`;
  $('#allTasks').innerHTML = tasks.length ? `
    <table class="task-table">
      <thead><tr><th>학습 내용</th><th>과목</th><th>단계</th><th>일정</th><th>시간</th><th>상태</th><th>처리</th></tr></thead>
      <tbody>${tasks.map(taskTableRowHTML).join('')}</tbody>
    </table>` : emptyStateHTML('조건에 맞는 일정이 없습니다.', '검색어나 필터를 변경해 보세요.');
}

function updateSubjectFilterOptions() {
  const select = $('#subjectFilter');
  const current = select.value || 'all';
  select.innerHTML = '<option value="all">모든 과목</option>' + state.subjects.map(subject => `<option value="${subject.id}">${escapeHTML(subject.name)}</option>`).join('');
  select.value = [...select.options].some(option => option.value === current) ? current : 'all';
}

function taskTableRowHTML(task) {
  const status = taskStatus(task);
  return `
    <tr>
      <td class="task-table-title"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.detail)}</small></td>
      <td>${escapeHTML(task.subjectName)}</td>
      <td>${escapeHTML(TYPE_LABELS[task.type] || task.type)}</td>
      <td>${task.scheduledDate ? `${formatDate(task.scheduledDate)} ${task.startTime}` : '미배치'}</td>
      <td>${task.duration}분</td>
      <td><span class="status-pill ${status.key}">${escapeHTML(status.label)}</span></td>
      <td>${task.status === 'completed' ? '—' : `<div class="table-action-row">
        <button type="button" data-task-action="complete" data-task-id="${task.id}">완료</button>
        <button type="button" data-task-action="partial" data-task-id="${task.id}">일부</button>
        <button type="button" data-task-action="postpone" data-task-id="${task.id}">미루기</button>
      </div>`}</td>
    </tr>`;
}

function emptyStateHTML(title, description) {
  return `<div class="empty-state"><strong>${escapeHTML(title)}</strong><p>${escapeHTML(description)}</p></div>`;
}

function exportICS() {
  const tasks = state.tasks.filter(task => task.status !== 'completed' && task.scheduledDate && task.startTime && task.endTime);
  if (!tasks.length) {
    showToast('내보낼 예정 일정이 없습니다.');
    return;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyFlow//Study Planner//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:Asia/Seoul',
    `X-WR-CALNAME:${icsEscape(state.settings.planName || 'StudyFlow 학습 계획')}`
  ];

  tasks.forEach(task => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${task.id}@studyflow`,
      `DTSTAMP:${icsUtcStamp(new Date())}`,
      `DTSTART;TZID=Asia/Seoul:${icsLocalDateTime(task.scheduledDate, task.startTime)}`,
      `DTEND;TZID=Asia/Seoul:${icsLocalDateTime(task.scheduledDate, task.endTime)}`,
      `SUMMARY:${icsEscape(`[${task.subjectName}] ${task.title}`)}`,
      `DESCRIPTION:${icsEscape(`자료: ${task.material}\n범위: ${task.detail}\n완료 기준: ${task.completion}`)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');

  downloadBlob(lines.join('\r\n'), `${safeFileName(state.settings.planName)}-study-plan.ics`, 'text/calendar;charset=utf-8');
  showToast('캘린더 파일을 만들었습니다.');
}

function icsLocalDateTime(date, time) {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
}

function icsUtcStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function toggleTheme() {
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  $('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#181a18' : '#f5f5f2');
}

function resetAll() {
  if (!confirm('저장된 입력과 생성한 계획을 모두 삭제할까요?')) return;
  clearStoredState();
  location.hash = '#/setup/exam';
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
  showToast.timer = setTimeout(hideToast, actionLabel ? 5000 : 2800);
}

function hideToast() {
  $('#toast').classList.remove('show');
  toastActionCallback = null;
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('서비스 워커 등록 실패', error));
}

