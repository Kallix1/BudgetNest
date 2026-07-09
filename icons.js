/* ============================================================================
   BudgetNest — споделена библиотека с custom SVG иконки.

   Замества емоджитата (навигация, категории, начини на плащане, лого) с
   единен стил line-иконки, за да изглежда сайтът изчистено и професионално,
   вместо emoji, които изглеждат различно на всяко устройство/браузър.

   Използва се на всяка страница чрез:
     <script src="icons.js?v=1" defer></script>
   и автоматично:
     - инжектира иконата в логото (#brand-mark-link)
     - попълва иконите в лявото меню (елементи с id="nav-icon-*")
   Помощната функция BudgetNestIcons.renderCatIcon(emoji, size) се ползва
   от JS кода на всяка страница, където досега е имало escapeHtml(emoji).
   ============================================================================ */

(function () {
  const SVG_ICONS = {
    // ===== Навигация в лявото меню =====
    navDashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5"></rect><rect x="13" y="3" width="8" height="5" rx="1.5"></rect><rect x="13" y="10" width="8" height="11" rx="1.5"></rect><rect x="3" y="13" width="8" height="8" rx="1.5"></rect></svg>',
    navTransactions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h13l-3-3M20 17H7l3 3"></path></svg>',
    navBudgets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9h-9V3Z"></path><path d="M15.5 3.5A9 9 0 0 1 20.5 8.5H15.5V3.5Z"></path></svg>',
    navWallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h13A1.5 1.5 0 0 1 19 7.5V9H4.5"></path><path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18v-7A1.5 1.5 0 0 0 19.5 9.5H16a2 2 0 1 0 0 4"></path></svg>',
    navGoals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"></circle></svg>',
    navRecurring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"></path><path d="M3 21v-5h5"></path></svg>',
    navSettle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3.2"></circle><circle cx="17" cy="9" r="2.6"></circle><path d="M2.5 20c0-3.3 2.5-5.8 5.5-5.8s5.5 2.5 5.5 5.8"></path><path d="M14.5 14.6c2.7.3 4.7 2.5 4.7 5.4"></path></svg>',
    navReviews: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3Z"></path></svg>',
    navSettings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.7.7 1.2 1.4 1.4h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"></path></svg>',
    navAdmin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v6c0 4.6 3.2 7.9 7.5 9 4.3-1.1 7.5-4.4 7.5-9V6L12 3Z"></path><path d="m9.2 12 1.9 1.9 3.7-3.9"></path></svg>',

    // ===== Категории (стандартните, създадени при ново домакинство) =====
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.4"></circle><circle cx="18" cy="21" r="1.4"></circle><path d="M2.5 3h2.5l2.6 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.55L21.5 8H6.2"></path></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11.5 12 4l8.5 7.5"></path><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9"></path><path d="M9.5 20v-6h5v6"></path></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16V9.5a1 1 0 0 1 .6-.9l2.4-1 1.3-2.6a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 2.6 2.4 1a1 1 0 0 1 .6.9V16"></path><path d="M3 16h18v2.5a.5.5 0 0 1-.5.5H19a1 1 0 0 1-1-1v-.6H6v.6a1 1 0 0 1-1 1H3.5a.5.5 0 0 1-.5-.5V16Z"></path><circle cx="7.5" cy="16" r="1.4"></circle><circle cx="16.5" cy="16" r="1.4"></circle></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.2s-7.5-4.6-9.8-9.2C.7 7.6 2.3 4 6 4c2 0 3.6 1.2 4.5 2.7C11.4 5.2 13 4 15 4c3.7 0 5.3 3.6 3.8 7C16.5 15.6 12 20.2 12 20.2Z"></path></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 9h18M3 15h18M8 4v16M16 4v16"></path></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 7 8.5-4 8.5 4-8.5 4-8.5-4Z"></path><path d="M3.5 7v10l8.5 4 8.5-4V7"></path><path d="M12 11v10"></path></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9.2 9.3a2.8 2.8 0 0 1 2.8-1.8c1.7 0 2.9 1.1 2.9 2.5s-1 1.9-2.9 2.3c-1.9.4-2.9 1-2.9 2.4s1.2 2.6 2.9 2.6a2.9 2.9 0 0 0 2.8-1.8"></path><path d="M12 6v1.2M12 16.8V18"></path></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.2"></rect><path d="M2.5 9.5h19"></path><path d="M6 14.5h4"></path></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6.5" width="20" height="11" rx="1.6"></rect><circle cx="12" cy="12" r="2.6"></circle><path d="M5.5 6.5v0M18.5 17.5v0"></path></svg>',
  };

  const EMOJI_TO_SVG_KEY = {
    '🛒': 'cart', '🏠': 'home', '🚗': 'car', '💊': 'heart', '🎬': 'film',
    '📦': 'box', '💶': 'coin', '➕': 'plus', '💳': 'card', '💵': 'cash',
  };

  // Рендира SVG иконка вместо емоджи, ако разпознаваме символа; иначе
  // грациозно показва оригиналното емоджи (напр. потребителски категории,
  // създадени през emoji picker-а в Настройки).
  function renderCatIcon(emoji, sizePx) {
    const key = EMOJI_TO_SVG_KEY[emoji];
    if (key && SVG_ICONS[key]) {
      return `<span class="cat-icon-svg" style="display:inline-flex; width:${sizePx || 20}px; height:${sizePx || 20}px; vertical-align:-4px;">${SVG_ICONS[key]}</span>`;
    }
    const esc = String(emoji ?? '💰')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc;
  }

  function populateNavIcons() {
    const map = {
      'nav-icon-dashboard': 'navDashboard', 'nav-icon-transactions': 'navTransactions',
      'nav-icon-budgets': 'navBudgets', 'nav-icon-wallet': 'navWallet',
      'nav-icon-goals': 'navGoals', 'nav-icon-recurring': 'navRecurring',
      'nav-icon-settle': 'navSettle', 'nav-icon-reviews': 'navReviews',
      'nav-icon-settings': 'navSettings', 'nav-icon-admin': 'navAdmin',
    };
    Object.entries(map).forEach(([elId, iconKey]) => {
      const el = document.getElementById(elId);
      if (el) el.innerHTML = SVG_ICONS[iconKey];
    });
  }

  // Custom лого — контур на къща с извивка (гнездо) вътре, вместо 🌱 емоджи.
  function injectBrandBadge() {
    const link = document.getElementById('brand-mark-link');
    if (!link || document.getElementById('brand-badge-icon')) return;
    const badge = document.createElement('span');
    badge.className = 'brand-badge';
    badge.id = 'brand-badge-icon';
    badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 9.8V19a1.3 1.3 0 0 0 1.3 1.3h10.4A1.3 1.3 0 0 0 18.5 19V9.8"></path><path d="M9.2 19v-4.2c0-1.1.6-1.9 1.6-2.3.9-.3 1.6-1.1 1.6-2.1 0-1.2-1-2.1-2.1-1.9-.8.1-1.4.7-1.6 1.4"></path></svg>';
    link.insertBefore(badge, link.firstChild);
  }

  function init() {
    populateNavIcons();
    injectBrandBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.BudgetNestIcons = { renderCatIcon, SVG_ICONS, EMOJI_TO_SVG_KEY };
})();
