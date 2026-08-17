/*
 * Central config for the GTM sandbox.
 *
 * Supports switching between two sGTM backends at runtime:
 *   - stape:    Stape-hosted (data.ajasmbat.store) with Custom Loader
 *   - selfhost: Self-hosted on Fly.io (betterdata.ajasmbat.store), gtm.js from Google direct
 *
 * How to switch: click the floating "sGTM Backend" panel bottom-left, OR use ?sgtm=selfhost
 * URL param. Choice is remembered in localStorage per browser.
 */
(function () {
  var GTM_ID = 'GTM-TK3PJBX5';
  window.__GTM_ID = GTM_ID;

  // ---- Backend definitions ----
  var BACKENDS = {
    stape: {
      label: 'Stape',
      short: 'stape',
      color: '#ff5c1a',
      // Stape Custom Loader (obfuscated, ad-blocker safe)
      loaderUrl: 'https://data.ajasmbat.store/6kzckhyiky.js',
      loaderQuery: 'q=EA9UPjwmTi4yWDkzKjNWXA9WW1dZTQcURAoDGBsGARsNRRoNBxkG',
      // Where GTM sends events (used by Google Tag's server_container_url via GTM variable)
      serverContainerUrl: 'https://data.ajasmbat.store',
      // noscript fallback
      nsHost: 'https://data.ajasmbat.store'
    },
    selfhost: {
      label: 'Self-hosted (Fly)',
      short: 'selfhost',
      color: '#7b3aed',
      // Phase 1: load gtm.js from our first-party domain via sGTM's Web Container Client
      // (defeats hostname-level ad-blocker rules; path is still /gtm.js so strict path
      // matchers can still catch it — that's Phase 2 territory)
      loaderUrl: 'https://betterdata.ajasmbat.store/gtm.js',
      loaderQuery: 'id=' + GTM_ID,
      // Where GTM sends events
      serverContainerUrl: 'https://betterdata.ajasmbat.store',
      nsHost: 'https://betterdata.ajasmbat.store'
    }
  };

  // ---- Resolve active backend ----
  var STORAGE_KEY = 'sgtm_backend';
  var DEFAULT = 'stape';

  function readBackend() {
    // 1. URL param wins (and gets persisted)
    try {
      var params = new URLSearchParams(window.location.search);
      var q = params.get('sgtm');
      if (q === 'clear') {
        window.localStorage.removeItem(STORAGE_KEY);
      } else if (q && BACKENDS[q]) {
        window.localStorage.setItem(STORAGE_KEY, q);
        return q;
      }
    } catch (e) { /* ignore */ }
    // 2. localStorage
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && BACKENDS[saved]) return saved;
    } catch (e) { /* ignore */ }
    // 3. default
    return DEFAULT;
  }

  var activeKey = readBackend();
  var active = BACKENDS[activeKey];

  // Expose so Web GTM can pick it up via a JS Variable
  window.SGTM_BACKEND = activeKey;
  window.SGTM_BACKEND_URL = active.serverContainerUrl;

  // ---- dataLayer bootstrap + inspector hook (unchanged) ----
  window.dataLayer = window.dataLayer || [];
  window.__dlLog = window.__dlLog || [];

  var nativePush = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function () {
    for (var i = 0; i < arguments.length; i++) {
      var entry = { time: new Date().toISOString(), data: arguments[i] };
      window.__dlLog.push(entry);
      try {
        window.dispatchEvent(new CustomEvent('dl:push', { detail: entry }));
      } catch (e) { /* older browsers — ignore */ }
    }
    return nativePush.apply(window.dataLayer, arguments);
  };

  window.dataLayer.push({
    event: 'user_data',
    user_data: {
      logged_in: false,
      user_id: 'anon-' + Math.random().toString(36).slice(2, 10)
    }
  });

  // ---- GTM loader (uses active backend) ----
  (function (w, d, s, l, url, q) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s);
    j.async = true;
    j.src = url + '?' + q;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', active.loaderUrl, active.loaderQuery);

  // ---- noscript fallback ----
  function injectNoscript() {
    if (document.getElementById('__gtm-noscript')) return;
    var ns = document.createElement('noscript');
    ns.id = '__gtm-noscript';
    ns.innerHTML =
      '<iframe src="' + active.nsHost + '/ns.html?id=' + GTM_ID +
      '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
    document.body.insertBefore(ns, document.body.firstChild);
  }

  // ---- Switcher widget ----
  function injectSwitcher() {
    if (document.getElementById('__sgtm-switcher')) return;
    var wrap = document.createElement('div');
    wrap.id = '__sgtm-switcher';
    wrap.style.cssText =
      'position:fixed;bottom:12px;left:12px;z-index:2147483646;' +
      'font:12px/1.3 -apple-system,Segoe UI,sans-serif;' +
      'background:#111;color:#fff;border:1px solid ' + active.color + ';' +
      'border-left:4px solid ' + active.color + ';' +
      'padding:8px 10px;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.3);' +
      'min-width:200px;max-width:280px;';
    wrap.innerHTML =
      '<div style="opacity:.6;margin-bottom:4px;font-size:10px;letter-spacing:.5px;text-transform:uppercase;">sGTM backend</div>' +
      '<div style="font-weight:600;color:' + active.color + ';margin-bottom:2px;">' + active.label + '</div>' +
      '<div style="font-size:10px;opacity:.6;margin-bottom:8px;word-break:break-all;">' + active.serverContainerUrl.replace('https://','') + '</div>' +
      '<div id="__sgtm-buttons"></div>';

    document.body.appendChild(wrap);

    var buttonsEl = document.getElementById('__sgtm-buttons');
    Object.keys(BACKENDS).forEach(function (key) {
      var b = BACKENDS[key];
      var btn = document.createElement('button');
      btn.textContent = key === activeKey ? '✓ ' + b.label : 'Use ' + b.label;
      btn.disabled = key === activeKey;
      btn.style.cssText =
        'display:block;width:100%;margin-bottom:4px;padding:5px 8px;' +
        'font:11px -apple-system,Segoe UI,sans-serif;cursor:pointer;' +
        'border:1px solid ' + b.color + ';border-radius:4px;' +
        (key === activeKey
          ? 'background:' + b.color + ';color:#fff;opacity:.55;cursor:default;'
          : 'background:transparent;color:' + b.color + ';');
      btn.onclick = function () {
        try { window.localStorage.setItem(STORAGE_KEY, key); } catch (e) {}
        // Strip any ?sgtm= param and reload
        var url = new URL(window.location.href);
        url.searchParams.delete('sgtm');
        window.location.href = url.toString();
      };
      buttonsEl.appendChild(btn);
    });
  }

  function onReady() {
    injectNoscript();
    injectSwitcher();
  }
  if (document.body) onReady();
  else document.addEventListener('DOMContentLoaded', onReady);
})();
