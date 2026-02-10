// weekly.js — Weekly summary view

import { getRecentScreenTimeLogs, getClasses } from '../store.js';
import { formatMinutes, percentageToLetter, gradeColor } from '../models.js';

export function renderWeekly(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'Weekly Summary';
  container.appendChild(h2);

  const logs = getRecentScreenTimeLogs(7);

  if (logs.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No screen time data yet. Visit the dashboard to generate today\'s calculation.';
    container.appendChild(p);
    return;
  }

  // Day cards grid
  const grid = document.createElement('div');
  grid.className = 'weekly-grid';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const log of logs) {
    const date = new Date(log.date + 'T00:00:00');
    const card = document.createElement('div');
    card.className = 'day-card';

    const dayName = document.createElement('div');
    dayName.className = 'day-name';
    dayName.textContent = `${dayNames[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
    card.appendChild(dayName);

    const dayTime = document.createElement('div');
    dayTime.className = 'day-time';
    const displayMin = log.locked ? 0 : (log.overrideMinutes ?? log.calculatedMinutes);
    dayTime.textContent = formatMinutes(displayMin);

    // Color based on amount
    if (log.locked) {
      dayTime.style.color = '#383d41';
    } else if (displayMin >= 150) {
      dayTime.style.color = '#155724';
    } else if (displayMin >= 90) {
      dayTime.style.color = '#1a6b1a';
    } else if (displayMin >= 45) {
      dayTime.style.color = '#856404';
    } else {
      dayTime.style.color = '#721c24';
    }

    card.appendChild(dayTime);

    if (log.locked) {
      const lockLabel = document.createElement('div');
      lockLabel.style.fontSize = '0.75rem';
      lockLabel.style.color = '#6c757d';
      lockLabel.textContent = 'Locked';
      card.appendChild(lockLabel);
    } else if (log.overrideMinutes !== null && log.overrideMinutes !== undefined) {
      const overrideLabel = document.createElement('div');
      overrideLabel.style.fontSize = '0.75rem';
      overrideLabel.style.color = '#6c757d';
      overrideLabel.textContent = 'Override';
      card.appendChild(overrideLabel);
    }

    grid.appendChild(card);
  }

  container.appendChild(grid);

  // Weekly average
  const totalMin = logs.reduce((sum, log) => {
    return sum + (log.locked ? 0 : (log.overrideMinutes ?? log.calculatedMinutes));
  }, 0);
  const avgMin = Math.round(totalMin / logs.length);

  const avgDiv = document.createElement('div');
  avgDiv.className = 'text-center mt-1';
  avgDiv.innerHTML = `<strong>Weekly Average:</strong> ${formatMinutes(avgMin)}/day (${logs.length} day${logs.length === 1 ? '' : 's'} tracked)`;
  container.appendChild(avgDiv);

  // Detailed breakdown table
  if (logs.some(l => l.breakdown)) {
    const detailsEl = document.createElement('details');
    detailsEl.style.marginTop = '1.5rem';
    const summary = document.createElement('summary');
    summary.textContent = 'Daily Breakdowns';
    detailsEl.appendChild(summary);

    const table = document.createElement('table');
    table.className = 'history-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const text of ['Date', 'Base', 'Penalties', 'Bonuses', 'Total']) {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const log of logs) {
      const tr = document.createElement('tr');
      const b = log.breakdown || {};

      const dateTd = document.createElement('td');
      dateTd.textContent = log.date;
      tr.appendChild(dateTd);

      const baseTd = document.createElement('td');
      baseTd.textContent = `${b.baseline || 0}m`;
      tr.appendChild(baseTd);

      const penaltyTd = document.createElement('td');
      const totalPenalty = (b.missingPenalty || 0) + (b.dGradePenalty || 0) + (b.fGradePenalty || 0);
      penaltyTd.textContent = totalPenalty > 0 ? `-${totalPenalty}m` : '0m';
      penaltyTd.style.color = totalPenalty > 0 ? '#c0392b' : 'inherit';
      tr.appendChild(penaltyTd);

      const bonusTd = document.createElement('td');
      const totalBonus = (b.zeroMissingBonus || 0) + (b.improvementBonus || 0) + (b.aClassBonus || 0);
      bonusTd.textContent = totalBonus > 0 ? `+${totalBonus}m` : '0m';
      bonusTd.style.color = totalBonus > 0 ? '#1a7a36' : 'inherit';
      tr.appendChild(bonusTd);

      const totalTd = document.createElement('td');
      totalTd.textContent = `${b.total || log.calculatedMinutes || 0}m`;
      totalTd.style.fontWeight = '600';
      tr.appendChild(totalTd);

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    detailsEl.appendChild(table);
    container.appendChild(detailsEl);
  }

  // Current class snapshot
  const classes = getClasses();
  if (classes.length > 0) {
    const classSection = document.createElement('details');
    classSection.style.marginTop = '1.5rem';
    const classSummary = document.createElement('summary');
    classSummary.textContent = 'Current Class Snapshot';
    classSection.appendChild(classSummary);

    const classTable = document.createElement('table');
    classTable.className = 'history-table';

    const cThead = document.createElement('thead');
    const cHeaderRow = document.createElement('tr');
    for (const text of ['Class', 'Grade', 'Missing']) {
      const th = document.createElement('th');
      th.textContent = text;
      cHeaderRow.appendChild(th);
    }
    cThead.appendChild(cHeaderRow);
    classTable.appendChild(cThead);

    const cTbody = document.createElement('tbody');
    for (const cls of classes) {
      const tr = document.createElement('tr');

      const nameTd = document.createElement('td');
      nameTd.textContent = cls.name;
      tr.appendChild(nameTd);

      const gradeTd = document.createElement('td');
      const letter = percentageToLetter(cls.currentGrade);
      gradeTd.innerHTML = `<span class="${gradeColor(cls.currentGrade)}">${letter}</span> (${cls.currentGrade.toFixed(1)}%)`;
      tr.appendChild(gradeTd);

      const missingTd = document.createElement('td');
      missingTd.textContent = cls.missingAssignments;
      if (cls.missingAssignments > 0) {
        missingTd.style.color = '#c0392b';
        missingTd.style.fontWeight = '600';
      }
      tr.appendChild(missingTd);

      cTbody.appendChild(tr);
    }
    classTable.appendChild(cTbody);
    classSection.appendChild(classTable);
    container.appendChild(classSection);
  }
}
