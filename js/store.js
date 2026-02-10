// store.js — localStorage data access layer

import { createClassDefaults } from './models.js';

const STORAGE_KEY = 'masonScreenTime';

let state = null;

function getDefaultState() {
  const now = new Date().toISOString();
  return {
    version: 1,
    lastUpdated: now,
    classes: [
      { id: crypto.randomUUID(), name: 'Algebra 1 S2', type: 'core', currentGrade: 70.6, missingAssignments: 3, isActive: true, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Art 2', type: 'core', currentGrade: 84.25, missingAssignments: 1, isActive: true, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Biology 2', type: 'core', currentGrade: 61.23, missingAssignments: 4, isActive: true, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Concert Choir', type: 'core', currentGrade: 100, missingAssignments: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'English 2', type: 'core', currentGrade: 84, missingAssignments: 2, isActive: true, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Mil Sci I', type: 'core', currentGrade: 49.5, missingAssignments: 2, isActive: true, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Freshman Seminar', type: 'elective', currentGrade: 0, missingAssignments: 0, isActive: false, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Freshman Seminar (B)', type: 'elective', currentGrade: 0, missingAssignments: 0, isActive: false, createdAt: now, updatedAt: now },
    ],
    gradeHistory: [],
    screenTimeLog: [],
    settings: {
      baseline: 180,
      penalties: { perMissing: 5, classWithD: 10, classWithF: 20 },
      bonuses: { zeroMissingAll: 30, classImproved: 10, classWithA: 5 },
      minimumScreenTime: 15,
      adminPin: null,
      theme: 'auto',
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
    } else {
      state = getDefaultState();
      saveState(state);
    }
  } catch {
    state = getDefaultState();
    saveState(state);
  }
  return state;
}

export function saveState(newState) {
  if (newState) state = newState;
  state.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getState() {
  if (!state) loadState();
  return state;
}

export function getClasses() {
  return getState().classes.filter(c => c.isActive);
}

export function getAllClasses() {
  return getState().classes;
}

export function getClass(classId) {
  return getState().classes.find(c => c.id === classId) || null;
}

export function addClass(name, type = 'core') {
  const cls = createClassDefaults(name, type);
  getState().classes.push(cls);
  saveState();
  return cls;
}

export function updateClass(classId, updates) {
  const cls = getClass(classId);
  if (!cls) return null;

  // If grade changed, snapshot the old grade to history
  if (updates.currentGrade !== undefined && updates.currentGrade !== cls.currentGrade) {
    addGradeHistoryEntry(classId, cls.currentGrade, cls.missingAssignments);
  }

  // If missing assignments changed (but grade didn't), still snapshot
  if (updates.missingAssignments !== undefined && updates.missingAssignments !== cls.missingAssignments && updates.currentGrade === undefined) {
    addGradeHistoryEntry(classId, cls.currentGrade, cls.missingAssignments);
  }

  Object.assign(cls, updates, { updatedAt: new Date().toISOString() });
  saveState();
  return cls;
}

export function removeClass(classId) {
  const cls = getClass(classId);
  if (!cls) return false;
  cls.isActive = false;
  cls.updatedAt = new Date().toISOString();
  saveState();
  return true;
}

export function restoreClass(classId) {
  const cls = getState().classes.find(c => c.id === classId);
  if (!cls) return false;
  cls.isActive = true;
  cls.updatedAt = new Date().toISOString();
  saveState();
  return true;
}

function addGradeHistoryEntry(classId, grade, missingAssignments) {
  getState().gradeHistory.push({
    id: crypto.randomUUID(),
    classId,
    grade,
    missingAssignments,
    recordedAt: new Date().toISOString(),
    source: 'manual',
  });
}

export function getGradeHistory(classId) {
  return getState().gradeHistory
    .filter(h => h.classId === classId)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
}

export function getAllGradeHistory() {
  return getState().gradeHistory;
}

export function getScreenTimeLog(date) {
  const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  return getState().screenTimeLog.find(e => e.date === dateStr) || null;
}

export function getRecentScreenTimeLogs(days = 7) {
  const logs = getState().screenTimeLog;
  return logs
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}

export function saveScreenTimeLog(entry) {
  const logs = getState().screenTimeLog;
  const idx = logs.findIndex(e => e.date === entry.date);
  if (idx >= 0) {
    logs[idx] = entry;
  } else {
    logs.push(entry);
  }
  saveState();
}

export function getSettings() {
  return getState().settings;
}

export function updateSettings(updates) {
  Object.assign(getState().settings, updates);
  saveState();
}

export function exportData() {
  return JSON.stringify(getState(), null, 2);
}

export function importData(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data.version || !data.classes || !data.settings) {
    throw new Error('Invalid data format');
  }
  state = data;
  saveState();
  return state;
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  state = null;
}
