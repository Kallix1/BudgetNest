/* ==========================================================================
   BudgetNest — shared auth helper
   --------------------------------------------------------------------------
   Supabase keeps the login session in localStorage, so opening the site
   normally restores it without asking for the password again. However,
   getSession() returns null when the saved access token has expired and the
   automatic refresh fails for a moment (slow phone network, tab waking up,
   two tabs refreshing at the same time, …). In those cases the old code sent
   the user straight to login.html even though their session was still there.

   This helper retries the restore a few times and keeps using the saved
   session if it shows up again. It also gives every page one shared client
   factory and a "redirect signed-in visitors" shortcut.

   Exposed API:
     window.BudgetNestAuth.client()
     window.BudgetNestAuth.resolveSession(client, options)
     window.BudgetNestAuth.redirectIfSignedIn(client, target, options)
     window.BudgetNestAuth.getStoredSession(client)
   ========================================================================== */
(function () {
  'use strict';

  if (window.BudgetNestAuth) return;

  var SUPABASE_URL = 'https://fvorpmajvrsxrwtscmwk.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_KmFRXFvW-wCf5LJXMgHejQ__3CH2PB7';
  var DEFAULT_STORAGE_KEY = 'sb-fvorpmajvrsxrwtscmwk-auth-token';

  var sharedClient = null;

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error('auth request timed out'));
      }, ms);
      Promise.resolve(promise).then(
        function (value) { clearTimeout(timer); resolve(value); },
        function (error) { clearTimeout(timer); reject(error); }
      );
    });
  }

  // One client per page keeps token refreshes coordinated and avoids two
  // Supabase instances fighting over the same localStorage entry.
  function client() {
    if (sharedClient) return sharedClient;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    sharedClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return sharedClient;
  }

  function storageArea(supabaseClient) {
    try {
      if (supabaseClient && supabaseClient.auth && supabaseClient.auth.storage) {
        return supabaseClient.auth.storage;
      }
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  function storageKey(supabaseClient) {
    try {
      if (supabaseClient && supabaseClient.auth && supabaseClient.auth.storageKey) {
        return supabaseClient.auth.storageKey;
      }
    } catch (e) {}
    return DEFAULT_STORAGE_KEY;
  }

  function parseStored(raw) {
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      if (data && data.access_token && data.refresh_token) return data;
    } catch (e) {}
    return null;
  }

  // Read the persisted session straight from storage. This lets us tell the
  // difference between "the user really signed out" and "getSession() failed
  // to refresh the token for a moment".
  function getStoredSession(supabaseClient) {
    var storage = storageArea(supabaseClient);
    if (!storage) return null;
    var key = storageKey(supabaseClient);

    try {
      var session = parseStored(storage.getItem(key));
      if (session) return session;

      // Some Supabase versions split large sessions into .0/.1/… chunks.
      var parts = [];
      for (var i = 0; i < 8; i++) {
        var part = storage.getItem(key + '.' + i);
        if (part == null) break;
        parts.push(part);
      }
      if (parts.length) return parseStored(parts.join(''));
    } catch (e) {}
    return null;
  }

  function hasSession(response) {
    return !!(response && response.data && response.data.session && response.data.session.access_token);
  }

  // Only network hiccups and server-side trouble are worth retrying. An
  // explicitly rejected refresh token means the session is gone for good.
  function isRetryable(error) {
    if (!error) return true;
    var status = Number(error.status || 0);
    if (status === 0 || status === 408 || status === 429 || status >= 500) return true;
    if (error.name === 'AuthRetryableFetchError' || error.name === 'AuthApiError' && status === 0) return true;
    var message = String(error.message || '');
    return /fetch|network|offline|timeout|timed out|load failed|connection/i.test(message);
  }

  /**
   * Resolve the current session, retrying transient failures.
   *
   * options.timeoutMs     — total time budget (default 15000)
   * options.callTimeoutMs — budget for a single Supabase call (default 8000)
   * options.attempts      — hard cap on attempts (default 6)
   *
   * Returns the session object, or null when the visitor is really signed out.
   */
  async function resolveSession(supabaseClient, options) {
    options = options || {};
    var authClient = supabaseClient || client();
    if (!authClient) return null;

    var totalBudget = typeof options.timeoutMs === 'number' ? options.timeoutMs : 15000;
    var callBudget = typeof options.callTimeoutMs === 'number' ? options.callTimeoutMs : 8000;
    var maxAttempts = typeof options.attempts === 'number' ? options.attempts : 6;
    var deadline = Date.now() + totalBudget;
    var delay = 250;
    var attempt = 0;

    // Fast path: no saved session at all means there is nothing to restore.
    if (!getStoredSession(authClient)) {
      // Still let Supabase parse a session from the URL (email confirmation,
      // password recovery) before concluding the visitor is signed out.
      try {
        var initial = await withTimeout(authClient.auth.getSession(), Math.min(callBudget, totalBudget));
        return hasSession(initial) ? initial.data.session : null;
      } catch (e) {
        return null;
      }
    }

    while (attempt < maxAttempts) {
      attempt++;

      var problem = null;
      try {
        var remaining = Math.max(1000, deadline - Date.now());
        var result = await withTimeout(authClient.auth.getSession(), Math.min(callBudget, remaining));
        if (hasSession(result)) return result.data.session;
        problem = result && result.error;
      } catch (error) {
        problem = error;
      }

      // Supabase removed the stored session (definitive sign-out / rejected
      // refresh token) — no point in retrying.
      if (!getStoredSession(authClient)) return null;
      if (problem && !isRetryable(problem)) return null;

      if (Date.now() + delay >= deadline || attempt >= maxAttempts) break;

      await sleep(delay);
      delay = Math.min(Math.round(delay * 1.8), 2500);

      // An explicit refresh often succeeds once the network settles.
      try {
        var refreshRemaining = Math.max(1000, deadline - Date.now());
        var refreshed = await withTimeout(
          authClient.auth.refreshSession(),
          Math.min(callBudget, refreshRemaining)
        );
        if (hasSession(refreshed)) return refreshed.data.session;
        problem = refreshed && refreshed.error;
      } catch (error) {
        problem = error;
      }

      if (!getStoredSession(authClient)) return null;
      if (problem && !isRetryable(problem)) return null;

      if (Date.now() >= deadline) break;
    }

    return null;
  }

  /**
   * If a session can be restored, go straight to the app instead of showing
   * the landing / login page. Returns true when the redirect was started.
   */
  async function redirectIfSignedIn(supabaseClient, target, options) {
    var session = await resolveSession(supabaseClient, options);
    if (!session) return false;
    var destination = target || 'dashboard.html';
    try {
      window.location.replace(destination);
    } catch (e) {
      window.location.href = destination;
    }
    return true;
  }

  window.BudgetNestAuth = {
    client: client,
    resolveSession: resolveSession,
    redirectIfSignedIn: redirectIfSignedIn,
    getStoredSession: getStoredSession
  };
})();
