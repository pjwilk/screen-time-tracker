// app.js — Application entry point and router

import { loadState, initCloudSync } from './store.js';
import { renderNav, updateActiveLink } from './components/nav.js';
import { renderDashboard } from './views/dashboard.js';
import { renderClasses } from './views/classes.js';
import { renderHistory } from './views/history.js';
import { renderAdmin } from './views/admin.js';
import { renderWeekly } from './views/weekly.js';
import * as onedrive from './onedrive.js';

const routes = {
  dashboard: renderDashboard,
  classes: renderClasses,
  history: renderHistory,
  admin: renderAdmin,
  weekly: renderWeekly,
};

function router() {
  const hash = location.hash.slice(1) || 'dashboard';
  const contentEl = document.getElementById('app-content');
  const renderFn = routes[hash] || renderDashboard;
  contentEl.innerHTML = '';
  renderFn(contentEl);
  updateActiveLink();
}

function updateSyncIndicator(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;

  const config = onedrive.getCloudConfig();
  if (!config.clientId) {
    el.hidden = true;
    return;
  }

  el.hidden = false;
  el.className = `sync-status status-${status}`;

  const labels = {
    disconnected: '\u2601 Offline',
    syncing: '\u2601 Syncing\u2026',
    synced: '\u2601 Synced',
    error: '\u2601 Sync Error',
  };
  el.textContent = labels[status] || status;
}

window.addEventListener('hashchange', router);

document.addEventListener('DOMContentLoaded', async () => {
  loadState();
  renderNav(document.getElementById('app-nav'));
  router();

  // Set up sync status indicator listener
  onedrive.onSyncStatusChange(updateSyncIndicator);

  // Initialize OneDrive cloud sync in background (non-blocking)
  const dataUpdated = await initCloudSync();
  if (dataUpdated) {
    router(); // Re-render with cloud data
  }
});
