// app.js — Application entry point and router

import { loadState } from './store.js';
import { renderNav, updateActiveLink } from './components/nav.js';
import { renderDashboard } from './views/dashboard.js';
import { renderClasses } from './views/classes.js';
import { renderHistory } from './views/history.js';
import { renderAdmin } from './views/admin.js';
import { renderWeekly } from './views/weekly.js';

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

window.addEventListener('hashchange', router);

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderNav(document.getElementById('app-nav'));
  router();
});
