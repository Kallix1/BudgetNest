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

    // Важно: използваме e.composedPath() вместо e.target.closest(...).
    // Причината: бутони като темата презаписват своя innerHTML в отговор
    // на същия клик (за смяна на SVG иконата). Ако потребителят тапне
    // точно върху <svg>/<path>, този елемент бива премахнат от DOM-а
    // ОЩЕ преди събитието да "изблуква" (bubble) до document. В този
    // момент e.target вече е "прекъснат" (detached) възел и
    // e.target.closest(...) винаги връща null, независимо от истинското
    // място на клика — затова менюто грешно се затваряше.
    // composedPath() е заснет в момента на диспечване на събитието и не
    // се влияе от последващи промени в DOM-а, така че е сигурен начин
    // да проверим предците на елемента, върху който реално е кликнато.
    const path = e.composedPath ? e.composedPath() : null;
    function isInside(selector) {
      if (path) {
        return path.some(function (el) {
          return el.nodeType === 1 && el.matches && el.matches(selector);
        });
      }
      // Резервен вариант за много стари браузъри без composedPath()
      return !!(e.target && e.target.closest && e.target.closest(selector));
    }

    // 1) Натискане на хамбургера -> отваря/затваря менюто
    if (isInside('.nav-toggle')) {
      const open = navbar.classList.toggle('nav-open');
      setExpanded(navbar, open);
      return;
    }

    if (!navbar.classList.contains('nav-open')) return;

    // 2) Затваря менюто при избор на страница
    if (isInside('.nav-link')) {
      closeMenu(navbar);
      return;
    }

    // 3) Затваря менюто при докосване извън навигацията
    // (бутонът за тема е вътре в .navbar, така че вече коректно НЕ го
    // затваря, дори да си сменя иконата по средата на клика)
    if (!isInside('.navbar')) {
      closeMenu(navbar);
    }
  });

  // Празна функция за съвместимост — ако някоя стара (кеширана) страница
  // все още вика toggleNav() от inline onclick, да не гърми с грешка.
  // Реалната работа я върши слушателят по-горе.
  window.toggleNav = function () {};

  // ============================================================
  // Мобилна долна навигация
  // Инжектира се оттук, за да я има на всяка страница, която зарежда
  // nav.js, без да се дублира еднакъв markup в 10+ HTML файла.
  // Активният таб се определя по името на текущия файл.
  // ============================================================
  var BOTTOM_NAV_ITEMS = [
    { href: 'dashboard.html', icon: '🏠', i18n: 'nav.dashboard', label: 'Табло' },
    { href: 'transactions.html', icon: '🧾', i18n: 'nav.transactions', label: 'Транзакции' },
    { href: 'budgets.html', icon: '📊', i18n: 'nav.budgets', label: 'Бюджети' },
    { href: 'wallets.html', icon: '💳', i18n: 'nav.wallets', label: 'Портфейл' },
    { href: 'goals.html', icon: '🎯', i18n: 'nav.goals', label: 'Цели' }
  ];

  function currentPageFile() {
    var file = window.location.pathname.split('/').pop();
    return (file || 'dashboard.html').toLowerCase();
  }

  function buildBottomNav() {
    if (!document.body) return;
    // Ако страницата някъде вече има долна навигация, не добавяме втора.
    if (document.querySelector('.bottom-nav')) return;

    var current = currentPageFile();
    var nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.id = 'bottom-nav';
    nav.setAttribute('aria-label', 'Мобилна навигация');

    BOTTOM_NAV_ITEMS.forEach(function (item) {
      var link = document.createElement('a');
      link.href = item.href;
      link.className = 'bottom-nav-item' + (item.href === current ? ' active' : '');
      if (item.href === current) link.setAttribute('aria-current', 'page');

      var icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.icon;

      var label = document.createElement('span');
      label.setAttribute('data-i18n', item.i18n);
      label.textContent = item.label;

      link.appendChild(icon);
      link.appendChild(label);
      nav.appendChild(link);
    });

    document.body.appendChild(nav);
  }

  buildBottomNav();
})();
