/* ============================================================
   BudgetNest — UX слой (ux.js)

   Малък, независим скрипт, който прави сайта по-плавен:
     • показва hero/входа след проверката за сесия;
     • пуска картите на приложението, когато съдържанието се появи;
     • разкрива секциите при скрол (data-reveal);
     • брои сумите в таблото/портфейла от старата към новата стойност;
     • добавя лек ripple при натискане на бутони;
     • показва тънка лента за зареждане при вътрешна навигация;
     • свива горната лента при скрол и рисува индикатор за прочетеното;
     • добавя „Към съдържанието“ за клавиатура.

   Всичко е прогресивно: ако нещо не се поддържа или се счупи,
   страницата остава напълно използваема.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var prefersReduced = false;
  try {
    prefersReduced = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* ignore */ }

  // С този клас CSS знае, че скриптът работи и може да крие елементи
  // преди появата им. Без него всичко се вижда веднага.
  root.classList.add('bn-js');

  function raf(fn) {
    return (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); })(fn);
  }

  function now() {
    return (window.performance && window.performance.now)
      ? window.performance.now()
      : Date.now();
  }

  function mainElement() {
    return document.getElementById('dashboard-main') || document.getElementById('page-main');
  }

  function isEnglish() {
    var lang = '';
    try { lang = localStorage.getItem('budgetnest-lang') || ''; } catch (e) { /* ignore */ }
    if (!lang) lang = root.getAttribute('lang') || '';
    return String(lang).toLowerCase().indexOf('en') === 0;
  }

  // ============================================================
  // 1. Показване на страницата след проверката за сесия
  //    (index.html държи body скрит, докато провери дали има вход)
  // ============================================================
  function initPageVisible() {
    if (!root.classList.contains('bn-auth-checking')) {
      root.classList.add('bn-page-visible');
      return;
    }

    var done = false;
    var observer = null;

    function show() {
      if (done) return;
      done = true;
      root.classList.add('bn-page-visible');
      if (observer) observer.disconnect();
    }

    if (window.MutationObserver) {
      observer = new MutationObserver(function () {
        if (!root.classList.contains('bn-auth-checking')) show();
      });
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    }

    // Предпазна мрежа — страницата никога не остава без анимациите си.
    setTimeout(show, 3600);
  }

  // ============================================================
  // 2. Приложението: пускане на картите, когато main стане видим
  // ============================================================
  function initAppMain() {
    var main = mainElement();
    if (!main) return;

    var cards = main.querySelectorAll('.card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.setProperty('--bn-i', String(Math.min(i, 8)));
    }

    var revealed = false;
    var observer = null;

    function reveal() {
      if (revealed) return;
      var cs = window.getComputedStyle(main);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;

      revealed = true;
      main.classList.add('bn-app-ready');
      if (observer) observer.disconnect();
    }

    if (window.MutationObserver) {
      observer = new MutationObserver(reveal);
      observer.observe(main, { attributes: true, attributeFilter: ['style', 'class'] });
    }

    reveal();

    // Ако проверката се забави, показваме картите без анимация,
    // вместо да ги държим скрити.
    setTimeout(function () {
      if (revealed) return;
      revealed = true;
      main.classList.add('bn-app-ready');
      if (observer) observer.disconnect();
    }, 3200);
  }

  // ============================================================
  // 3. Поява на секциите при скрол
  // ============================================================
  function initReveal() {
    if (prefersReduced || !('IntersectionObserver' in window)) return;

    var nodes = document.querySelectorAll('[data-reveal]');
    if (!nodes.length) {
      // На началната страница маркираме секциите автоматично, за да
      // не пишем data-reveal на десетки места в HTML-а.
      if (!document.querySelector('.hero')) return;
      nodes = document.querySelectorAll('.section-title, .section-sub, .feature, .step, .cta-band');
    }
    if (!nodes.length) return;

    var groups = [];
    function nextIndex(parent) {
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].parent === parent) {
          groups[i].count += 1;
          return groups[i].count - 1;
        }
      }
      groups.push({ parent: parent, count: 1 });
      return 0;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('bn-revealed');
        observer.unobserve(entry.target);
      }
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
      var index = nextIndex(el.parentNode);
      el.style.setProperty('--bn-reveal-i', String(Math.min(index, 5)));
      observer.observe(el);
    }
  }

  // ============================================================
  // 4. Брояч на сумите (табло, портфейл)
  //    Разпознава както „1 234,56 €“, така и „1,234.56 €“.
  // ============================================================
  function analyzeMoney(text) {
    var raw = String(text == null ? '' : text);
    var first = raw.search(/\d/);
    if (first < 0) return null;
    var last = raw.search(/\d(?=\D*$)/);
    if (last < 0) return null;

    var prefix = raw.slice(0, first);
    var suffix = raw.slice(last + 1);
    var core = raw.slice(first, last + 1);
    var negative = /[-\u2212]/.test(prefix);

    var lastDot = core.lastIndexOf('.');
    var lastComma = core.lastIndexOf(',');
    var decimalSep = '';

    if (lastDot > -1 && lastComma > -1) {
      decimalSep = lastDot > lastComma ? '.' : ',';
    } else if (lastComma > -1) {
      decimalSep = (core.length - lastComma - 1) === 2 ? ',' : '';
    } else if (lastDot > -1) {
      decimalSep = (core.length - lastDot - 1) === 2 ? '.' : '';
    }

    var decimalAt = decimalSep ? core.lastIndexOf(decimalSep) : -1;
    var intPart = decimalSep ? core.slice(0, decimalAt) : core;
    var fracPart = decimalSep ? core.slice(decimalAt + 1) : '';

    var groupSep = '';
    var spaceMatch = intPart.match(/[ \u00A0\u202F\u2009]/);
    if (spaceMatch) groupSep = spaceMatch[0];
    else if (intPart.indexOf(',') > -1) groupSep = ',';
    else if (intPart.indexOf('.') > -1) groupSep = '.';

    var intDigits = intPart.replace(/[^\d]/g, '') || '0';
    var fracDigits = fracPart.replace(/[^\d]/g, '').slice(0, 2);
    var value = parseFloat(intDigits + (fracDigits ? '.' + fracDigits : ''));
    if (!isFinite(value)) return null;
    if (negative) value = -value;

    var decimals = decimalSep ? 2 : 0;

    return {
      value: value,
      format: function (v) {
        var neg = v < 0;
        var fixed = Math.abs(v).toFixed(decimals);
        var bits = fixed.split('.');
        var intOut = bits[0];
        if (groupSep) {
          intOut = intOut.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
        }
        var out = prefix + (neg && !/[-\u2212]/.test(prefix) ? '-' : '') + intOut;
        if (decimals && bits[1]) out += decimalSep + bits[1];
        return out + suffix;
      }
    };
  }

  // Всяка плочка пази състоянието си, за да може нова стойност,
  // пристигнала по време на броенето, да поеме щафетата от текущото
  // число, вместо да бъде презаписана от старата анимация.
  function animateMoney(el, state, analyzed) {
    var format = analyzed.format;
    var from = state.current;
    var to = analyzed.value;
    var targetText = el.textContent;
    var start = now();
    var duration = 620;
    var token = ++state.token;

    // Връщаме текущата видима стойност, преди първият кадър да я поеме —
    // така новата сума не примигва за миг преди началото на броенето.
    var seedText = format(state.current);
    if (el.textContent !== seedText) {
      el.textContent = seedText;
      state.lastText = seedText;
    }

    function frame(t) {
      // По-нова анимация е поела елемента — тази спира.
      if (token !== state.token) return;

      var progress = Math.min(1, (t - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = from + (to - from) * eased;
      var text = format(value);

      state.current = value;
      if (el.textContent !== text) {
        el.textContent = text;
        state.lastText = text;
      }

      if (progress < 1) {
        raf(frame);
      } else {
        state.current = to;
        if (el.textContent !== targetText) {
          el.textContent = targetText;
          state.lastText = targetText;
        }
      }
    }

    raf(frame);
  }

  function attachCounter(el) {
    var initial = analyzeMoney(el.textContent);
    if (!initial) return;

    var state = {
      current: initial.value,
      lastText: el.textContent,
      token: 0
    };

    var observer = new MutationObserver(function () {
      // Собствените записи на брояча не са нови данни.
      if (el.textContent === state.lastText) return;

      var next = analyzeMoney(el.textContent);
      if (!next) return;

      // Форматирането може да се смени (напр. при смяна на езика),
      // без сумата да е различна — тогава не пускаме брояч.
      if (Math.abs(next.value - state.current) < 0.005) {
        state.current = next.value;
        state.lastText = el.textContent;
        return;
      }

      animateMoney(el, state, next);
    });

    observer.observe(el, { childList: true, characterData: true, subtree: true });
  }

  function initCountUp() {
    if (prefersReduced || !window.MutationObserver) return;

    var els = document.querySelectorAll('.summary-value, .wallet-value');
    for (var i = 0; i < els.length; i++) attachCounter(els[i]);
  }

  // ============================================================
  // 5. Плавна вътрешна навигация + лента за зареждане
  // ============================================================
  function initNavigation() {
    if (prefersReduced) return;

    var progress = null;
    var leaving = false;

    function ensureProgress() {
      if (progress) return progress;
      progress = document.createElement('div');
      progress.className = 'bn-progress';
      progress.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progress);
      return progress;
    }

    function startProgress() {
      var el = ensureProgress();
      el.classList.remove('bn-done');
      el.classList.add('bn-active');
      el.style.transform = 'scaleX(0.08)';
      raf(function () {
        raf(function () { el.style.transform = 'scaleX(0.72)'; });
      });
    }

    function resetProgress() {
      leaving = false;
      root.classList.remove('bn-leaving');
      if (!progress) return;
      progress.classList.remove('bn-active', 'bn-done');
      progress.style.transform = 'scaleX(0)';
    }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (leaving) { e.preventDefault(); return; }
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!link) return;

      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download') || link.hasAttribute('data-no-transition')) return;

      var href = link.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') return;
      if (/^(mailto:|tel:|javascript:|blob:|data:)/i.test(href)) return;

      var url;
      try { url = new URL(link.href, window.location.href); } catch (err) { return; }
      if (url.origin !== window.location.origin) return;

      // Същата страница, само котва — оставяме браузъра да скролира.
      if (url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash) return;

      leaving = true;
      startProgress();
      root.classList.add('bn-leaving');

      // Кратка пауза, за да се види избледняването, после навигация.
      e.preventDefault();
      setTimeout(function () {
        window.location.href = url.href;
      }, 120);
    }, false);

    window.addEventListener('pageshow', resetProgress);
  }

  // ============================================================
  // 6. Горна лента: свиване при скрол
  // ============================================================
  function initHeader() {
    var header = document.querySelector('body > header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', (window.pageYOffset || root.scrollTop) > 6);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      raf(update);
    }, { passive: true });
    update();
  }

  // ============================================================
  // 7. Индикатор за прочетеното (само на началната страница)
  // ============================================================
  function initScrollProgress() {
    if (!document.querySelector('.hero')) return;

    var bar = document.createElement('div');
    bar.className = 'bn-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var offset = window.pageYOffset || doc.scrollTop || 0;
      var ratio = max > 0 ? offset / max : 0;
      ratio = Math.max(0, Math.min(1, ratio));
      bar.style.transform = 'scaleX(' + ratio + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      raf(update);
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // ============================================================
  // 8. Ripple при натискане
  // ============================================================
  function initRipple() {
    if (prefersReduced) return;

    var selector = '.btn, button.submit, .btn-primary-sm, .budget-save-btn, ' +
      '.template-chip, .type-btn, .method-btn, .chart-arrow, .theme-toggle, ' +
      '.admin-page-btn, .tab, .empty-state-rich a.cta-link';

    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      var el = e.target && e.target.closest ? e.target.closest(selector) : null;
      if (!el || el.disabled || el.dataset.bnNoRipple !== undefined) return;

      var rect = el.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.1;
      if (!size) return;

      var ripple = document.createElement('span');
      ripple.className = 'bn-ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

      el.classList.add('bn-ripple-host');
      el.appendChild(ripple);

      setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 600);
    }, false);
  }

  // ============================================================
  // 9. „Към съдържанието“ за клавиатура
  // ============================================================
  var skipLink = null;

  function skipLinkText() {
    return isEnglish() ? 'Skip to content' : 'Към съдържанието';
  }

  function initSkipLink() {
    var main = mainElement();
    if (!main || !main.id || document.querySelector('.bn-skip-link')) return;

    skipLink = document.createElement('a');
    skipLink.className = 'bn-skip-link';
    skipLink.href = '#' + main.id;
    skipLink.textContent = skipLinkText();
    document.body.insertBefore(skipLink, document.body.firstChild);

    skipLink.addEventListener('click', function () {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      setTimeout(function () {
        try { main.focus({ preventScroll: true }); } catch (e) { main.focus(); }
      }, 0);
    });
  }

  function initI18nHooks() {
    if (!skipLink) return;
    if (window.BudgetNestI18n && typeof window.BudgetNestI18n.onChange === 'function') {
      window.BudgetNestI18n.onChange(function () {
        skipLink.textContent = skipLinkText();
      });
    }
  }

  // ============================================================
  // Стартиране
  // ============================================================
  function init() {
    try {
      initPageVisible();
      initAppMain();
      initReveal();
      initCountUp();
      initNavigation();
      initHeader();
      initScrollProgress();
      initRipple();
      initSkipLink();
      initI18nHooks();
    } catch (err) {
      // При неочаквана грешка връщаме видимостта на всичко, за да не
      // остане страницата с невидими карти/секции.
      root.classList.remove('bn-js');
      if (window.console && console.warn) {
        try { console.warn('[BudgetNest UX]', err); } catch (e) { /* ignore */ }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.BudgetNestUX = {
    refresh: function () {
      try { initHeader(); initScrollProgress(); } catch (e) { /* ignore */ }
    }
  };
})();
