/* ============================================================================
   BudgetNest — споделена библиотека с custom SVG иконки.

   Замества емоджитата (навигация, категории, начини на плащане, лого, както и
   UI символи — звънец, предупреждение, звезди, стрелки, отметки и т.н.) с
   единен стил line-иконки, за да изглежда сайтът изчистено и професионално,
   вместо emoji, които изглеждат различно на всяко устройство/браузър.

   Използва се на всяка страница чрез:
     <script src="icons.js?v=2" defer></script>
   и автоматично:
     - инжектира иконата в логото (#brand-mark-link)
     - попълва иконите в лявото меню (елементи с id="nav-icon-*")
     - обхожда текста на страницата и заменя познатите емоджита с SVG
       (iconify) — включително съдържание, вкарано динамично или от i18n.

   Емоджи пикърът (.emp-panel / input-и с data-emoji-picker) НЕ се пипа —
   там потребителят нарочно избира емоджи. Полетата за въвеждане, <option>
   в падащи менюта и елементи с data-no-icon също се пропускат.

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

    // ===== UI символи =====
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.5h6l-1 2.2a1 1 0 0 0 .2 1.1A7 7 0 1 1 9.8 6.8a1 1 0 0 0 .2-1.1L9 3.5Z"></path><path d="M12 10.5v6M10.6 11.8h2.1a1.2 1.2 0 0 1 0 2.4h-1.4a1.2 1.2 0 0 0 0 2.4H13"></path></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"></circle></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5"></path><path d="M13.7 20a2 2 0 0 1-3.4 0"></path></svg>',
    bellOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.7 20a2 2 0 0 1-3.4 0"></path><path d="M18 8.5a6 6 0 0 0-9.2-5.1"></path><path d="M6 8.5c0 6-2.5 7.5-2.5 7.5h13"></path><path d="M3 3l18 18"></path></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 4 1.8 18.5A2 2 0 0 0 3.5 21.5h17a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z"></path><path d="M12 9.5v4.5"></path><path d="M12 17.5h.01"></path></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3Z"></path></svg>',
    starOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3Z"></path></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"></path></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v14M6 12l6 6 6-6"></path></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"></path><path d="M3 21v-5h5"></path></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2"></rect><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"></path></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"></circle><path d="M10.8 12.2 20 3M16.5 6.5 19 9M13.5 9.5l2.5 2.5"></path></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 18h5M10.5 21h3"></path><path d="M12 3a6 6 0 0 0-3.8 10.7c.5.4.8 1 .8 1.6v.7h6v-.7c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"></path></svg>',
    sprout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"></path><path d="M12 13c0-3-2.2-5.2-5.2-5.2H4C4 10.8 6.2 13 9.2 13H12Z"></path><path d="M12 11.5c0-3.2 2.2-5.5 5.4-5.5H20c0 3.2-2.2 5.5-5.4 5.5H12Z"></path></svg>',
    party: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 4 1.1 3.1L16 8.2l-2.9 1.1L12 12.4l-1.1-3.1L8 8.2l2.9-1.1L12 4Z" fill="currentColor" stroke="none"></path><path d="m5 14 .8 2 2 .8-2 .8L5 20l-.8-2.4-2-.8 2-.8L5 14Z" fill="currentColor" stroke="none"></path><path d="M19 13.5v0M18 18.5v0M20.5 17v0"></path></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-2 8 9-12h-7l2-8Z"></path></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2"></rect><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"></path></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3Z"></path><path d="M14 8l3 3"></path></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="9" width="17" height="4.5" rx="1"></rect><path d="M5 13.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6.5M12 9v12"></path><path d="M12 9C11 6 9 5.5 8 6.2 6.8 7 7.6 9 9.4 9H12Zm0 0c1-3 3-3.5 4-2.8 1.2.8.4 2.8-1.4 2.8H12Z"></path></svg>',
    // Малко цветно българско знаме (изключение — ползва фиксирани цветове)
    flagBg: '<svg viewBox="0 0 24 16" preserveAspectRatio="xMidYMid meet"><rect width="24" height="16" rx="2.5" fill="#fff"></rect><rect y="5.33" width="24" height="5.34" fill="#00966E"></rect><rect y="10.67" width="24" height="5.33" fill="#D62612"></rect></svg>',
  };

  // Емоджи → ключ на SVG иконка.
  const EMOJI_TO_SVG_KEY = {
    // категории / плащане
    '🛒': 'cart', '🏠': 'home', '🚗': 'car', '💊': 'heart', '🎬': 'film',
    '📦': 'box', '💶': 'coin', '➕': 'plus', '💳': 'card', '💵': 'cash',
    // UI
    '💰': 'money', '🎯': 'target', '🔔': 'bell', '🔕': 'bellOff',
    '⚠': 'warning', '🌱': 'sprout', '🎉': 'party', '💡': 'bulb', '⚡': 'bolt',
    '🗓': 'calendar', '✏': 'pencil', '🔍': 'search', '🔒': 'lock', '🔑': 'key',
    '🎁': 'gift',
    // звезди
    '★': 'star', '⭐': 'star', '☆': 'starOutline',
    // отметки
    '✓': 'check', '✔': 'check', '✗': 'cross', '✕': 'cross', '✖': 'cross',
    // стрелки
    '→': 'arrowRight', '←': 'arrowLeft', '⬇': 'arrowDown', '↻': 'refresh',
    // знаме (двойка regional indicators)
    '🇧🇬': 'flagBg',
  };

  const SKIP_SELECTOR = 'script,style,textarea,input,select,option,.emp-panel,.emp-trigger,[data-no-icon],[contenteditable]';

  function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Рендира SVG иконка вместо емоджи, ако разпознаваме символа; иначе
  // грациозно показва оригиналното емоджи (напр. потребителски категории).
  function renderCatIcon(emoji, sizePx) {
    const clean = String(emoji ?? '').replace(/️/g, '');
    const key = EMOJI_TO_SVG_KEY[clean];
    if (key && SVG_ICONS[key]) {
      const s = sizePx || 20;
      return `<span class="bn-icon" style="width:${s}px;height:${s}px;vertical-align:-0.18em;">${SVG_ICONS[key]}</span>`;
    }
    return esc(emoji || '💰');
  }

  function iconSpan(key) {
    const span = document.createElement('span');
    span.className = 'bn-icon';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = SVG_ICONS[key];
    return span;
  }

  // ---- Автоматична замяна на емоджита в текста на страницата -----------------
  const KEYS = Object.keys(EMOJI_TO_SVG_KEY).sort((a, b) => b.length - a.length);
  const MATCH_RE = new RegExp('(' + KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gu');

  function shouldSkip(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    return !!parent.closest(SKIP_SELECTOR);
  }

  function iconifyTextNode(node) {
    if (shouldSkip(node)) return;
    let text = node.nodeValue;
    if (!text || !/[←-⯿☀-➿️\uD800-\uDFFF]/.test(text)) return;
    if (text.indexOf('️') >= 0) text = text.replace(/️/g, '');
    MATCH_RE.lastIndex = 0;
    if (!MATCH_RE.test(text)) return;
    MATCH_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = MATCH_RE.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      frag.appendChild(iconSpan(EMOJI_TO_SVG_KEY[m[0]]));
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (node.parentNode) node.parentNode.replaceChild(frag, node);
  }

  function iconifyRoot(root) {
    if (!root) return;
    if (root.nodeType === 3) { iconifyTextNode(root); return; }
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches(SKIP_SELECTOR)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(iconifyTextNode);
  }

  let observer = null;
  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      observer.disconnect();
      try {
        for (const mut of mutations) {
          mut.addedNodes.forEach((node) => {
            if (node.nodeType === 1) iconifyRoot(node);
            else if (node.nodeType === 3) iconifyTextNode(node);
          });
        }
      } finally {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function injectStyle() {
    if (document.getElementById('bn-icon-style')) return;
    const st = document.createElement('style');
    st.id = 'bn-icon-style';
    st.textContent =
      '.bn-icon{display:inline-flex;align-items:center;justify-content:center;' +
      'width:1em;height:1em;vertical-align:-0.125em;line-height:0;flex:none;}' +
      '.bn-icon svg{width:100%;height:100%;display:block;}';
    (document.head || document.documentElement).appendChild(st);
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
    injectStyle();
    populateNavIcons();
    injectBrandBadge();
    iconifyRoot(document.body);
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.BudgetNestIcons = {
    renderCatIcon, iconify: iconifyRoot, SVG_ICONS, EMOJI_TO_SVG_KEY,
  };
})();
