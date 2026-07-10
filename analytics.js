/* ============================================================================
   BudgetNest — лек, анонимен тракер за уникални посетители.

   Умишлено НЕ ползва supabase-js библиотеката (за да работи независимо от
   реда, в който се зареждат другите <script> тагове на страницата) — вместо
   това праща директна REST заявка към Supabase с fetch().

   Пази анонимен идентификатор в localStorage (не е обвързан с акаунт) и
   записва най-много ЕДНО посещение на посетител на ДЕН — не при всяко
   презареждане/навигиране между страници — за да не се раздува таблицата.
   ============================================================================ */

(function () {
  const SUPABASE_URL = 'https://fvorpmajvrsxrwtscmwk.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_KmFRXFvW-wCf5LJXMgHejQ__3CH2PB7';
  const VISITOR_KEY = 'budgetnest-visitor-id';
  const LAST_PING_KEY = 'budgetnest-last-ping';

  function getVisitorId() {
    try {
      let id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : 'v-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch (e) {
      return null; // localStorage недостъпен (напр. частен режим с блокирани бисквитки)
    }
  }

  function alreadyPingedToday() {
    try {
      const last = localStorage.getItem(LAST_PING_KEY);
      const today = new Date().toDateString();
      return last === today;
    } catch (e) {
      return false;
    }
  }

  function markPingedToday() {
    try { localStorage.setItem(LAST_PING_KEY, new Date().toDateString()); } catch (e) { /* noop */ }
  }

  function track() {
    const visitorId = getVisitorId();
    if (!visitorId || alreadyPingedToday()) return;

    fetch(`${SUPABASE_URL}/rest/v1/page_views`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ visitor_id: visitorId, page: location.pathname.replace(/^\//, '') || 'index.html' }),
    }).then((res) => {
      if (res.ok) markPingedToday();
    }).catch(() => { /* тихо игнорираме мрежови грешки — не е критична функционалност */ });
  }

  track();
})();
