// classes.js — Class management view

import { getAllClasses, getClasses, addClass, updateClass, removeClass, restoreClass } from '../store.js';
import { percentageToLetter, gradeColor } from '../models.js';
import { showModal } from '../components/modal.js';

export function renderClasses(container) {
  const h2 = document.createElement('h2');
  h2.textContent = 'Manage Classes';
  container.appendChild(h2);

  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Add Class';
  addBtn.style.marginBottom = '1rem';
  addBtn.addEventListener('click', () => openAddClassModal(container));
  container.appendChild(addBtn);

  // Active classes
  const activeClasses = getClasses();
  if (activeClasses.length > 0) {
    const activeHeader = document.createElement('h3');
    activeHeader.textContent = 'Active Classes';
    activeHeader.style.fontSize = '1rem';
    container.appendChild(activeHeader);

    const table = createClassTable(activeClasses, true, container);
    container.appendChild(table);
  }

  // Archived classes
  const allClasses = getAllClasses();
  const archivedClasses = allClasses.filter(c => !c.isActive);
  if (archivedClasses.length > 0) {
    const archHeader = document.createElement('h3');
    archHeader.textContent = 'Archived Classes';
    archHeader.style.fontSize = '1rem';
    archHeader.style.marginTop = '2rem';
    container.appendChild(archHeader);

    const table = createClassTable(archivedClasses, false, container);
    container.appendChild(table);
  }
}

function createClassTable(classes, isActive, viewContainer) {
  const table = document.createElement('table');
  table.className = 'history-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const text of ['Class', 'Type', 'Grade', 'Missing', 'Actions']) {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const cls of classes) {
    const tr = document.createElement('tr');

    // Name
    const nameTd = document.createElement('td');
    nameTd.textContent = cls.name;
    tr.appendChild(nameTd);

    // Type
    const typeTd = document.createElement('td');
    typeTd.textContent = cls.type;
    tr.appendChild(typeTd);

    // Grade
    const gradeTd = document.createElement('td');
    if (cls.currentGrade > 0 || cls.isActive) {
      const letter = percentageToLetter(cls.currentGrade);
      const color = gradeColor(cls.currentGrade);
      gradeTd.innerHTML = `<span class="${color}">${letter}</span> (${cls.currentGrade.toFixed(1)}%)`;
    } else {
      gradeTd.textContent = 'N/A';
    }
    tr.appendChild(gradeTd);

    // Missing
    const missingTd = document.createElement('td');
    missingTd.textContent = cls.missingAssignments;
    tr.appendChild(missingTd);

    // Actions
    const actionsTd = document.createElement('td');

    if (isActive) {
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Rename';
      editBtn.className = 'secondary';
      editBtn.style.marginRight = '0.25rem';
      editBtn.style.padding = '0.2rem 0.5rem';
      editBtn.style.fontSize = '0.8rem';
      editBtn.addEventListener('click', () => openRenameModal(cls, viewContainer));
      actionsTd.appendChild(editBtn);

      // Don't allow archiving the last active class
      const activeCount = getClasses().length;
      if (activeCount > 1) {
        const archiveBtn = document.createElement('button');
        archiveBtn.textContent = 'Archive';
        archiveBtn.className = 'secondary';
        archiveBtn.style.padding = '0.2rem 0.5rem';
        archiveBtn.style.fontSize = '0.8rem';
        archiveBtn.addEventListener('click', () => {
          removeClass(cls.id);
          viewContainer.innerHTML = '';
          renderClasses(viewContainer);
        });
        actionsTd.appendChild(archiveBtn);
      }
    } else {
      const restoreBtn = document.createElement('button');
      restoreBtn.textContent = 'Restore';
      restoreBtn.style.padding = '0.2rem 0.5rem';
      restoreBtn.style.fontSize = '0.8rem';
      restoreBtn.addEventListener('click', () => {
        restoreClass(cls.id);
        viewContainer.innerHTML = '';
        renderClasses(viewContainer);
      });
      actionsTd.appendChild(restoreBtn);
    }

    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

function openAddClassModal(viewContainer) {
  let nameInput, typeSelect;

  showModal('Add Class', (content) => {
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Class Name';
    content.appendChild(nameLabel);

    nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'e.g., Spanish 1';
    content.appendChild(nameInput);

    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type';
    content.appendChild(typeLabel);

    typeSelect = document.createElement('select');
    for (const opt of ['core', 'elective']) {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
      typeSelect.appendChild(option);
    }
    content.appendChild(typeSelect);
  }, () => {
    const name = nameInput.value.trim();
    if (name) {
      addClass(name, typeSelect.value);
      viewContainer.innerHTML = '';
      renderClasses(viewContainer);
    }
  });
}

function openRenameModal(cls, viewContainer) {
  let nameInput;

  showModal('Rename Class', (content) => {
    const label = document.createElement('label');
    label.textContent = 'New Name';
    content.appendChild(label);

    nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = cls.name;
    content.appendChild(nameInput);
  }, () => {
    const name = nameInput.value.trim();
    if (name && name !== cls.name) {
      updateClass(cls.id, { name });
      viewContainer.innerHTML = '';
      renderClasses(viewContainer);
    }
  });
}
