/* ============================================================
   BudgetNest — превключвател на тема

   Един бутон обикаля три теми:
     светла → тъмна → Хелуин → светла

   Изборът се пази в localStorage под същия ключ, който страниците
   вече използват ('budgetnest-theme'), така че старите избори
   (light / dark) продължават да работят без промяна.

   Скриптът се зарежда с defer и заменя глобалните applyTheme() и
   toggleTheme(), които всяка страница дефинира вграден. Така
   onclick="toggleTheme()" в HTML продължава да работи, но вече
   минава през трите теми. Вградените функции остават като резервен
   вариант, ако този файл не се зареди.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'budgetnest-theme';
  var THEMES = ['light', 'dark', 'halloween'];
  var DEFAULT_THEME = 'light';

  var SUN_ICON_PATH = '<circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  var MOON_ICON_PATH = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  // Тиква-фенерче: следващата тема след тъмната е Хелуин.
  var PUMPKIN_ICON_PATH =
    '<path d="M12 6.2c-.9-1.1-2.4-1.6-3.8-1.3C5.9 5.6 4.7 7.7 5.1 9.9c.2 1.1.8 2 1.6 2.8-.9.7-1.4 1.8-1.4 2.9 0 2.3 2 4 4.4 3.6 1-.2 1.9-.7 2.5-1.4.6.7 1.5 1.2 2.5 1.4 2.4.4 4.4-1.3 4.4-3.6 0-1.1-.5-2.2-1.4-2.9.8-.8 1.4-1.7 1.6-2.8.4-2.2-.8-4.3-3.1-5-1.4-.3-2.9.2-3.8 1.3z"></path>' +
    '<path d="M12 6.2V4.3"></path>' +
    '<path d="M9.2 11.6h1.4"></path><path d="M13.4 11.6h1.4"></path>' +
    '<path d="M9.5 15.1l2.5 2.3 2.5-2.3"></path>';

  // Иконата показва СЛЕДВАЩАТА тема (както досега слънце/луна).
  var ICON_BY_CURRENT_THEME = {
    light: MOON_ICON_PATH,
    dark: PUMPKIN_ICON_PATH,
    halloween: SUN_ICON_PATH
  };

  // Цветът на адресната лента в браузъра следва средата на градиента.
  var THEME_COLORS = {
    light: '#E8F4D7',
    dark: '#0A2A2A',
    halloween: '#2F1033'
  };

  var TITLES = {
    bg: {
      light: 'Смяна на тема (следваща: тъмна)',
      dark: 'Смяна на тема (следваща: Хелуин)',
      halloween: 'Смяна на тема (следваща: светла)'
    },
    en: {
      light: 'Toggle theme (next: dark)',
      dark: 'Toggle theme (next: Halloween)',
      halloween: 'Toggle theme (next: light)'
    }
  };

  function normalize(theme) {
    return THEMES.indexOf(theme) !== -1 ? theme : DEFAULT_THEME;
  }

  function currentLang() {
    try {
      if (window.BudgetNestI18n && typeof window.BudgetNestI18n.getLang === 'function') {
        return window.BudgetNestI18n.getLang() === 'en' ? 'en' : 'bg';
      }
    } catch (e) { /* ignore */ }
    return 'bg';
  }

  function updateButton(theme) {
    var btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-toggle-icon">' +
      ICON_BY_CURRENT_THEME[theme] + '</svg>';

    var title = TITLES[currentLang()][theme];
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.setAttribute('data-theme-current', theme);
  }

  function applyTheme(theme, persist) {
    theme = normalize(theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Нативните контроли (select, скролбар, date picker) да следват темата.
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';

    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', THEME_COLORS[theme]);

    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
    }

    updateButton(theme);

    // Диаграмите на таблото се рисуват върху canvas и не се пребоядисват
    // сами при смяна на CSS променливите — страницата слуша това събитие.
    document.dispatchEvent(new CustomEvent('budgetnest:themechange', {
      detail: { theme: theme }
    }));

    return theme;
  }

  function toggleTheme() {
    var current = normalize(document.documentElement.getAttribute('data-theme'));
    var next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    return applyTheme(next, true);
  }

  // Заместваме вградените функции на страниците.
  window.applyTheme = function (theme) { return applyTheme(theme, true); };
  window.toggleTheme = toggleTheme;
  window.BudgetNestTheme = {
    applyTheme: window.applyTheme,
    toggleTheme: toggleTheme,
    get: function () { return normalize(document.documentElement.getAttribute('data-theme')); },
    themes: THEMES.slice()
  };

  function init() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }

    if (!saved) {
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      saved = prefersDark ? 'dark' : 'light';
    }

    applyTheme(saved, true);
  }

  init();

  // i18n.js превежда заглавието на бутона при смяна на езика и при
  // първоначалното зареждане. Подновяваме го след нея, за да остане
  // описанието на следващата тема на правилния език.
  if (document.readyState === 'complete') {
    updateButton(normalize(document.documentElement.getAttribute('data-theme')));
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      updateButton(normalize(document.documentElement.getAttribute('data-theme')));
    });
  }
  if (window.BudgetNestI18n && typeof window.BudgetNestI18n.onChange === 'function') {
    window.BudgetNestI18n.onChange(function () {
      updateButton(normalize(document.documentElement.getAttribute('data-theme')));
    });
  }
})();
