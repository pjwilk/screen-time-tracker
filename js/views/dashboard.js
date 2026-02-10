// dashboard.js — Main dashboard view

import { getClasses, getAllGradeHistory, getSettings, getScreenTimeLog, saveScreenTimeLog, updateClass } from '../store.js';
import { calculateGPA, percentageToLetter, formatMinutes, validateGrade, validateMissing } from '../models.js';
import { calculateScreenTime } from '../rewards.js';
import { createScreenTimeDisplay } from '../components/screenTimeDisplay.js';
import { createGradeCard } from '../components/gradeCard.js';
import { showModal } from '../components/modal.js';

function getMostRecentPreviousGrade(classId, history) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = history
    .filter(h => h.classId === classId && h.recordedAt.slice(0, 10) !== today)
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  return entries.length > 0 ? entries[0].grade : null;
}

export function renderDashboard(container) {
  const classes = getClasses();
  const history = getAllGradeHistory();
  const settings = getSettings();
  const today = new Date().toISOString().slice(0, 10);
  const todayLog = getScreenTimeLog(today);

  // Calculate screen time
  const screenTime = calculateScreenTime(classes, history, settings);

  // Check for override/lock
  const override = todayLog?.overrideMinutes ?? null;
  const locked = todayLog?.locked ?? false;

  // Save today's calculation
  saveScreenTimeLog({
    date: today,
    calculatedMinutes: screenTime.total,
    overrideMinutes: override,
    locked,
    breakdown: {
      baseline: screenTime.baseline,
      missingPenalty: screenTime.missingPenalty,
      dGradePenalty: screenTime.dGradePenalty,
      fGradePenalty: screenTime.fGradePenalty,
      zeroMissingBonus: screenTime.zeroMissingBonus,
      improvementBonus: screenTime.improvementBonus,
      aClassBonus: screenTime.aClassBonus,
      total: screenTime.total,
    },
  });

  // Screen time hero
  const hero = createScreenTimeDisplay(screenTime, override, locked);
  container.appendChild(hero);

  // GPA display
  const gpa = calculateGPA(classes);
  const gpaDiv = document.createElement('div');
  gpaDiv.className = 'gpa-display';
  gpaDiv.innerHTML = `Overall GPA: <span class="gpa-value">${gpa.toFixed(2)}</span>`;
  container.appendChild(gpaDiv);

  // Breakdown panel
  const breakdownPanel = document.createElement('details');
  breakdownPanel.className = 'breakdown-panel';
  const summary = document.createElement('summary');
  summary.textContent = 'Screen Time Breakdown';
  breakdownPanel.appendChild(summary);

  const breakdownList = document.createElement('ul');
  breakdownList.className = 'breakdown-list';

  // Baseline
  addBreakdownItem(breakdownList, 'Baseline', `${screenTime.baseline} min`, 'neutral');

  // Penalties
  if (screenTime.missingPenalty > 0) {
    const totalMissing = classes.reduce((s, c) => s + c.missingAssignments, 0);
    addBreakdownItem(breakdownList, `Missing assignments (${totalMissing})`, `-${screenTime.missingPenalty} min`, 'negative');
  }
  if (screenTime.dGradePenalty > 0) {
    const dCount = classes.filter(c => percentageToLetter(c.currentGrade) === 'D').length;
    addBreakdownItem(breakdownList, `D grades (${dCount})`, `-${screenTime.dGradePenalty} min`, 'negative');
  }
  if (screenTime.fGradePenalty > 0) {
    const fCount = classes.filter(c => percentageToLetter(c.currentGrade) === 'F').length;
    addBreakdownItem(breakdownList, `F grades (${fCount})`, `-${screenTime.fGradePenalty} min`, 'negative');
  }

  // Bonuses
  if (screenTime.zeroMissingBonus > 0) {
    addBreakdownItem(breakdownList, 'Zero missing assignments', `+${screenTime.zeroMissingBonus} min`, 'positive');
  }
  if (screenTime.improvementBonus > 0) {
    addBreakdownItem(breakdownList, 'Grade improvements', `+${screenTime.improvementBonus} min`, 'positive');
  }
  if (screenTime.aClassBonus > 0) {
    const aCount = classes.filter(c => percentageToLetter(c.currentGrade) === 'A').length;
    addBreakdownItem(breakdownList, `A grades (${aCount})`, `+${screenTime.aClassBonus} min`, 'positive');
  }

  // Total
  addBreakdownItem(breakdownList, 'Total', `${screenTime.total} min`, 'neutral');

  breakdownPanel.appendChild(breakdownList);
  container.appendChild(breakdownPanel);

  // Section header with Update button
  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'section-header';

  const h2 = document.createElement('h2');
  h2.textContent = 'Classes';
  sectionHeader.appendChild(h2);

  const updateBtn = document.createElement('button');
  updateBtn.className = 'btn-update';
  updateBtn.textContent = 'Update Grades';
  updateBtn.addEventListener('click', () => openUpdateModal(classes, container));
  sectionHeader.appendChild(updateBtn);

  container.appendChild(sectionHeader);

  // Grade cards grid
  const grid = document.createElement('div');
  grid.className = 'grade-grid';

  for (const cls of classes) {
    const prevGrade = getMostRecentPreviousGrade(cls.id, history);
    const card = createGradeCard(cls, prevGrade);
    grid.appendChild(card);
  }

  container.appendChild(grid);

  // Motivational message
  if (screenTime.total >= 150) {
    const msg = document.createElement('p');
    msg.className = 'text-center mt-1';
    msg.textContent = 'Nice work, Mason! Keep it up!';
    msg.style.fontWeight = '600';
    msg.style.color = '#1a7a36';
    container.appendChild(msg);
  } else if (screenTime.total < 60) {
    const msg = document.createElement('p');
    msg.className = 'text-center mt-1';
    msg.textContent = 'You can do better! Turn in those missing assignments to earn more time.';
    msg.style.fontWeight = '600';
    msg.style.color = '#856404';
    container.appendChild(msg);
  }
}

function addBreakdownItem(list, label, value, type) {
  const li = document.createElement('li');
  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;

  const valueSpan = document.createElement('span');
  valueSpan.className = `breakdown-${type}`;
  valueSpan.textContent = value;

  li.appendChild(labelSpan);
  li.appendChild(valueSpan);
  list.appendChild(li);
}

function openUpdateModal(classes, dashContainer) {
  const inputs = {};

  showModal('Update Grades', (content) => {
    for (const cls of classes) {
      const group = document.createElement('div');
      group.style.marginBottom = '1rem';

      const label = document.createElement('label');
      label.textContent = cls.name;
      label.style.fontWeight = '600';
      label.style.display = 'block';
      label.style.marginBottom = '0.25rem';
      group.appendChild(label);

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '0.5rem';
      row.style.alignItems = 'center';

      const gradeInput = document.createElement('input');
      gradeInput.type = 'number';
      gradeInput.min = '0';
      gradeInput.max = '100';
      gradeInput.step = '0.01';
      gradeInput.value = cls.currentGrade;
      gradeInput.placeholder = 'Grade %';
      gradeInput.style.flex = '1';

      const missingInput = document.createElement('input');
      missingInput.type = 'number';
      missingInput.min = '0';
      missingInput.step = '1';
      missingInput.value = cls.missingAssignments;
      missingInput.placeholder = 'Missing';
      missingInput.style.width = '80px';

      const missingLabel = document.createElement('span');
      missingLabel.textContent = 'missing';
      missingLabel.style.fontSize = '0.85rem';

      row.appendChild(gradeInput);
      row.appendChild(missingInput);
      row.appendChild(missingLabel);
      group.appendChild(row);

      inputs[cls.id] = { gradeInput, missingInput };
      content.appendChild(group);
    }
  }, () => {
    // On save
    for (const cls of classes) {
      const { gradeInput, missingInput } = inputs[cls.id];
      const newGrade = validateGrade(gradeInput.value);
      const newMissing = validateMissing(missingInput.value);

      if (newGrade !== cls.currentGrade || newMissing !== cls.missingAssignments) {
        updateClass(cls.id, { currentGrade: newGrade, missingAssignments: newMissing });
      }
    }
    // Re-render dashboard
    dashContainer.innerHTML = '';
    renderDashboard(dashContainer);
  });
}
