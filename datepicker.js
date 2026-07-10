/* ============================================
   BudgetNest — Custom календар за input[type="date"]
   Замества нативния браузърен picker с такъв, който
   следва темата на сайта (светла/тъмна).

   Важно: НЕ променя поведението на съществуващия код —
   .value, .valueAsDate, onchange/oninput продължават
   да работят по същия начин, защото истинският
   <input type="date"> остава в DOM-а (само е скрит).
   ============================================ */

(function () {
  const t = (key, fallback) => (window.BudgetNestI18n ? window.BudgetNestI18n.t(key) : fallback);
  const getLang = () => (window.BudgetNestI18n ? window.BudgetNestI18n.getLang() : 'bg');

  const MONTHS_BG = [
    'януари', 'февруари', 'март', 'април', 'май', 'юни',
    'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'
  ];
  const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const WEEKDAYS_BG = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'];
  const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  function months() { return getLang() === 'bg' ? MONTHS_BG : MONTHS_EN; }
  function weekdays() { return getLang() === 'bg' ? WEEKDAYS_BG : WEEKDAYS_EN; }

  const CAL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18"/><path d="M8 3v3M16 3v3"/></svg>`;

  function pad2(n) { return String(n).padStart(2, '0'); }

  function toISO(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }

  function parseISO(str) {
    if (!str) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
    if (!m) return null;
    return { y: +m[1], m: +m[2] - 1, d: +m[3] };
  }

  function formatDisplay(str) {
    const p = parseISO(str);
    if (!p) return '';
    if (getLang() === 'bg') return `${pad2(p.d)}.${pad2(p.m + 1)}.${p.y} г.`;
    return `${pad2(p.d)}/${pad2(p.m + 1)}/${p.y}`;
  }

  function sameDay(a, b) {
    return a && b && a.y === b.y && a.m === b.m && a.d === b.d;
  }

  /* ===== Единствен споделен панел за целия сайт (както при нативния picker) ===== */
  let panelEl = null;
  let activeCtx = null; // { fakeInput, realInput, viewYear, viewMonth }
  const enhancedInputs = []; // { realInput, fakeInput } — за опресняване при смяна на език

  function ensurePanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.className = 'dnp-panel';
    panelEl.innerHTML = `
      <div class="dnp-header">
        <div class="dnp-nav-group">
          <button type="button" class="dnp-nav-btn" data-act="prev-year" title="${t('datepicker.prev_year', 'Предишна година')}">«</button>
          <button type="button" class="dnp-nav-btn" data-act="prev-month" title="${t('datepicker.prev_month', 'Предишен месец')}">‹</button>
        </div>
        <span class="dnp-title"></span>
        <div class="dnp-nav-group">
          <button type="button" class="dnp-nav-btn" data-act="next-month" title="${t('datepicker.next_month', 'Следващ месец')}">›</button>
          <button type="button" class="dnp-nav-btn" data-act="next-year" title="${t('datepicker.next_year', 'Следваща година')}">»</button>
        </div>
      </div>
      <div class="dnp-weekdays">${weekdays().map(w => `<span>${w}</span>`).join('')}</div>
      <div class="dnp-days"></div>
      <div class="dnp-footer">
        <button type="button" class="dnp-clear-btn" data-act="clear">${t('datepicker.clear', 'Изчистване')}</button>
        <button type="button" class="dnp-today-btn" data-act="today">${t('datepicker.today', 'Днес')}</button>
      </div>
    `;
    document.body.appendChild(panelEl);

    panelEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn || !activeCtx) return;
      e.stopPropagation();
      const act = btn.dataset.act;
      if (act === 'prev-month') { shiftMonth(-1); }
      else if (act === 'next-month') { shiftMonth(1); }
      else if (act === 'prev-year') { shiftYear(-1); }
      else if (act === 'next-year') { shiftYear(1); }
      else if (act === 'clear') { commitValue(''); closePanel(); }
      else if (act === 'today') {
        const t = new Date();
        activeCtx.viewYear = t.getFullYear();
        activeCtx.viewMonth = t.getMonth();
        commitValue(toISO(t.getFullYear(), t.getMonth(), t.getDate()));
        renderDays();
      }
    });

    document.addEventListener('click', (e) => {
      if (!activeCtx) return;
      // Забележка: проверяваме дали кликът е някъде в целия "wrap"
      // (фалшивото поле + иконата с календарче), а не само точно
      // fakeInput. Иначе клик върху иконата (която също отваря панела
      // чрез своя собствен click listener по-рано в същото събитие)
      // веднага биваше третиран като "клик извън" и затваряше панела,
      // който тъкмо се отвори — потребителят никога не успяваше да
      // отвори picker-а чрез иконата, само чрез самото поле.
      const wrap = activeCtx.fakeInput.closest('.dnp-input-wrap');
      if (panelEl.contains(e.target) || (wrap && wrap.contains(e.target))) return;
      closePanel();
    });

    window.addEventListener('keydown', (e) => {
      if (activeCtx && e.key === 'Escape') closePanel();
    });

    window.addEventListener('resize', () => { if (activeCtx) positionPanel(); });
    window.addEventListener('scroll', () => { if (activeCtx) positionPanel(); }, true);

    return panelEl;
  }

  function shiftMonth(delta) {
    let { viewYear, viewMonth } = activeCtx;
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    else if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    activeCtx.viewYear = viewYear;
    activeCtx.viewMonth = viewMonth;
    renderDays();
  }

  function shiftYear(delta) {
    activeCtx.viewYear += delta;
    renderDays();
  }

  function getMinMax(input) {
    const min = parseISO(input.getAttribute('min'));
    const max = parseISO(input.getAttribute('max'));
    return { min, max };
  }

  function cmp(a, b) {
    if (a.y !== b.y) return a.y - b.y;
    if (a.m !== b.m) return a.m - b.m;
    return a.d - b.d;
  }

  function renderDays() {
    const { realInput, viewYear, viewMonth } = activeCtx;
    const titleEl = panelEl.querySelector('.dnp-title');
    titleEl.textContent = getLang() === 'bg'
      ? `${months()[viewMonth]} ${viewYear} г.`
      : `${months()[viewMonth]} ${viewYear}`;

    const daysEl = panelEl.querySelector('.dnp-days');
    daysEl.innerHTML = '';

    const selected = parseISO(realInput.value);
    const today = new Date();
    const todayP = { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
    const { min, max } = getMinMax(realInput);

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    // JS getDay(): 0=Sunday..6=Saturday → преобразуваме към понеделник-старт (0=пн)
    const jsWeekday = firstOfMonth.getDay();
    const leading = (jsWeekday + 6) % 7;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    for (let i = leading - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      let y = viewYear, m = viewMonth - 1;
      if (m < 0) { m = 11; y--; }
      cells.push({ y, m, d, muted: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ y: viewYear, m: viewMonth, d, muted: false });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const last = cells[cells.length - 1];
      let y = last.y, m = last.m, d = last.d + 1;
      const dim = new Date(y, m + 1, 0).getDate();
      if (d > dim) { d = 1; m++; if (m > 11) { m = 0; y++; } }
      cells.push({ y, m, d, muted: true });
      if (cells.length >= 42) break;
    }

    cells.forEach(cell => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dnp-day';
      if (cell.muted) btn.classList.add('dnp-day-muted');
      if (sameDay(cell, todayP)) btn.classList.add('dnp-day-today');
      if (selected && sameDay(cell, selected)) btn.classList.add('dnp-day-selected');
      btn.textContent = cell.d;

      if ((min && cmp(cell, min) < 0) || (max && cmp(cell, max) > 0)) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          if (cell.muted) {
            activeCtx.viewYear = cell.y;
            activeCtx.viewMonth = cell.m;
          }
          commitValue(toISO(cell.y, cell.m, cell.d));
          closePanel();
        });
      }
      daysEl.appendChild(btn);
    });
  }

  function commitValue(isoValue) {
    const { realInput, fakeInput } = activeCtx;
    realInput.__dnpSetValue(isoValue);
    fakeInput.value = isoValue ? formatDisplay(isoValue) : '';
    realInput.dispatchEvent(new Event('input', { bubbles: true }));
    realInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function positionPanel() {
    const { fakeInput } = activeCtx;
    const rect = fakeInput.getBoundingClientRect();
    const panelHeight = panelEl.offsetHeight || 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < panelHeight + 12 && rect.top > panelHeight + 12;

    let left = rect.left;
    const panelWidth = panelEl.offsetWidth || 300;
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8);
    }

    panelEl.style.left = `${left}px`;
    if (openUp) {
      panelEl.style.top = `${rect.top - panelHeight - 8}px`;
    } else {
      panelEl.style.top = `${rect.bottom + 8}px`;
    }
  }

  function openPanel(fakeInput, realInput) {
    ensurePanel();
    if (activeCtx && activeCtx.fakeInput === fakeInput) return;
    const wrap = fakeInput.closest('.dnp-input-wrap');
    if (activeCtx) closePanel();

    const existing = parseISO(realInput.value);
    const now = new Date();
    activeCtx = {
      fakeInput,
      realInput,
      viewYear: existing ? existing.y : now.getFullYear(),
      viewMonth: existing ? existing.m : now.getMonth()
    };
    if (wrap) wrap.classList.add('dnp-open');
    renderDays();
    panelEl.classList.add('dnp-visible');
    positionPanel();
  }

  function closePanel() {
    if (!activeCtx) return;
    const wrap = activeCtx.fakeInput.closest('.dnp-input-wrap');
    if (wrap) wrap.classList.remove('dnp-open');
    if (panelEl) panelEl.classList.remove('dnp-visible');
    activeCtx = null;
  }

  /* ===== Свързване на всеки реален input[type="date"] с фалшив, стилизиран инпут ===== */
  function enhance(realInput) {
    if (realInput.__dnpEnhanced) return;
    realInput.__dnpEnhanced = true;

    // Пазим оригиналните value/valueAsDate setter-и, за да прихващаме
    // програмни промени (напр. .valueAsDate = new Date()) от съществуващия код.
    const proto = HTMLInputElement.prototype;
    const valueDesc = Object.getOwnPropertyDescriptor(proto, 'value');
    const vadDesc = Object.getOwnPropertyDescriptor(proto, 'valueAsDate');

    realInput.__dnpSetValue = (v) => valueDesc.set.call(realInput, v);

    Object.defineProperty(realInput, 'value', {
      configurable: true,
      get() { return valueDesc.get.call(realInput); },
      set(v) {
        valueDesc.set.call(realInput, v);
        syncFakeFromReal();
      }
    });

    Object.defineProperty(realInput, 'valueAsDate', {
      configurable: true,
      get() { return vadDesc.get.call(realInput); },
      set(v) {
        vadDesc.set.call(realInput, v);
        syncFakeFromReal();
      }
    });

    // Скриваме реалния input, но го оставяме функционален в DOM-а.
    realInput.style.position = 'absolute';
    realInput.style.width = '1px';
    realInput.style.height = '1px';
    realInput.style.opacity = '0';
    realInput.style.pointerEvents = 'none';
    realInput.style.margin = '0';
    realInput.tabIndex = -1;
    realInput.setAttribute('aria-hidden', 'true');

    const wrap = document.createElement('div');
    wrap.className = 'dnp-input-wrap';

    const fakeInput = document.createElement('input');
    fakeInput.type = 'text';
    fakeInput.className = 'dnp-fake';
    fakeInput.readOnly = true;
    fakeInput.placeholder = t('datepicker.placeholder', 'ДД.ММ.ГГГГ г.');
    fakeInput.autocomplete = 'off';
    if (realInput.id) fakeInput.dataset.for = realInput.id;

    const icon = document.createElement('span');
    icon.className = 'dnp-icon';
    icon.innerHTML = CAL_ICON;

    realInput.insertAdjacentElement('afterend', wrap);
    wrap.appendChild(realInput);
    wrap.appendChild(fakeInput);
    wrap.appendChild(icon);

    enhancedInputs.push({ realInput, fakeInput });

    function syncFakeFromReal() {
      fakeInput.value = realInput.value ? formatDisplay(realInput.value) : '';
    }
    syncFakeFromReal();

    function toggle() {
      if (activeCtx && activeCtx.fakeInput === fakeInput) { closePanel(); }
      else { openPanel(fakeInput, realInput); }
    }

    fakeInput.addEventListener('click', toggle);
    fakeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'Escape') closePanel();
    });
    icon.style.pointerEvents = 'auto';
    icon.style.cursor = 'pointer';
    icon.addEventListener('click', toggle);
  }

  function enhanceAll(root) {
    (root || document).querySelectorAll('input[type="date"]:not([data-dnp-skip])').forEach(enhance);
  }

  // При смяна на език: презареждаме статичния текст в панела (ако вече
  // съществува), плейсхолдърите на всички вече активирани полета, и
  // форматирания текст на вече избраните дати (напр. 09.07.2026 г. → 09/07/2026).
  function refreshLanguage() {
    if (panelEl) {
      panelEl.querySelector('[data-act="prev-year"]').title = t('datepicker.prev_year', 'Предишна година');
      panelEl.querySelector('[data-act="prev-month"]').title = t('datepicker.prev_month', 'Предишен месец');
      panelEl.querySelector('[data-act="next-month"]').title = t('datepicker.next_month', 'Следващ месец');
      panelEl.querySelector('[data-act="next-year"]').title = t('datepicker.next_year', 'Следваща година');
      panelEl.querySelector('.dnp-clear-btn').textContent = t('datepicker.clear', 'Изчистване');
      panelEl.querySelector('.dnp-today-btn').textContent = t('datepicker.today', 'Днес');
      const weekdayEls = panelEl.querySelectorAll('.dnp-weekdays span');
      weekdays().forEach((w, i) => { if (weekdayEls[i]) weekdayEls[i].textContent = w; });
      if (activeCtx) renderDays();
    }
    enhancedInputs.forEach(({ realInput, fakeInput }) => {
      fakeInput.placeholder = t('datepicker.placeholder', 'ДД.ММ.ГГГГ г.');
      fakeInput.value = realInput.value ? formatDisplay(realInput.value) : '';
    });
  }

  function init() {
    enhanceAll(document);
    // Наблюдаваме за динамично добавени input[type="date"] (модали, форми и т.н.)
    const observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        mut.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('input[type="date"]')) enhance(node);
          if (node.querySelectorAll) enhanceAll(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ВАЖНО: datepicker.js се зарежда ПРЕДИ i18n.js в <head> на повечето
  // страници. Ако регистрираме onChange веднага (синхронно, докато този
  // defer скрипт се изпълнява), window.BudgetNestI18n още няма да съществува,
  // защото defer скриптовете се изпълняват последователно в реда си в
  // документа. Затова закачаме регистрацията за DOMContentLoaded — това
  // събитие пука едва СЛЕД като абсолютно всички defer скриптове (вкл.
  // i18n.js, независимо от реда му) вече са приключили изпълнението си.
  document.addEventListener('DOMContentLoaded', () => {
    if (window.BudgetNestI18n) window.BudgetNestI18n.onChange(refreshLanguage);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
