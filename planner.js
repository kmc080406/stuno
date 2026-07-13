import { TYPE_LABELS, UNIT_LABELS, UNIT_MINUTES } from './constants.js';
import {
  addDays,
  clamp,
  daysBetween,
  formatMinutes,
  isoDate,
  maxDate,
  mergeIntervals,
  minDate,
  minutesToTime,
  overlapMinutes,
  parseDate,
  timeToMinutes,
  todayLocal,
  uid
} from './utils.js';

const STAGES = [
  { type: 'concept', ratio: 0.24, startRatio: 0, endRatio: 0.40 },
  { type: 'practice', ratio: 0.36, startRatio: 0.18, endRatio: 0.67 },
  { type: 'retrieval', ratio: 0.16, startRatio: 0.45, endRatio: 0.82 },
  { type: 'review', ratio: 0.17, startRatio: 0.65, endRatio: 0.95 },
  { type: 'final', ratio: 0.07, startRatio: 0.87, endRatio: 1 }
];

const STAGE_ORDER = Object.fromEntries(STAGES.map((stage, index) => [stage.type, index]));

export function estimateSubjectMinutes(subject) {
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

export function subjectRisk(subject) {
  const gap = subject.score == null
    ? (5 - Number(subject.confidence || 3)) * 10
    : Math.max(0, Number(subject.targetScore || 80) - Number(subject.score));
  const difficulty = Number(subject.difficulty || 2) * 12;
  const volume = Math.min(30, Number(subject.units || 1) / 3);
  const weakness = subject.weakness === 'none' ? 0 : 8;
  return clamp(Math.round(gap + difficulty + volume + weakness), 0, 100);
}

export function riskLevel(subject) {
  const risk = subjectRisk(subject);
  if (risk >= 65) return { key: 'high', label: '집중 필요' };
  if (risk >= 42) return { key: 'medium', label: '주의' };
  return { key: 'low', label: '안정' };
}

export function recommendationFor(subject) {
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

export function calculatePriority(subject, settings, type) {
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

export function buildTasks(subjects, settings) {
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

export function scheduleTasks(state, { keepCompleted = true, fromDate = todayLocal() } = {}) {
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

export function estimateAvailableMinutes(state) {
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

export function detectScheduleConflicts(schedules) {
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

export function subjectProgress(tasks, subjectId) {
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

export function planProgress(tasks) {
  const total = tasks.reduce((sum, task) => sum + Number(task.duration || 0), 0);
  const completed = tasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + Number(task.duration || 0), 0);
  return { total, completed, percentage: total ? Math.round(completed / total * 100) : 0 };
}

export function taskStatus(task) {
  if (task.status === 'completed') return { key: 'completed', label: '완료' };
  if (!task.scheduledDate) return { key: 'unscheduled', label: '미배치' };
  if (task.rescheduledCount > 0) return { key: 'rescheduled', label: `재배치 ${task.rescheduledCount}회` };
  return { key: 'pending', label: task.isBuffer ? '여유시간 사용' : '예정' };
}

export function stageLabel(type) {
  return TYPE_LABELS[type] || type;
}
