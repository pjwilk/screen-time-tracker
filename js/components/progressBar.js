// progressBar.js — Reusable progress bar component

export function createProgressBar(value, max, colorClass = '') {
  const container = document.createElement('div');
  container.className = 'progress-bar-container';

  const fill = document.createElement('div');
  fill.className = `progress-bar-fill fill-${colorClass.replace('grade-', '')}`;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  fill.style.width = `${pct}%`;

  container.appendChild(fill);
  return container;
}
