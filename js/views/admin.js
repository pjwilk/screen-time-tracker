// admin.js — Parent/admin settings view

import { getSettings, updateSettings, getScreenTimeLog, saveScreenTimeLog, exportData, importData, clearAllData, loadState } from '../store.js';
import { showModal } from '../components/modal.js';

export function renderAdmin(container) {
  const settings = getSettings();
  const today = new Date().toISOString().slice(0, 10);

  // PIN check
  if (settings.adminPin) {
    const pinDiv = document.createElement('div');
    pinDiv.className = 'text-center';
    pinDiv.style.marginTop = '2rem';

    const label = document.createElement('label');
    label.textContent = 'Enter Admin PIN';
    pinDiv.appendChild(label);

    const pinInput = document.createElement('input');
    pinInput.type = 'password';
    pinInput.maxLength = 6;
    pinInput.style.width = '150px';
    pinInput.style.margin = '0 auto';
    pinInput.style.textAlign = 'center';
    pinDiv.appendChild(pinInput);

    const pinBtn = document.createElement('button');
    pinBtn.textContent = 'Unlock';
    pinBtn.style.marginTop = '0.5rem';
    pinBtn.addEventListener('click', () => {
      if (pinInput.value === settings.adminPin) {
        container.innerHTML = '';
        renderAdminContent(container, settings, today);
      } else {
        const err = document.createElement('p');
        err.textContent = 'Incorrect PIN';
        err.style.color = '#c0392b';
        pinDiv.appendChild(err);
      }
    });
    pinDiv.appendChild(pinBtn);

    container.appendChild(pinDiv);
    return;
  }

  renderAdminContent(container, settings, today);
}

function renderAdminContent(container, settings, today) {
  const h2 = document.createElement('h2');
  h2.textContent = 'Admin Settings';
  container.appendChild(h2);

  // === Baseline ===
  const baselineGroup = createSettingsGroup('Baseline');
  addSettingRow(baselineGroup, 'Daily baseline (min)', settings.baseline, (val) => {
    updateSettings({ baseline: parseInt(val) || 180 });
  });
  container.appendChild(baselineGroup);

  // === Penalties ===
  const penaltyGroup = createSettingsGroup('Penalties');
  addSettingRow(penaltyGroup, 'Per missing assignment (min)', settings.penalties.perMissing, (val) => {
    settings.penalties.perMissing = parseInt(val) || 0;
    updateSettings({ penalties: settings.penalties });
  });
  addSettingRow(penaltyGroup, 'Per class with D (min)', settings.penalties.classWithD, (val) => {
    settings.penalties.classWithD = parseInt(val) || 0;
    updateSettings({ penalties: settings.penalties });
  });
  addSettingRow(penaltyGroup, 'Per class with F (min)', settings.penalties.classWithF, (val) => {
    settings.penalties.classWithF = parseInt(val) || 0;
    updateSettings({ penalties: settings.penalties });
  });
  container.appendChild(penaltyGroup);

  // === Bonuses ===
  const bonusGroup = createSettingsGroup('Bonuses');
  addSettingRow(bonusGroup, 'Zero missing assignments (min)', settings.bonuses.zeroMissingAll, (val) => {
    settings.bonuses.zeroMissingAll = parseInt(val) || 0;
    updateSettings({ bonuses: settings.bonuses });
  });
  addSettingRow(bonusGroup, 'Per class improved (min)', settings.bonuses.classImproved, (val) => {
    settings.bonuses.classImproved = parseInt(val) || 0;
    updateSettings({ bonuses: settings.bonuses });
  });
  addSettingRow(bonusGroup, 'Per class with A (min)', settings.bonuses.classWithA, (val) => {
    settings.bonuses.classWithA = parseInt(val) || 0;
    updateSettings({ bonuses: settings.bonuses });
  });
  container.appendChild(bonusGroup);

  // === Minimum ===
  const minGroup = createSettingsGroup('Floor');
  addSettingRow(minGroup, 'Minimum screen time (min)', settings.minimumScreenTime, (val) => {
    updateSettings({ minimumScreenTime: parseInt(val) || 0 });
  });
  container.appendChild(minGroup);

  // === Manual Override ===
  const overrideGroup = createSettingsGroup('Today\'s Override');
  const todayLog = getScreenTimeLog(today);

  const overrideRow = document.createElement('div');
  overrideRow.className = 'settings-row';

  const overrideLabel = document.createElement('label');
  overrideLabel.textContent = 'Override minutes';
  overrideRow.appendChild(overrideLabel);

  const overrideInput = document.createElement('input');
  overrideInput.type = 'number';
  overrideInput.min = '0';
  overrideInput.value = todayLog?.overrideMinutes ?? '';
  overrideInput.placeholder = 'Auto';
  overrideRow.appendChild(overrideInput);

  const overrideBtn = document.createElement('button');
  overrideBtn.textContent = 'Set';
  overrideBtn.style.padding = '0.3rem 0.6rem';
  overrideBtn.style.fontSize = '0.85rem';
  overrideBtn.addEventListener('click', () => {
    const val = overrideInput.value.trim();
    const log = getScreenTimeLog(today) || { date: today, calculatedMinutes: 0, overrideMinutes: null, locked: false, breakdown: {} };
    log.overrideMinutes = val === '' ? null : parseInt(val);
    saveScreenTimeLog(log);
  });
  overrideRow.appendChild(overrideBtn);
  overrideGroup.appendChild(overrideRow);

  // Lock toggle
  const lockRow = document.createElement('div');
  lockRow.className = 'settings-row';
  const lockLabel = document.createElement('label');
  lockLabel.textContent = 'Lock screen time (zero)';
  lockRow.appendChild(lockLabel);

  const lockCheck = document.createElement('input');
  lockCheck.type = 'checkbox';
  lockCheck.checked = todayLog?.locked ?? false;
  lockCheck.style.width = 'auto';
  lockCheck.addEventListener('change', () => {
    const log = getScreenTimeLog(today) || { date: today, calculatedMinutes: 0, overrideMinutes: null, locked: false, breakdown: {} };
    log.locked = lockCheck.checked;
    saveScreenTimeLog(log);
  });
  lockRow.appendChild(lockCheck);
  overrideGroup.appendChild(lockRow);

  // Clear override
  const clearOverrideBtn = document.createElement('button');
  clearOverrideBtn.textContent = 'Clear Override';
  clearOverrideBtn.className = 'secondary';
  clearOverrideBtn.style.marginTop = '0.5rem';
  clearOverrideBtn.addEventListener('click', () => {
    const log = getScreenTimeLog(today) || { date: today, calculatedMinutes: 0, overrideMinutes: null, locked: false, breakdown: {} };
    log.overrideMinutes = null;
    log.locked = false;
    saveScreenTimeLog(log);
    overrideInput.value = '';
    lockCheck.checked = false;
  });
  overrideGroup.appendChild(clearOverrideBtn);

  container.appendChild(overrideGroup);

  // === Admin PIN ===
  const pinGroup = createSettingsGroup('Admin PIN');
  const pinRow = document.createElement('div');
  pinRow.className = 'settings-row';

  const pinLabel = document.createElement('label');
  pinLabel.textContent = settings.adminPin ? 'PIN is set' : 'No PIN set';
  pinRow.appendChild(pinLabel);

  const setPinBtn = document.createElement('button');
  setPinBtn.textContent = settings.adminPin ? 'Change PIN' : 'Set PIN';
  setPinBtn.style.padding = '0.3rem 0.6rem';
  setPinBtn.style.fontSize = '0.85rem';
  setPinBtn.addEventListener('click', () => {
    let pinInput;
    showModal('Set Admin PIN', (content) => {
      const label = document.createElement('label');
      label.textContent = 'Enter PIN (or leave blank to remove)';
      content.appendChild(label);

      pinInput = document.createElement('input');
      pinInput.type = 'password';
      pinInput.maxLength = 6;
      pinInput.placeholder = 'PIN';
      content.appendChild(pinInput);
    }, () => {
      const pin = pinInput.value.trim();
      updateSettings({ adminPin: pin || null });
      container.innerHTML = '';
      renderAdmin(container);
    });
  });
  pinRow.appendChild(setPinBtn);
  pinGroup.appendChild(pinRow);
  container.appendChild(pinGroup);

  // === Data Management ===
  const dataGroup = createSettingsGroup('Data Management');

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export Data';
  exportBtn.style.marginRight = '0.5rem';
  exportBtn.addEventListener('click', () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mason-screen-time-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  dataGroup.appendChild(exportBtn);

  const importBtn = document.createElement('button');
  importBtn.textContent = 'Import Data';
  importBtn.className = 'secondary';
  importBtn.style.marginRight = '0.5rem';
  importBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          importData(reader.result);
          container.innerHTML = '';
          renderAdmin(container);
        } catch (e) {
          alert('Invalid data file: ' + e.message);
        }
      };
      reader.readAsText(file);
    });
    fileInput.click();
  });
  dataGroup.appendChild(importBtn);

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear All Data';
  clearBtn.className = 'secondary';
  clearBtn.style.color = '#c0392b';
  clearBtn.addEventListener('click', () => {
    showModal('Clear All Data', (content) => {
      const p = document.createElement('p');
      p.textContent = 'This will delete all data and reset to defaults. Are you sure?';
      content.appendChild(p);
    }, () => {
      clearAllData();
      loadState();
      container.innerHTML = '';
      renderAdmin(container);
    });
  });
  dataGroup.appendChild(clearBtn);

  container.appendChild(dataGroup);
}

function createSettingsGroup(title) {
  const group = document.createElement('div');
  group.className = 'settings-group';

  const h3 = document.createElement('h3');
  h3.textContent = title;
  group.appendChild(h3);

  return group;
}

function addSettingRow(group, labelText, currentValue, onChange) {
  const row = document.createElement('div');
  row.className = 'settings-row';

  const label = document.createElement('label');
  label.textContent = labelText;
  row.appendChild(label);

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.value = currentValue;
  input.addEventListener('change', () => onChange(input.value));
  row.appendChild(input);

  group.appendChild(row);
}
