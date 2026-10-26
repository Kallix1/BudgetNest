/* ==========================================================================
   BudgetNest — boot guard / fail-safe
   --------------------------------------------------------------------------
   Loaded before the Supabase bundle on every app page. It makes sure the user
   never ends up staring at an empty main area: if the Supabase library fails
   to load, init stalls, or an app-level call throws before the page is shown,
   a friendly recovery panel appears with a reload button and error details.

   Usage from page scripts:
     window.BudgetNestBoot.fail(error)   // report a fatal init error
     window.BudgetNestBoot.addError(err) // record without showing the panel
     window.BudgetNestBoot.markReady()   // hide the loading indicator
   ========================================================================== */
(function () {
  'use strict';

  if (window.top !== window.self) return; // don't run inside preview iframes

  var boot = (window.BudgetNestBoot = window.BudgetNestBoot || {});
  var errors = [];
  var started = false;
  var failed = false;
  var ready = false;
  var poller = null;
  var watchdog = null;
  var stylesAdded = false;

  var STRINGS = {
    bg: {
      loading: 'Зареждане…',
      title: 'Страницата не успя да се зареди',
      body: 'Връзката със сървъра се забави или част от приложението не се зареди. Данните ти са запазени — опитай отново.',
      reload: 'Презареди',
      details: 'Технически подробности',
      hideDetails: 'Скрий подробностите',
      hint: 'Ако проблемът остане, затвори другите раздели на BudgetNest и опитай пак.',
      signout: 'Изход и нов вход',
      signoutConfirm: 'Ще те изведем от профила и ще отворим страницата за вход. Сигурен ли си?',
      libFailed: 'Библиотеката за връзка със сървъра не се зареди.',
      timeout: 'Зареждането не приключи навреме.'
    },
    en: {
      loading: 'Loading…',
      title: "This page couldn't load",
      body: 'The connection to the server was slow or part of the app failed to load. Your data is safe — please try again.',
      reload: 'Reload',
      details: 'Technical details',
      hideDetails: 'Hide details',
      hint: 'If this keeps happening, close the other BudgetNest tabs and try again.',
      signout: 'Sign out & sign in',
      signoutConfirm: 'This will sign you out and open the login page. Continue?',
      libFailed: 'The database library failed to load.',
      timeout: 'Loading did not finish in time.'
    }
  };

  function strings() {
    var lang = '';
    try { lang = localStorage.getItem('budgetnest-lang') || ''; } catch (e) {}
    if (lang !== 'bg' && lang !== 'en') {
      var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      if (htmlLang.indexOf('en') === 0) lang = 'en';
      else if (htmlLang.indexOf('bg') === 0) lang = 'bg';
      else lang = ((navigator.language || '').toLowerCase().indexOf('en') === 0) ? 'en' : 'bg';
    }
    return STRINGS[lang] || STRINGS.bg;
  }

  function mainEl() {
    return document.getElementById('dashboard-main') || document.getElementById('page-main');
  }

  function isShown(el) {
    if (!el) return false;
    var inline = el.style && el.style.display;
    if (inline === 'none') return false;
    var cs = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (!cs) return true;
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  // The page counts as ready once the main area or one of the app overlays
  // (onboarding, pending invite, …) is visible.
  function appReady() {
    var main = mainEl();
    if (main && isShown(main)) return true;
    var overlays = document.querySelectorAll('.overlay');
    for (var i = 0; i < overlays.length; i++) {
      if (isShown(overlays[i])) return true;
    }
    return false;
  }

  function expectsSupabase() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      if ((scripts[i].src || '').indexOf('supabase-js') !== -1) return true;
    }
    return false;
  }

  function record(err, source) {
    if (!err) return;
    var entry = {
      time: new Date().toISOString(),
      source: source || 'app',
      message: err && err.message ? String(err.message) : String(err)
    };
    if (err && err.stack) entry.stack = String(err.stack).split('\n').slice(0, 6).join('\n');
    errors.push(entry);
    if (window.console && console.error) {
      try { console.error('[BudgetNest boot]', source || 'app', err); } catch (e) {}
    }
  }

  function ensureStyles() {
    if (stylesAdded) return;
    stylesAdded = true;
    var style = document.createElement('style');
    style.id = 'bn-boot-styles';
    style.textContent = [
      '#bn-boot-loading{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483000;',
      'display:flex;align-items:center;gap:12px;padding:14px 22px;border-radius:999px;',
      'background:rgba(16,18,22,.88);border:1px solid rgba(212,175,55,.45);color:#f3efe4;',
      "font:600 14px/1.2 'Onest',system-ui,-apple-system,'Segoe UI',sans-serif;",
      'box-shadow:0 18px 40px rgba(0,0,0,.45);backdrop-filter:blur(8px);pointer-events:none}',
      '.bn-boot-spinner{width:18px;height:18px;border-radius:50%;flex:0 0 auto;',
      'border:2px solid rgba(212,175,55,.28);border-top-color:#d4af37;animation:bn-boot-spin .8s linear infinite}',
      '@keyframes bn-boot-spin{to{transform:rotate(360deg)}}',
      '#bn-boot-error{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;',
      'padding:24px;background:rgba(8,10,14,.82);backdrop-filter:blur(6px);',
      "font-family:'Onest',system-ui,-apple-system,'Segoe UI',sans-serif}",
      '.bn-boot-card{width:min(520px,100%);max-height:86vh;overflow:auto;box-sizing:border-box;',
      'padding:32px 30px;border-radius:22px;background:linear-gradient(160deg,#181b21,#111318 70%);',
      'border:1px solid rgba(212,175,55,.35);box-shadow:0 30px 80px rgba(0,0,0,.6);color:#f3efe4}',
      '.bn-boot-badge{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
      'margin-bottom:18px;background:rgba(212,175,55,.14);border:1px solid rgba(212,175,55,.5);',
      'color:#d4af37;font-size:24px;font-weight:700}',
      '.bn-boot-card h1{margin:0 0 10px;font-size:22px;line-height:1.25;font-weight:700;color:#fff}',
      '.bn-boot-card p{margin:0 0 18px;font-size:14.5px;line-height:1.55;color:#c9c6bd}',
      '.bn-boot-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px}',
      '.bn-boot-primary{appearance:none;border:0;border-radius:999px;padding:12px 24px;cursor:pointer;',
      'background:#d4af37;color:#15130c;font:700 14px/1 inherit;transition:filter .15s ease}',
      '.bn-boot-primary:hover{filter:brightness(1.08)}',
      '.bn-boot-secondary{appearance:none;border:1px solid rgba(243,239,228,.22);border-radius:999px;',
      'padding:11px 18px;cursor:pointer;background:transparent;color:#e7e3d8;font:600 13px/1 inherit}',
      '.bn-boot-secondary:hover{border-color:rgba(212,175,55,.55)}',
      '.bn-boot-hint{margin:0!important;font-size:12.5px!important;color:#8f8c84!important}',
      '.bn-boot-details{margin:16px 0 0;padding:14px;border-radius:12px;background:rgba(0,0,0,.35);',
      'border:1px solid rgba(255,255,255,.08);color:#a8a49a;white-space:pre-wrap;word-break:break-word;',
      'font:400 11.5px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;max-height:220px;overflow:auto}',
      '@media (max-width:520px){.bn-boot-card{padding:26px 20px}.bn-boot-card h1{font-size:19px}}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function showLoading() {
    if (failed || ready || !document.body || document.getElementById('bn-boot-loading')) return;
    ensureStyles();
    var el = document.createElement('div');
    el.id = 'bn-boot-loading';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    var spin = document.createElement('span');
    spin.className = 'bn-boot-spinner';
    var label = document.createElement('span');
    label.textContent = strings().loading;
    el.appendChild(spin);
    el.appendChild(label);
    document.body.appendChild(el);
  }

  function hideLoading() {
    var el = document.getElementById('bn-boot-loading');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function stopTimers() {
    if (poller) { clearInterval(poller); poller = null; }
    if (watchdog) { clearTimeout(watchdog); watchdog = null; }
  }

  function detailsText() {
    var lines = errors.map(function (e) {
      return '[' + e.time + '] ' + e.source + ': ' + e.message + (e.stack ? '\n' + e.stack : '');
    });
    lines.push('');
    lines.push('URL: ' + window.location.href);
    lines.push('UA: ' + navigator.userAgent);
    return lines.join('\n');
  }

  function clearSupabaseSession() {
    try {
      var keep = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && /^sb-.*-auth-token/.test(key)) keep.push(key);
      }
      keep.forEach(function (key) { localStorage.removeItem(key); });
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = 'login.html';
  }

  function showError(reason, opts) {
    opts = opts || {};
    if (reason) record(reason, opts.source || 'app');
    if (ready || (appReady() && !opts.force)) return;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function () {
        showError(null, opts);
      }, { once: true });
      return;
    }
    if (failed) return;

    failed = true;
    stopTimers();
    hideLoading();
    ensureStyles();

    var t = strings();
    var wrap = document.createElement('div');
    wrap.id = 'bn-boot-error';
    wrap.setAttribute('role', 'alertdialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'bn-boot-title');

    var card = document.createElement('div');
    card.className = 'bn-boot-card';

    var badge = document.createElement('div');
    badge.className = 'bn-boot-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = '!';

    var title = document.createElement('h1');
    title.id = 'bn-boot-title';
    title.textContent = t.title;

    var body = document.createElement('p');
    body.textContent = t.body;

    var actions = document.createElement('div');
    actions.className = 'bn-boot-actions';

    var reload = document.createElement('button');
    reload.type = 'button';
    reload.className = 'bn-boot-primary';
    reload.textContent = t.reload;
    reload.addEventListener('click', function () { window.location.reload(); });

    var detailsBtn = document.createElement('button');
    detailsBtn.type = 'button';
    detailsBtn.className = 'bn-boot-secondary';
    detailsBtn.textContent = t.details;

    var signout = document.createElement('button');
    signout.type = 'button';
    signout.className = 'bn-boot-secondary';
    signout.textContent = t.signout;
    signout.addEventListener('click', function () {
      if (window.confirm(t.signoutConfirm)) clearSupabaseSession();
    });

    var details = document.createElement('pre');
    details.className = 'bn-boot-details';
    details.hidden = true;
    details.textContent = detailsText();

    detailsBtn.addEventListener('click', function () {
      details.hidden = !details.hidden;
      detailsBtn.textContent = details.hidden ? t.details : t.hideDetails;
    });

    var hint = document.createElement('p');
    hint.className = 'bn-boot-hint';
    hint.textContent = t.hint;

    actions.appendChild(reload);
    actions.appendChild(detailsBtn);
    actions.appendChild(signout);
    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);
    card.appendChild(hint);
    card.appendChild(details);
    wrap.appendChild(card);
    document.body.appendChild(wrap);
  }

  function start() {
    if (started) return;
    started = true;

    if (!mainEl()) {
      // Login / reset / confirmation pages have no main area — only make sure
      // the database library itself loaded.
      if (expectsSupabase() && !window.supabase) {
        showError(new Error(strings().libFailed), { source: 'library' });
      }
      return;
    }

    if (appReady()) return;

    showLoading();

    poller = setInterval(function () {
      if (appReady()) boot.markReady();
    }, 400);

    watchdog = setTimeout(function () {
      if (!appReady()) {
        showError(new Error(strings().timeout), { source: 'timeout' });
      }
    }, 12000);

    if (expectsSupabase() && !window.supabase) {
      showError(new Error(strings().libFailed), { source: 'library' });
    }
  }

  boot.addError = function (err, source) { record(err, source); };

  boot.markReady = function () {
    ready = true;
    stopTimers();
    hideLoading();
  };

  boot.fail = function (err, source) {
    showError(err, { source: source || 'app' });
  };

  // Capture resource errors (a <script> that failed to load) and uncaught
  // exceptions. They are recorded for the details panel; the watchdog decides
  // whether the page is actually stuck.
  window.addEventListener('error', function (event) {
    var target = event && event.target;
    if (target && target.tagName === 'SCRIPT') {
      var src = target.src || 'unknown';
      if (src.indexOf('supabase-js') !== -1) {
        showError(new Error(strings().libFailed), { source: 'library' });
      } else {
        record(new Error('Failed to load script: ' + src), 'script');
      }
      return;
    }
    if (event && event.error) record(event.error, 'window');
    else if (event && event.message) record(new Error(event.message), 'window');
  }, true);

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event && event.reason;
    record(reason && reason.message ? reason : new Error(String(reason)), 'promise');
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
