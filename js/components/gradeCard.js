// gradeCard.js — Individual class grade card component

import { percentageToLetter, gradeColor } from '../models.js';
import { createProgressBar } from './progressBar.js';

export function createGradeCard(classData, previousGrade = null) {
  const card = document.createElement('article');
  card.className = 'grade-card';

  const letter = percentageToLetter(classData.currentGrade);
  const colorClass = gradeColor(classData.currentGrade);

  // Header row: class name + letter grade badge
  const header = document.createElement('div');
  header.className = 'card-header';

  const name = document.createElement('span');
  name.className = 'class-name';
  name.textContent = classData.name;

  const badge = document.createElement('span');
  badge.className = `grade-badge ${colorClass}`;
  badge.textContent = letter;

  header.appendChild(name);
  header.appendChild(badge);
  card.appendChild(header);

  // Percentage + trend
  const pctRow = document.createElement('div');
  pctRow.className = 'grade-pct';
  pctRow.textContent = `${classData.currentGrade.toFixed(1)}%`;

  if (previousGrade !== null) {
    const prevLetter = percentageToLetter(previousGrade);
    const diff = classData.currentGrade - previousGrade;
    const trend = document.createElement('span');
    if (diff > 0.5) {
      trend.className = 'trend-up';
      trend.textContent = ` \u25B2 +${diff.toFixed(1)}%`;
    } else if (diff < -0.5) {
      trend.className = 'trend-down';
      trend.textContent = ` \u25BC ${diff.toFixed(1)}%`;
    } else {
      trend.className = 'trend-flat';
      trend.textContent = ' \u25C6';
    }
    pctRow.appendChild(trend);
  }

  card.appendChild(pctRow);

  // Progress bar
  const bar = createProgressBar(classData.currentGrade, 100, colorClass);
  card.appendChild(bar);

  // Missing assignments
  const missing = document.createElement('div');
  missing.className = 'missing-info';

  const missingBadge = document.createElement('span');
  if (classData.missingAssignments > 0) {
    missingBadge.className = 'missing-badge has-missing';
    missingBadge.textContent = `${classData.missingAssignments} missing`;
  } else {
    missingBadge.className = 'missing-badge no-missing';
    missingBadge.textContent = '\u2713 All complete';
  }
  missing.appendChild(missingBadge);
  card.appendChild(missing);

  return card;
}
