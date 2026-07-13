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
  saveTheme
} from './js/storage.js';
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
