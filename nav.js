// Мобилно навигационно меню (хамбургер)
function toggleNav(btn) {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const open = navbar.classList.toggle('nav-open');
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

document.addEventListener('click', function (e) {
  const navbar = document.querySelector('.navbar');
  if (!navbar || !navbar.classList.contains('nav-open')) return;

  // Затваря менюто при навигация към страница
  if (e.target.closest('.nav-link')) {
    navbar.classList.remove('nav-open');
    return;
  }

  // Затваря менюто при клик извън навигацията
  if (!e.target.closest('.navbar')) {
    navbar.classList.remove('nav-open');
    const btn = navbar.querySelector('.nav-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
});
