/* ============================================
   BudgetNest — Custom emoji picker за икони на категории
   Прикача се към всеки input с атрибут data-emoji-picker.

   Не променя поведението на съществуващия код — полето
   си остава обикновен <input type="text">, .value/.oninput
   продължават да работят по същия начин. Просто ставa
   readonly и при клик отваря панел с емоджита вместо
   потребителят да пише/копира ръчно.
   ============================================ */

(function () {
  const GROUPS = [
    {
      label: 'Храна и пазар',
      emoji: ['🍎', '🍌', '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🍣', '🍜', '🍰', '🍩', '☕', '🍺', '🍷', '🥑', '🥦', '🍇', '🍫', '🛒', '🍞', '🥚']
    },
    {
      label: 'Дом',
      emoji: ['🏠', '🛋️', '💡', '🔧', '🧹', '🛏️', '🚿', '🪑', '🖼️', '🌱', '🧺', '🔥']
    },
    {
      label: 'Транспорт',
      emoji: ['🚗', '🚌', '🚕', '🚆', '🚲', '⛽', '🅿️', '✈️', '🛴', '🚦', '🛣️']
    },
    {
      label: 'Пазаруване',
      emoji: ['🛍️', '👗', '👟', '👜', '💄', '🎁', '💍', '👔', '🧢']
    },
    {
      label: 'Сметки и финанси',
      emoji: ['💰', '💳', '🏦', '📈', '📉', '🧾', '💵', '💶', '💸', '🪙']
    },
    {
      label: 'Забавление',
      emoji: ['🎮', '🎬', '🎵', '🎧', '🎉', '🎨', '📚', '🎯', '🕹️', '🎸']
    },
    {
      label: 'Здраве',
      emoji: ['💊', '🏥', '🩺', '🦷', '💉', '🧴', '🧘']
    },
    {
      label: 'Образование',
      emoji: ['📖', '✏️', '🎓', '🏫']
    },
    {
      label: 'Пътувания',
      emoji: ['🧳', '🏖️', '🗺️', '🏕️', '⛺']
    },
    {
      label: 'Любимци',
      emoji: ['🐶', '🐱', '🐹', '🐦', '🐟']
    },
    {
      label: 'Друго',
      emoji: ['📦', '❓', '⭐', '🔒', '🔑', '📌', '🗂️', '👶', '🎂', '💼']
    }
  ];

  // Прости ключови думи за търсене (на кирилица) → списък от емоджита
  const KEYWORDS = {
    'храна': ['🍎', '🍌', '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🍣', '🍜', '🍰', '🍩', '🍞', '🥚', '🛒'],
    'пазар': ['🛒', '🛍️', '🍎'],
    'кафе': ['☕'],
    'напитки': ['☕', '🍺', '🍷'],
    'алкохол': ['🍺', '🍷'],
    'дом': ['🏠', '🛋️', '💡', '🔧', '🧹', '🛏️', '🚿', '🪑'],
    'наем': ['🏠', '🔑'],
    'ток': ['💡'],
    'вода': ['🚿'],
    'транспорт': ['🚗', '🚌', '🚕', '🚆', '🚲', '⛽'],
    'кола': ['🚗', '⛽', '🅿️'],
    'гориво': ['⛽'],
    'самолет': ['✈️'],
    'дрехи': ['👗', '👟', '👜', '👔'],
    'обувки': ['👟'],
    'подарък': ['🎁'],
    'пари': ['💰', '💵', '💶', '💸', '🪙', '💳'],
    'банка': ['🏦', '💳'],
    'сметки': ['🧾', '💡'],
    'спестявания': ['💰', '📈'],
    'забавление': ['🎮', '🎬', '🎵', '🎉', '🎨'],
    'филм': ['🎬'],
    'музика': ['🎵', '🎧'],
    'игри': ['🎮', '🕹️'],
    'здраве': ['💊', '🏥', '🩺', '💉'],
    'лекар': ['🏥', '🩺'],
    'лекарства': ['💊'],
    'зъби': ['🦷'],
    'образование': ['📖', '✏️', '🎓', '🏫'],
    'училище': ['🏫', '✏️'],
    'книги': ['📖', '📚'],
    'пътуване': ['🧳', '🏖️', '🗺️', '✈️'],
    'ваканция': ['🏖️', '🧳'],
    'любимец': ['🐶', '🐱', '🐹', '🐦', '🐟'],
    'куче': ['🐶'],
    'котка': ['🐱'],
    'бебе': ['👶'],
    'работа': ['💼'],
    'спорт': ['🎯'],
    'растение': ['🌱']
  };

  function normalize(str) { return str.trim().toLowerCase(); }

  function searchEmoji(query) {
    const q = normalize(query);
    if (!q) return null;
    const matches = new Set();
    Object.keys(KEYWORDS).forEach((key) => {
      if (key.includes(q)) KEYWORDS[key].forEach((e) => matches.add(e));
    });
    return Array.from(matches);
  }

  let panelEl = null;
  let activeInput = null;

  function ensurePanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.className = 'emp-panel';
    panelEl.innerHTML = `
      <div class="emp-search-row">
        <input type="text" class="emp-search" placeholder="🔍 Търсене на икона…" autocomplete="off">
      </div>
      <div class="emp-scroll"></div>
    `;
    document.body.appendChild(panelEl);

    const searchInput = panelEl.querySelector('.emp-search');
    searchInput.addEventListener('input', () => renderGrid(searchInput.value));

    panelEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.emp-emoji-btn');
      if (!btn || !activeInput) return;
      e.stopPropagation();
      selectEmoji(btn.textContent);
    });

    document.addEventListener('click', (e) => {
      if (!activeInput) return;
      if (panelEl.contains(e.target) || e.target === activeInput) return;
      closePanel();
    });

    window.addEventListener('keydown', (e) => {
      if (activeInput && e.key === 'Escape') closePanel();
    });

    window.addEventListener('resize', () => { if (activeInput) positionPanel(); });
    window.addEventListener('scroll', () => { if (activeInput) positionPanel(); }, true);

    return panelEl;
  }

  function selectEmoji(emoji) {
    const input = activeInput;
    input.value = emoji;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    closePanel();
  }

  function renderGrid(query) {
    const scrollEl = panelEl.querySelector('.emp-scroll');
    scrollEl.innerHTML = '';
    const current = activeInput ? activeInput.value : '';

    const filtered = query ? searchEmoji(query) : null;

    function buildGrid(emojiList) {
      const grid = document.createElement('div');
      grid.className = 'emp-grid';
      emojiList.forEach((em) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emp-emoji-btn' + (em === current ? ' emp-selected' : '');
        btn.textContent = em;
        grid.appendChild(btn);
      });
      return grid;
    }

    if (filtered) {
      if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'emp-empty';
        empty.textContent = 'Няма намерени икони';
        scrollEl.appendChild(empty);
      } else {
        scrollEl.appendChild(buildGrid(filtered));
      }
      return;
    }

    GROUPS.forEach((group) => {
      const label = document.createElement('div');
      label.className = 'emp-group-label';
      label.textContent = group.label;
      scrollEl.appendChild(label);
      scrollEl.appendChild(buildGrid(group.emoji));
    });
  }

  function positionPanel() {
    const rect = activeInput.getBoundingClientRect();
    const panelHeight = panelEl.offsetHeight || 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < panelHeight + 12 && rect.top > panelHeight + 12;

    let left = rect.left;
    const panelWidth = panelEl.offsetWidth || 300;
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8);
    }

    panelEl.style.left = `${left}px`;
    panelEl.style.top = openUp ? `${rect.top - panelHeight - 8}px` : `${rect.bottom + 8}px`;
  }

  function openPanel(input) {
    ensurePanel();
    if (activeInput === input) return;
    if (activeInput) closePanel();
    activeInput = input;
    const wrap = input.closest('.emp-input-wrap');
    if (wrap) wrap.classList.add('emp-open');

    const searchInput = panelEl.querySelector('.emp-search');
    searchInput.value = '';
    renderGrid('');

    panelEl.classList.add('emp-visible');
    positionPanel();
  }

  function closePanel() {
    if (!activeInput) return;
    const wrap = activeInput.closest('.emp-input-wrap');
    if (wrap) wrap.classList.remove('emp-open');
    if (panelEl) panelEl.classList.remove('emp-visible');
    activeInput = null;
  }

  function enhance(input) {
    if (input.__empEnhanced) return;
    input.__empEnhanced = true;

    input.readOnly = true;
    input.classList.add('emp-trigger');
    input.autocomplete = 'off';

    const wrap = document.createElement('div');
    wrap.className = 'emp-input-wrap';
    input.insertAdjacentElement('afterend', wrap);
    wrap.appendChild(input);

    function toggle() {
      if (activeInput === input) closePanel();
      else openPanel(input);
    }

    input.addEventListener('click', toggle);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'Escape') closePanel();
    });
  }

  function enhanceAll(root) {
    (root || document).querySelectorAll('input[data-emoji-picker]').forEach(enhance);
  }

  function init() {
    enhanceAll(document);
    const observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        mut.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('input[data-emoji-picker]')) enhance(node);
          if (node.querySelectorAll) enhanceAll(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
