/*
 * dataLayer kill-switch.
 *
 * Must load before config.js and the tracking snippet on every page. When
 * switched off (localStorage, or ?datalayer=off in the URL) it replaces
 * window.dataLayer with a locked stand-in whose push is a no-op, so later
 * scripts (config.js, the Cloak bundle, gtm.js) can neither restore the real
 * array nor push into it. Toggling reloads the page — an already-booted GTM
 * can't be deactivated in place.
 */
(function () {
  var KEY = 'gtm_sandbox_dl_disabled';

  // ?datalayer=off / ?datalayer=on overrides and persists the choice
  try {
    var m = location.search.match(/[?&]datalayer=(on|off)(&|$)/);
    if (m) localStorage.setItem(KEY, m[1] === 'off' ? '1' : '0');
  } catch (e) { /* private mode — fall through to default ON */ }

  var disabled = false;
  try { disabled = localStorage.getItem(KEY) === '1'; } catch (e) {}

  if (disabled) {
    var dead = [];
    var noop = function () { return 0; };
    // Accessor pairs (not writable:false) so strict-mode assigners like
    // gtm.js fail silently instead of throwing.
    Object.defineProperty(dead, 'push', {
      get: function () { return noop; },
      set: function () {},
      configurable: false
    });
    Object.defineProperty(window, 'dataLayer', {
      get: function () { return dead; },
      set: function () {},
      configurable: false
    });
  }

  function addWidget() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'dl-toggle';
    btn.textContent = disabled ? '● dataLayer: OFF' : '● dataLayer: ON';
    btn.title = disabled
      ? 'dataLayer is deactivated — no events reach GTM. Click to re-enable (reloads page).'
      : 'dataLayer is active. Click to fully deactivate it (reloads page).';
    btn.style.cssText =
      'position:fixed;bottom:16px;left:16px;z-index:99999;' +
      'padding:8px 14px;border:none;border-radius:999px;cursor:pointer;' +
      'font:600 12px/1 -apple-system,system-ui,sans-serif;color:#fff;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.35);' +
      'background:' + (disabled ? '#b3261e' : '#1e8e3e') + ';';
    btn.addEventListener('click', function () {
      try { localStorage.setItem(KEY, disabled ? '0' : '1'); } catch (e) {}
      location.reload();
    });
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addWidget);
  } else {
    addWidget();
  }
})();
