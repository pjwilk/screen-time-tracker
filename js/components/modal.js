// modal.js — Dialog-based modal component

export function showModal(title, contentBuilder, onConfirm = null) {
  // Remove any existing modal
  const existing = document.querySelector('dialog.app-modal');
  if (existing) existing.remove();

  const dialog = document.createElement('dialog');
  dialog.className = 'app-modal';

  const heading = document.createElement('h2');
  heading.textContent = title;
  dialog.appendChild(heading);

  const content = document.createElement('div');
  content.className = 'modal-body';
  contentBuilder(content);
  dialog.appendChild(content);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
  });
  actions.appendChild(cancelBtn);

  if (onConfirm) {
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Save';
    confirmBtn.addEventListener('click', () => {
      onConfirm();
      dialog.close();
      dialog.remove();
    });
    actions.appendChild(confirmBtn);
  }

  dialog.appendChild(actions);

  // Close on backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close();
      dialog.remove();
    }
  });

  document.body.appendChild(dialog);
  dialog.showModal();

  return dialog;
}
