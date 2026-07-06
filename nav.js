// Мобилно навигационно меню (хамбургер)
// Логиката е с "event delegation" — работи стабилно и на телефони,
// дори бутонът да се появи по-късно или скриптът да се зареди с defer.
(function () {
  function setExpanded(navbar, open) {
    const btn = navbar.querySelector('.nav-toggle');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function closeMenu(navbar) {
    navbar.classList.remove('nav-open');
    setExpanded(navbar, false);
  }

  document.addEventListener('click', function (e) {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // 1) Натискане на хамбургера -> отваря/затваря менюто
    if (e.target.closest('.nav-toggle')) {
      const open = navbar.classList.toggle('nav-open');
      setExpanded(navbar, open);
      return;
    }

    if (!navbar.classList.contains('nav-open')) return;

    // 2) Затваря менюто при избор на страница
    if (e.target.closest('.nav-link')) {
      closeMenu(navbar);
      return;
    }

    // 3) Затваря менюто при докосване извън навигацията
    if (!e.target.closest('.navbar')) {
      closeMenu(navbar);
    }
  });

  // Празна функция за съвместимост — ако някоя стара (кеширана) страница
  // все още вика toggleNav() от inline onclick, да не гърми с грешка.
  // Реалната работа я върши слушателят по-горе.
  window.toggleNav = function () {};
})();
