// history.js — Grade history and trends view

import { getClasses, getGradeHistory } from '../store.js';
import { percentageToLetter, gradeColor } from '../models.js';

export function renderHistory(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'Grade History';
  container.appendChild(h2);

  const classes = getClasses();

  if (classes.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No active classes.';
    container.appendChild(p);
    return;
  }

  // Filter controls
  const filterDiv = document.createElement('div');
  filterDiv.style.marginBottom = '1rem';

  const classSelect = document.createElement('select');
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Classes';
  classSelect.appendChild(allOption);

  for (const cls of classes) {
    const option = document.createElement('option');
    option.value = cls.id;
    option.textContent = cls.name;
    classSelect.appendChild(option);
  }
  filterDiv.appendChild(classSelect);
  container.appendChild(filterDiv);

  // History content area
  const historyContent = document.createElement('div');
  container.appendChild(historyContent);

  function renderHistoryContent() {
    historyContent.innerHTML = '';
    const selectedId = classSelect.value;
    const classesToShow = selectedId === 'all' ? classes : classes.filter(c => c.id === selectedId);

    for (const cls of classesToShow) {
      const history = getGradeHistory(cls.id);

      const section = document.createElement('div');
      section.style.marginBottom = '1.5rem';

      const heading = document.createElement('h3');
      heading.style.fontSize = '1rem';
      heading.textContent = cls.name;

      // Current grade indicator
      const currentBadge = document.createElement('span');
      const letter = percentageToLetter(cls.currentGrade);
      currentBadge.className = `grade-badge ${gradeColor(cls.currentGrade)}`;
      currentBadge.style.fontSize = '0.9rem';
      currentBadge.style.marginLeft = '0.5rem';
      currentBadge.textContent = `${letter} (${cls.currentGrade.toFixed(1)}%)`;
      heading.appendChild(currentBadge);
      section.appendChild(heading);

      if (history.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No history yet. Update grades to see changes over time.';
        p.style.fontSize = '0.9rem';
        p.style.opacity = '0.7';
        section.appendChild(p);
      } else {
        // Visual bar chart of grade history
        const chartDiv = document.createElement('div');
        chartDiv.style.display = 'flex';
        chartDiv.style.alignItems = 'flex-end';
        chartDiv.style.gap = '3px';
        chartDiv.style.height = '80px';
        chartDiv.style.marginBottom = '0.75rem';

        // Include history entries + current grade
        const allEntries = [
          ...history.map(h => ({ grade: h.grade, date: h.recordedAt })),
          { grade: cls.currentGrade, date: cls.updatedAt },
        ];

        for (const entry of allEntries) {
          const bar = document.createElement('div');
          bar.style.flex = '1';
          bar.style.maxWidth = '40px';
          bar.style.height = `${Math.max(5, entry.grade * 0.8)}px`;
          bar.style.borderRadius = '2px 2px 0 0';
          const color = gradeColor(entry.grade);
          bar.className = color;
          // Map grade color to background
          const bgMap = {
            'grade-a': '#d4edda',
            'grade-b': '#bee3f8',
            'grade-c': '#fefcbf',
            'grade-d': '#feebc8',
            'grade-f': '#fed7d7',
          };
          bar.style.backgroundColor = bgMap[color] || '#e2e3e5';
          bar.style.border = `1px solid`;
          bar.title = `${entry.grade.toFixed(1)}% on ${new Date(entry.date).toLocaleDateString()}`;
          chartDiv.appendChild(bar);
        }
        section.appendChild(chartDiv);

        // Table
        const table = document.createElement('table');
        table.className = 'history-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (const text of ['Date', 'Grade', 'Letter', 'Missing']) {
          const th = document.createElement('th');
          th.textContent = text;
          headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        // Show entries in reverse chronological order
        const sortedHistory = [...history].reverse();
        for (const entry of sortedHistory) {
          const tr = document.createElement('tr');

          const dateTd = document.createElement('td');
          dateTd.textContent = new Date(entry.recordedAt).toLocaleDateString();
          tr.appendChild(dateTd);

          const gradeTd = document.createElement('td');
          gradeTd.textContent = `${entry.grade.toFixed(1)}%`;
          tr.appendChild(gradeTd);

          const letterTd = document.createElement('td');
          const entryLetter = percentageToLetter(entry.grade);
          letterTd.innerHTML = `<span class="${gradeColor(entry.grade)}">${entryLetter}</span>`;
          tr.appendChild(letterTd);

          const missingTd = document.createElement('td');
          missingTd.textContent = entry.missingAssignments;
          tr.appendChild(missingTd);

          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        section.appendChild(table);
      }

      historyContent.appendChild(section);
    }
  }

  classSelect.addEventListener('change', renderHistoryContent);
  renderHistoryContent();
}
