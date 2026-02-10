// admin.js — Parent/admin settings view

import { getSettings, updateSettings, getScreenTimeLog, saveScreenTimeLog, exportData, importData, clearAllData, loadState, syncFromCloud } from '../store.js';
import { showModal } from '../components/modal.js';
import * as onedrive from '../onedrive.js';

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

  // === Cloud Sync (OneDrive) ===
  renderCloudSyncSection(container, settings, today);
}

function renderCloudSyncSection(container, settings, today) {
  const cloudGroup = createSettingsGroup('Cloud Sync (OneDrive)');
  const config = onedrive.getCloudConfig();

  // Client ID input
  const clientIdRow = document.createElement('div');
  clientIdRow.className = 'settings-row';

  const clientIdLabel = document.createElement('label');
  clientIdLabel.textContent = 'Azure App Client ID';
  clientIdRow.appendChild(clientIdLabel);

  const clientIdInput = document.createElement('input');
  clientIdInput.type = 'text';
  clientIdInput.value = config.clientId || '';
  clientIdInput.placeholder = 'xxxxxxxx-xxxx-xxxx-...';
  clientIdInput.style.width = '220px';
  clientIdInput.style.fontFamily = 'monospace';
  clientIdInput.style.fontSize = '0.8rem';
  clientIdRow.appendChild(clientIdInput);

  cloudGroup.appendChild(clientIdRow);

  // Save client ID button
  const saveIdBtn = document.createElement('button');
  saveIdBtn.textContent = 'Save Client ID';
  saveIdBtn.style.marginBottom = '0.75rem';
  saveIdBtn.style.padding = '0.3rem 0.8rem';
  saveIdBtn.style.fontSize = '0.85rem';
  saveIdBtn.addEventListener('click', async () => {
    const id = clientIdInput.value.trim();
    onedrive.saveCloudConfig({ clientId: id || null });
    if (id) {
      saveIdBtn.textContent = 'Initializing...';
      saveIdBtn.disabled = true;
      await onedrive.initialize(id);
    }
    container.innerHTML = '';
    renderAdminContent(container, settings, today);
  });
  cloudGroup.appendChild(saveIdBtn);

  // Sign in/out + sync controls (only if client ID is configured)
  if (config.clientId) {
    if (onedrive.isSignedIn()) {
      const info = onedrive.getAccountInfo();
      const statusP = document.createElement('p');
      statusP.style.fontSize = '0.85rem';
      statusP.style.margin = '0.5rem 0';
      statusP.textContent = `Signed in as ${info.name} (${info.email})`;
      cloudGroup.appendChild(statusP);

      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '0.5rem';
      btnRow.style.flexWrap = 'wrap';

      const syncBtn = document.createElement('button');
      syncBtn.textContent = 'Sync Now';
      syncBtn.style.padding = '0.3rem 0.8rem';
      syncBtn.style.fontSize = '0.85rem';
      syncBtn.addEventListener('click', async () => {
        syncBtn.textContent = 'Syncing...';
        syncBtn.disabled = true;
        const updated = await syncFromCloud();
        if (updated) {
          container.innerHTML = '';
          renderAdmin(container);
        } else {
          syncBtn.textContent = 'Synced!';
          setTimeout(() => {
            syncBtn.textContent = 'Sync Now';
            syncBtn.disabled = false;
          }, 1500);
        }
      });
      btnRow.appendChild(syncBtn);

      const signOutBtn = document.createElement('button');
      signOutBtn.textContent = 'Sign Out';
      signOutBtn.className = 'secondary';
      signOutBtn.style.padding = '0.3rem 0.8rem';
      signOutBtn.style.fontSize = '0.85rem';
      signOutBtn.addEventListener('click', async () => {
        await onedrive.signOut();
        container.innerHTML = '';
        renderAdminContent(container, settings, today);
      });
      btnRow.appendChild(signOutBtn);

      cloudGroup.appendChild(btnRow);
    } else {
      const signInBtn = document.createElement('button');
      signInBtn.textContent = 'Sign in with Microsoft';
      signInBtn.style.padding = '0.3rem 0.8rem';
      signInBtn.style.fontSize = '0.85rem';
      signInBtn.addEventListener('click', async () => {
        signInBtn.textContent = 'Signing in...';
        signInBtn.disabled = true;
        const success = await onedrive.signIn();
        if (success) {
          const updated = await syncFromCloud();
          container.innerHTML = '';
          if (updated) {
            renderAdmin(container);
          } else {
            renderAdminContent(container, settings, today);
          }
        } else {
          signInBtn.textContent = 'Sign in with Microsoft';
          signInBtn.disabled = false;
        }
      });
      cloudGroup.appendChild(signInBtn);
    }
  }

  // Setup instructions (collapsible)
  const details = document.createElement('details');
  details.style.marginTop = '0.75rem';
  details.style.fontSize = '0.8rem';
  details.style.opacity = '0.85';

  const summary = document.createElement('summary');
  summary.textContent = 'Setup instructions';
  summary.style.cursor = 'pointer';
  summary.style.fontWeight = '600';
  details.appendChild(summary);

  const guide = document.createElement('ol');
  guide.style.paddingLeft = '1.2rem';
  guide.style.marginTop = '0.5rem';
  guide.style.lineHeight = '1.6';
  guide.innerHTML = [
    'Go to <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener">Azure App Registrations</a>',
    'Click <strong>New registration</strong>',
    'Name it (e.g. "Screen Time Tracker"), select <strong>Personal Microsoft accounts</strong> under supported account types',
    'Under Redirect URI, select <strong>Single-page application (SPA)</strong> and enter your app\'s URL (e.g. <code>https://yourdomain.com/</code> or <code>http://localhost:8080/</code>)',
    'Click <strong>Register</strong>, then copy the <strong>Application (client) ID</strong> and paste it above',
    'Under <strong>API permissions</strong>, add <strong>Microsoft Graph &rarr; Files.ReadWrite</strong> (delegated)',
    'Click <strong>Sign in with Microsoft</strong> above to connect',
  ].map(s => `<li>${s}</li>`).join('');
  details.appendChild(guide);

  const note = document.createElement('p');
  note.style.marginTop = '0.5rem';
  note.style.fontStyle = 'italic';
  note.textContent = 'Data syncs to OneDrive > Apps > ScreenTimeTracker > data.json';
  details.appendChild(note);

  cloudGroup.appendChild(details);
  container.appendChild(cloudGroup);
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
