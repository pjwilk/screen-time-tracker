// nav.js — Navigation bar component

const routes = [
  { hash: 'dashboard', label: 'Dashboard' },
  { hash: 'classes', label: 'Classes' },
  { hash: 'history', label: 'History' },
  { hash: 'weekly', label: 'Weekly' },
  { hash: 'admin', label: 'Admin' },
];

export function renderNav(container) {
  const ul = document.createElement('ul');

  for (const route of routes) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${route.hash}`;
    a.textContent = route.label;
    if (route.hash === 'admin') {
      a.textContent = '\u{1F512} ' + route.label;
    }
    li.appendChild(a);
    ul.appendChild(li);
  }

  container.innerHTML = '';
  container.appendChild(ul);
  updateActiveLink();
}

export function updateActiveLink() {
  const current = location.hash.slice(1) || 'dashboard';
  const links = document.querySelectorAll('#app-nav a');
  for (const link of links) {
    const hash = link.getAttribute('href').slice(1);
    link.classList.toggle('active', hash === current);
  }
}
