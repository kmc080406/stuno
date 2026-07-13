import {
  DASHBOARD_ROUTES,
  DEFAULT_SUBJECT,
  KOREAN_DAYS,
  ROUTES,
  SETUP_ROUTES,
  SUBJECT_COLORS,
  TIME_PRESETS,
  TYPE_LABELS,
  UNIT_LABELS
} from './js/constants.js';
import {
  buildTasks,
  detectScheduleConflicts,
  estimateAvailableMinutes,
  estimateSubjectMinutes,
  planProgress,
  recommendationFor,
  riskLevel,
  scheduleTasks,
  stageLabel,
  subjectProgress,
  subjectRisk,
  taskStatus
} from './js/planner.js';
import {
  clearStoredState,
  loadState,
  loadTheme,
  saveState,
  saveTheme,
  isPersistentStorageAvailable
} from './js/storage.js';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  googleIsConnected,
  syncGoogleCalendar
} from './js/google-calendar.js';
import { completeHistoricalTask } from './js/task-history.js';
import {
  $,
  $$,
  addDays,
  clamp,
  daysBetween,
  debounce,
  downloadBlob,
  escapeHTML,
  formatDate,
  formatMinutes,
  formatShortDate,
  isoDate,
  nullableNumber,
  parseDate,
  safeFileName,
  safeNumber,
  startOfWeek,
  timeToMinutes,
  todayLocal,
  uid
} from './js/utils.js';

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
  renderRangeSubjects();
  renderSchedules();
  hydrateCalendarSettings();
  bindEvents();
  hydrating = false;
  syncSettings({ markDirty: false, save: false });
  resolveInitialRoute();
  registerServiceWorker();
  window.setInterval(() => recoverOverdueTasks({ refresh: true }), 300_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recoverOverdueTasks({ refresh: true });
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
    else label.textContent = status === 'saving' ? '저장 중…' : '이 기기에 저장됨';
  }
}

function hydrateSettings() {
  const ids = [
    'planName', 'grade', 'studyStartDate', 'examStartDate', 'examEndDate',
    'weekdayTarget', 'weekendTarget', 'weekdayMax', 'weekendMax',
    'weekdayStart', 'weekdayEnd', 'weekendStart', 'weekendEnd',
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
  const fallback = state.tasks.length ? 'dashboard/today' : 'setup/basic';
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

  const isSetup = SETUP_ROUTES.includes(route);
  $('#setupSidebar').hidden = !isSetup;
  $('#dashboardSidebar').hidden = isSetup;
  $('#mobileDashboardNav').hidden = isSetup;
  $$('[data-route-link]').forEach(link => link.classList.toggle('active', link.dataset.routeLink === route));

  if (isSetup) {
    updateSetupNavigation(route);
    if (route === 'setup/dates') renderPeriodPreview();
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
  $('#pageContent').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function pageTitleForRoute(route) {
  const titles = {
    'setup/basic': '노트 이름',
    'setup/dates': '시험 날짜',
    'setup/amount': '공부 분량',
    'setup/hours': '공부 시간대',
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
    'dashboard/sync': '캘린더 연동'
  };
  return `${titles[route] || 'STUNO'} · STUNO`;
}

function updateSetupNavigation(route) {
  const index = SETUP_ROUTES.indexOf(route);
  $('#setupProgressText').textContent = `${index + 1} / ${SETUP_ROUTES.length}`;
  $$('.step-nav a').forEach((link, linkIndex) => link.classList.toggle('completed', linkIndex < index));
}

// ---------- 이벤트 ----------

function bindEvents() {
  window.addEventListener('hashchange', () => renderRoute(routeFromHash()));
  document.body.addEventListener('click', handleDelegatedClick);
  $('#plannerForm').addEventListener('input', handleFormInput);
  $('#plannerForm').addEventListener('change', handleFormInput);

  $('#addSubjectButton').addEventListener('click', addSubject);
  $('#addScheduleButton').addEventListener('click', addSchedule);
  $('#generatePlanButton').addEventListener('click', generatePlan);
  $('#themeToggle').addEventListener('click', toggleTheme);
  $('#resetButton').addEventListener('click', resetAll);
  $('#editPlanButton').addEventListener('click', () => navigate('setup/basic'));
  $('#exportIcsButton').addEventListener('click', exportICS);
  $('#quickRebalanceButton').addEventListener('click', () => rebalanceTasks(true));
  $('#rebalanceButton').addEventListener('click', () => rebalanceTasks(true));

  $('#prevWeekButton').addEventListener('click', () => { currentWeekStart = addDays(currentWeekStart, -7); renderWeekPage(); });
  $('#nextWeekButton').addEventListener('click', () => { currentWeekStart = addDays(currentWeekStart, 7); renderWeekPage(); });
  $('#todayWeekButton').addEventListener('click', () => { currentWeekStart = startOfWeek(todayLocal()); renderWeekPage(); });

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

  $('#googleClientId').addEventListener('input', () => {
    state.calendar.clientId = $('#googleClientId').value.trim();
    setSaveStatus('saving');
    saveDebounced();
  });
  $('#googleConnectButton').addEventListener('click', connectGoogle);
  $('#googleDisconnectButton').addEventListener('click', disconnectGoogle);
  $('#googleSyncButton').addEventListener('click', syncWithGoogle);

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
  renderPeriodPreview();
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
    if (timeToMinutes($('#weekdayEnd').value) <= timeToMinutes($('#weekdayStart').value)) return validationFailure($('#weekdayEnd'), '평일 종료 시간을 다시 확인해 주세요.');
    if (timeToMinutes($('#weekendEnd').value) <= timeToMinutes($('#weekendStart').value)) return validationFailure($('#weekendEnd'), '주말 종료 시간을 다시 확인해 주세요.');
  }

  if (route === 'setup/subjects') {
    if (!state.subjects.length) {
      showToast('최소 한 과목을 추가해 주세요.');
      return false;
    }
    for (const subject of state.subjects) {
      const card = $(`.subject-card[data-subject-id="${CSS.escape(subject.id)}"]`);
      const nameInput = $('.subject-name', card);
      const dateInput = $('.subject-exam-date', card);
      if (!subject.name.trim()) return validationFailure(nameInput, '모든 과목의 이름을 입력해 주세요.');
      if (!subject.examDate) return validationFailure(dateInput, '모든 과목의 시험 날짜를 입력해 주세요.');
      if (parseDate(subject.examDate) < parseDate(state.settings.studyStartDate)) return validationFailure(dateInput, `${subject.name} 시험 날짜가 공부 시작일보다 빠릅니다.`);
    }
  }

  if (route === 'setup/ranges') {
    const invalid = state.subjects.find(subject => !subject.units || subject.units < 1);
    if (invalid) {
      const card = $(`.range-subject-card[data-subject-id="${CSS.escape(invalid.id)}"]`);
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
  renderRangeSubjects({ preserveOpen: true });
}

function addSubject() {
  const subject = { ...DEFAULT_SUBJECT, id: uid('subject'), examDate: state.settings.examStartDate };
  state.subjects.push(subject);
  renderSubjects();
  renderRangeSubjects();
  state.isPlanStale = Boolean(state.tasks.length);
  state = saveState(state);
  const card = $(`.subject-card[data-subject-id="${CSS.escape(subject.id)}"]`);
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
  showToast('이전 상태로 되돌렸습니다.');
}

function persistAndRender() {
  state = saveState(state);
  renderDashboardShell();
  renderCurrentDashboardPage();
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
  if (state.isPlanStale) alerts.push({ type: 'warning', text: '설정이 바뀌었습니다. 최종 확인에서 계획을 다시 만들면 변경 내용이 반영됩니다.' });
  if (state.recoveryNotice && state.recoveryNoticeDate === isoDate(todayLocal())) alerts.push({ type: 'warning', text: state.recoveryNotice });
  state.warnings.forEach(warning => alerts.push({ type: warning.includes('어렵') ? 'danger' : 'warning', text: warning }));
  if (!alerts.length) alerts.push({ type: 'success', text: '현재 일정에 충돌이나 미배치 학습량이 없습니다.' });
  $('#dashboardAlerts').innerHTML = alerts.map(alert => `<div class="alert-item ${alert.type}">${escapeHTML(alert.text)}</div>`).join('');
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
  feature.innerHTML = `<div><span class="next-label">${isTodayTask ? '다음 공부' : '다음 예정'}</span><h2>${escapeHTML(task.title)}</h2><p>${escapeHTML(task.material)} · ${escapeHTML(task.detail)} · ${when}</p></div><button class="primary-button large-button" type="button" data-task-action="focus" data-task-id="${task.id}">집중 시작</button>`;
}

function taskItemHTML(task) {
  const completed = task.status === 'completed';
  return `<article class="task-item" style="--task-color:${subjectColor(task.subjectId)}"><div class="task-time"><strong>${task.startTime || '--:--'}</strong><span>${task.duration}분</span></div><span class="task-subject-line" aria-hidden="true"></span><div class="task-content"><h3>${escapeHTML(task.title)}</h3><p>${escapeHTML(task.detail)} · 완료 기준: ${escapeHTML(task.completion)}</p><div class="task-tags"><span class="task-tag">${escapeHTML(stageLabel(task.type))}</span>${task.isBuffer ? '<span class="task-tag rescheduled">여유시간 사용</span>' : ''}${task.rescheduledFromDate ? `<span class="task-tag rescheduled">${formatDate(task.rescheduledFromDate)}에서 미뤄옴</span>` : ''}${completed ? '<span class="task-tag">완료</span>' : ''}</div></div><div class="task-actions">${completed ? '<span class="status-pill completed">완료됨</span>' : `<button class="task-action-main" type="button" data-task-action="focus" data-task-id="${task.id}">시작</button><div class="task-inline-menu"><button class="task-action-more" type="button" data-task-menu aria-label="추가 작업">···</button><div class="task-menu-popover" hidden><button type="button" data-task-action="complete" data-task-id="${task.id}">공부했어요</button><button type="button" data-task-action="partial" data-task-id="${task.id}">일부만 했어요</button><button type="button" data-task-action="postpone" data-task-id="${task.id}">못했어요 · 미루기</button></div></div>`}</div></article>`;
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
    return `<article class="mobile-day ${key === todayKey ? 'today' : ''}"><header><strong>${KOREAN_DAYS[date.getDay()]}요일</strong><span>${formatDate(date)}</span></header>${tasks.length ? tasks.map(task => `<div class="mobile-calendar-task"><strong>${escapeHTML(task.title)}</strong><span>${task.startTime || '--:--'} · ${task.duration}분 · ${taskStatus(task).label}</span></div>`).join('') : '<div class="calendar-empty">일정 없음</div>'}</article>`;
  }).join('');
}

function calendarTaskHTML(task) {
  const status = taskStatus(task);
  return `<div class="calendar-task ${task.status === 'completed' ? 'completed' : ''} ${task.status === 'rescheduled' ? 'rescheduled' : ''}" style="--task-color:${subjectColor(task.subjectId)}" title="${escapeHTML(task.title)}"><strong>${escapeHTML(task.title)}</strong><span>${task.startTime || '--:--'} · ${task.duration}분 · ${escapeHTML(status.label)}</span></div>`;
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
  return `<article class="history-item ${moved ? 'moved' : ''}"><div class="history-date"><strong>${formatDate(task.scheduledDate)}</strong><span>${task.startTime || '--:--'} · ${task.duration}분</span></div><div class="history-content"><h3>${escapeHTML(task.title)}</h3><p>${escapeHTML(task.subjectName)} · ${escapeHTML(task.detail)}</p><span class="status-pill ${status.key}">${escapeHTML(status.label)}</span></div><div class="history-actions">${moved ? `<button class="primary-button" type="button" data-task-action="past-complete" data-task-id="${task.id}">사실 공부했음</button>` : task.status === 'completed' ? '<span class="status-pill completed">체크됨</span>' : ''}</div></article>`;
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
  $('#taskResultSummary').textContent = `${tasks.length}개 일정 · 남은 학습량 ${formatMinutes(pendingMinutes)}`;
  $('#allTasks').innerHTML = tasks.length ? `<table class="task-table"><thead><tr><th>학습 내용</th><th>과목</th><th>단계</th><th>일정</th><th>시간</th><th>상태</th><th>처리</th></tr></thead><tbody>${tasks.map(taskTableRowHTML).join('')}</tbody></table>` : emptyStateHTML('조건에 맞는 일정이 없습니다.', '검색어나 필터를 변경해 보세요.');
}

function updateSubjectFilterOptions() {
  const select = $('#subjectFilter');
  const current = select.value || 'all';
  select.innerHTML = '<option value="all">모든 과목</option>' + state.subjects.map(subject => `<option value="${subject.id}">${escapeHTML(subject.name)}</option>`).join('');
  select.value = [...select.options].some(option => option.value === current) ? current : 'all';
}

function taskTableRowHTML(task) {
  const status = taskStatus(task);
  let action = '—';
  if (task.status === 'pending') {
    action = `<div class="table-action-row"><button type="button" data-task-action="complete" data-task-id="${task.id}">완료</button><button type="button" data-task-action="partial" data-task-id="${task.id}">일부</button><button type="button" data-task-action="postpone" data-task-id="${task.id}">미루기</button></div>`;
  } else if (task.status === 'rescheduled') {
    action = `<button type="button" data-task-action="past-complete" data-task-id="${task.id}">사실 완료함</button>`;
  }
  return `<tr><td class="task-table-title"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.detail)}</small></td><td>${escapeHTML(task.subjectName)}</td><td>${escapeHTML(TYPE_LABELS[task.type] || task.type)}</td><td>${task.scheduledDate ? `${formatDate(task.scheduledDate)} ${task.startTime || ''}` : '미배치'}</td><td>${task.duration}분</td><td><span class="status-pill ${status.key}">${escapeHTML(status.label)}</span></td><td>${action}</td></tr>`;
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
}

function closeAllTaskMenus() {
  $$('.task-menu-popover').forEach(menu => { menu.hidden = true; });
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
  focusTimerId = window.setInterval(() => {
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

// ---------- Google Calendar ----------

function hydrateCalendarSettings() {
  $('#googleClientId').value = state.calendar?.clientId || '';
}

function renderSyncPage() {
  hydrateCalendarSettings();
  renderGoogleConnectionStatus();
  const lastSync = state.calendar?.lastSyncAt ? new Date(state.calendar.lastSyncAt).toLocaleString('ko-KR') : '아직 동기화하지 않음';
  $('#googleSyncResult').className = 'sync-result';
  $('#googleSyncResult').textContent = `마지막 동기화: ${lastSync} · 연결 정보와 일정 ID는 이 브라우저에 저장됩니다.`;
}

function renderGoogleConnectionStatus(message = '') {
  const status = $('#googleConnectionStatus');
  if (googleIsConnected()) {
    status.className = 'connection-status connected';
    status.textContent = message || 'Google 계정이 연결되었습니다. 이제 계획을 동기화할 수 있습니다.';
  } else {
    status.className = 'connection-status';
    status.textContent = message || '연결되지 않음 · 페이지를 새로 열면 보안을 위해 다시 연결해야 합니다.';
  }
}

async function connectGoogle() {
  const clientId = $('#googleClientId').value.trim();
  state.calendar.clientId = clientId;
  state = saveState(state);
  const button = $('#googleConnectButton');
  button.disabled = true;
  button.textContent = '연결 중…';
  try {
    await connectGoogleCalendar(clientId);
    renderGoogleConnectionStatus();
    showToast('Google 계정 연결을 완료했습니다.');
  } catch (error) {
    const status = $('#googleConnectionStatus');
    status.className = 'connection-status error';
    status.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Google 계정 연결';
  }
}

function disconnectGoogle() {
  disconnectGoogleCalendar();
  renderGoogleConnectionStatus('연결을 해제했습니다. 저장된 클라이언트 ID는 그대로 유지됩니다.');
}

async function syncWithGoogle() {
  if (!googleIsConnected()) {
    showToast('먼저 Google 계정을 연결해 주세요.');
    return;
  }
  const button = $('#googleSyncButton');
  const resultBox = $('#googleSyncResult');
  button.disabled = true;
  button.textContent = '동기화 중…';
  resultBox.className = 'sync-result';
  resultBox.textContent = '일정을 확인하고 있습니다.';
  try {
    const result = await syncGoogleCalendar({
      tasks: state.tasks,
      eventMap: state.calendar.eventMap,
      planName: state.settings.planName,
      onProgress: progress => {
        resultBox.textContent = `${progress.processed}/${progress.total || 0} 처리 중 · 생성 ${progress.created} · 수정 ${progress.updated} · 삭제 ${progress.removed}`;
      }
    });
    state.calendar.eventMap = result.eventMap;
    state.calendar.lastSyncAt = new Date().toISOString();
    state = saveState(state);
    resultBox.className = 'sync-result success';
    resultBox.textContent = `동기화 완료 · 생성 ${result.created}개 · 수정 ${result.updated}개 · 삭제 ${result.removed}개`;
  } catch (error) {
    resultBox.className = 'sync-result error';
    resultBox.textContent = `동기화 실패: ${error.message}`;
    renderGoogleConnectionStatus(error.message.includes('401') ? '접근 권한이 만료되었습니다. 다시 연결해 주세요.' : 'Google 계정은 연결되어 있지만 동기화 중 문제가 발생했습니다.');
  } finally {
    button.disabled = false;
    button.textContent = '현재 계획 동기화';
  }
}

// ---------- ICS 내보내기 ----------

function exportICS() {
  const tasks = state.tasks.filter(task => task.status === 'pending' && task.scheduledDate && task.startTime && task.endTime);
  if (!tasks.length) {
    showToast('내보낼 예정 일정이 없습니다.');
    return;
  }
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//STUNO//Study Note//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-TIMEZONE:Asia/Seoul', `X-WR-CALNAME:${icsEscape(state.settings.planName || 'STUNO 학습 계획')}`];
  tasks.forEach(task => {
    lines.push('BEGIN:VEVENT', `UID:${task.id}@stuno`, `DTSTAMP:${icsUtcStamp(new Date())}`, `DTSTART;TZID=Asia/Seoul:${icsLocalDateTime(task.scheduledDate, task.startTime)}`, `DTEND;TZID=Asia/Seoul:${icsLocalDateTime(task.scheduledDate, task.endTime)}`, `SUMMARY:${icsEscape(`[${task.subjectName}] ${task.title}`)}`, `DESCRIPTION:${icsEscape(`자료: ${task.material}\n범위: ${task.detail}\n완료 기준: ${task.completion}`)}`, 'STATUS:CONFIRMED', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  downloadBlob(lines.join('\r\n'), `${safeFileName(state.settings.planName)}-stuno.ics`, 'text/calendar;charset=utf-8');
  showToast('캘린더 파일을 만들었습니다.');
}

function icsLocalDateTime(date, time) { return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`; }
function icsUtcStamp(date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function icsEscape(value) { return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }

// ---------- 공통 UI ----------

function toggleTheme() {
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  $('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#302e2a' : '#f6f0df');
}

function resetAll() {
  if (!confirm('이 기기에 저장된 입력과 계획을 모두 삭제할까요? Google Calendar에 이미 만든 일정은 직접 삭제하거나 동기화 전에 정리해야 합니다.')) return;
  clearStoredState();
  location.hash = '#/setup/basic';
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

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('서비스 워커 등록 실패', error));
}
