/* ============================================================
   BudgetNest — превключвател на тема

   Един бутон обикаля четири теми:
     светла → тъмна → Кехлибар → Лагуна → светла

   Изборът се пази в localStorage под същия ключ, който страниците
   вече използват ('budgetnest-theme'), така че старите избори
   (light / dark) продължават да работят без промяна.

   Скриптът се зарежда с defer и заменя глобалните applyTheme() и
   toggleTheme(), които всяка страница дефинира вграден. Така
   onclick="toggleTheme()" в HTML продължава да работи, но вече
   минава през трите теми. Вградените функции остават като резервен
   вариант, ако този файл не се зареди.

   По избор темата може да се сменя автоматично според часовника на
   устройството: дневна тема от 07:00 до 18:00 и нощна тема от 18:00
   до 07:00. Настройката се пази отделно и НЕ е задължителна — при
   изключване сайтът използва една ръчно избрана тема.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'budgetnest-theme';
  var SCHEDULE_KEY = 'budgetnest-theme-schedule';
  var THEMES = ['light', 'dark', 'amber', 'lagoon'];
  var DARK_THEMES = ['dark', 'lagoon'];
  var DEFAULT_THEME = 'light';

  // Стари избори, които вече не са валидни теми, се пренасочват, за да не
  // изгуби потребителят темата си след премахването на Хелуин.
  var LEGACY_THEMES = { halloween: 'amber' };

  var DAY_START_HOUR = 7;   // 07:00 — начало на дневната тема
  var NIGHT_START_HOUR = 18; // 18:00 — начало на нощната тема
  var DEFAULT_SCHEDULE = { enabled: false, day: 'light', night: 'dark' };
  var SCHEDULE_CHECK_MS = 30000;

  var SUN_ICON_PATH = '<circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  var MOON_ICON_PATH = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  // Кехлибар: следващата тема след тъмната е Кехлибар.
  var SPARKLE_ICON_PATH =
    '<path d="M12 3.2l1.9 5.1 5.1 1.9-5.1 1.9L12 17.2l-1.9-5.1L5 10.2l5.1-1.9z"></path>' +
    '<path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"></path>';
  // Капка: следващата тема след Кехлибар е Лагуна.
  var DROPLET_ICON_PATH =
    '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C5 11.1 4 13 4 15a7 7 0 0 0 7 7z"></path>';

  // Иконата показва СЛЕДВАЩАТА тема (както досега слънце/луна).
  var ICON_BY_CURRENT_THEME = {
    light: MOON_ICON_PATH,
    dark: SPARKLE_ICON_PATH,
    amber: DROPLET_ICON_PATH,
    lagoon: SUN_ICON_PATH
  };

  // Цветът на адресната лента в браузъра следва средата на градиента.
  var THEME_COLORS = {
    light: '#E8F4D7',
    dark: '#0A2A2A',
    amber: '#F6E4CE',
    lagoon: '#06222A'
  };

  var TITLES = {
    bg: {
      light: 'Смяна на тема (следваща: тъмна)',
      dark: 'Смяна на тема (следваща: Кехлибар)',
      amber: 'Смяна на тема (следваща: Лагуна)',
      lagoon: 'Смяна на тема (следваща: светла)',
      scheduled: 'Смяна на тема (изключва автоматичната смяна)'
    },
    en: {
      light: 'Toggle theme (next: dark)',
      dark: 'Toggle theme (next: Amber)',
      amber: 'Toggle theme (next: Lagoon)',
      lagoon: 'Toggle theme (next: light)',
      scheduled: 'Toggle theme (turns off automatic switching)'
    }
  };

  function resolveTheme(theme) {
    if (LEGACY_THEMES[theme]) theme = LEGACY_THEMES[theme];
    return THEMES.indexOf(theme) !== -1 ? theme : null;
  }

  function normalize(theme) {
    return resolveTheme(theme) || DEFAULT_THEME;
  }

  // ===== Автоматична смяна на темата по часовник =====
  function normalizeSchedule(input) {
    input = input || {};
    return {
      enabled: input.enabled === true,
      day: resolveTheme(input.day) || DEFAULT_SCHEDULE.day,
      night: resolveTheme(input.night) || DEFAULT_SCHEDULE.night
    };
  }

  function readSchedule() {
    var raw = null;
    try { raw = localStorage.getItem(SCHEDULE_KEY); } catch (e) { /* ignore */ }
    if (!raw) return normalizeSchedule(DEFAULT_SCHEDULE);
    try {
      return normalizeSchedule(JSON.parse(raw));
    } catch (e) {
      return normalizeSchedule(DEFAULT_SCHEDULE);
    }
  }

  function writeSchedule(schedule) {
    try { localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule)); } catch (e) { /* ignore */ }
  }

  function currentPeriod(date) {
    var hour = (date || new Date()).getHours();
    return (hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR) ? 'day' : 'night';
  }

  function themeForTime(schedule, date) {
    schedule = normalizeSchedule(schedule);
    return currentPeriod(date) === 'day' ? schedule.day : schedule.night;
  }

  function dispatchScheduleChange(schedule) {
    document.dispatchEvent(new CustomEvent('budgetnest:schedulechange', {
      detail: { schedule: schedule }
    }));
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

    var title = readSchedule().enabled
      ? TITLES[currentLang()].scheduled
      : TITLES[currentLang()][theme];
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.setAttribute('data-theme-current', theme);
  }

  function applyTheme(theme, persist) {
    theme = normalize(theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Нативните контроли (select, скролбар, date picker) да следват темата.
    document.documentElement.style.colorScheme = DARK_THEMES.indexOf(theme) === -1 ? 'light' : 'dark';

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
    var schedule = readSchedule();
    var wasScheduled = schedule.enabled;

    // Ръчната смяна винаги връща контрола на потребителя.
    if (wasScheduled) {
      schedule.enabled = false;
      writeSchedule(schedule);
    }

    var current = normalize(document.documentElement.getAttribute('data-theme'));
    var next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    applyTheme(next, true);

    if (wasScheduled) dispatchScheduleChange(schedule);
    return next;
  }

  // Променя настройката за автоматична смяна (или само една от темите ѝ).
  function setSchedule(partial) {
    partial = partial || {};
    var previous = readSchedule();
    var next = normalizeSchedule({
      enabled: partial.enabled !== undefined ? partial.enabled : previous.enabled,
      day: partial.day !== undefined ? partial.day : previous.day,
      night: partial.night !== undefined ? partial.night : previous.night
    });

    writeSchedule(next);

    if (next.enabled) {
      applyTheme(themeForTime(next), false);
    } else {
      // Изключване: оставаме на текущата тема и я запазваме като ръчен избор.
      applyTheme(normalize(document.documentElement.getAttribute('data-theme')), true);
    }

    dispatchScheduleChange(next);
    return next;
  }

  function setManualTheme(theme) {
    var schedule = readSchedule();
    var wasScheduled = schedule.enabled;

    if (wasScheduled) {
      schedule.enabled = false;
      writeSchedule(schedule);
    }

    var applied = applyTheme(theme, true);
    if (wasScheduled) dispatchScheduleChange(schedule);
    return applied;
  }

  // Проверява часовника и прилага темата за текущия период. Вика се
  // периодично, при връщане към разделa и при промяна в друга отметка.
  var lastPeriod = currentPeriod();
  function syncSchedule() {
    var schedule = readSchedule();
    var period = currentPeriod();

    if (schedule.enabled) {
      var theme = themeForTime(schedule);
      if (normalize(document.documentElement.getAttribute('data-theme')) !== theme) {
        applyTheme(theme, false);
      }
      if (lastPeriod !== period) dispatchScheduleChange(schedule);
    }

    lastPeriod = period;
  }

  // Заместваме вградените функции на страниците.
  window.applyTheme = function (theme) { return applyTheme(theme, true); };
  window.toggleTheme = toggleTheme;
  window.BudgetNestTheme = {
    applyTheme: window.applyTheme,
    toggleTheme: toggleTheme,
    get: function () { return normalize(document.documentElement.getAttribute('data-theme')); },
    themes: THEMES.slice(),
    getSchedule: readSchedule,
    setSchedule: setSchedule,
    setManualTheme: setManualTheme,
    isScheduleEnabled: function () { return readSchedule().enabled; },
    currentPeriod: currentPeriod,
    themeForNow: function () { return themeForTime(readSchedule()); },
    refresh: syncSchedule
  };

  function init() {
    var schedule = readSchedule();

    if (schedule.enabled) {
      applyTheme(themeForTime(schedule), false);
      return;
    }

    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }

    if (!saved) {
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      saved = prefersDark ? 'dark' : 'light';
    }

    applyTheme(saved, true);
  }

  init();

  // Дневната/нощната тема се сменя сама до 30 секунди след 07:00 или 18:00.
  setInterval(syncSchedule, SCHEDULE_CHECK_MS);
  window.addEventListener('focus', syncSchedule);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) syncSchedule();
  });

  // Синхронизация между отворените раздели на приложението.
  window.addEventListener('storage', function (event) {
    if (!event || !event.key) return;
    var schedule = readSchedule();

    if (event.key === SCHEDULE_KEY) {
      if (schedule.enabled) {
        applyTheme(themeForTime(schedule), false);
      } else {
        var manual = null;
        try { manual = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
        applyTheme(normalize(manual), false);
      }
      dispatchScheduleChange(schedule);
    } else if (event.key === STORAGE_KEY && !schedule.enabled) {
      applyTheme(normalize(event.newValue), false);
    }
  });

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
