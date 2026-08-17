/*
 * Central config for the GTM sandbox.
 * Swap GTM_ID here to load a real container across every page.
 * Runs after the inline `window.dataLayer = window.dataLayer || []` bootstrap.
 */
(function () {
  var GTM_ID = 'GTM-TK3PJBX5';
  window.__GTM_ID = GTM_ID;

  window.dataLayer = window.dataLayer || [];
  window.__dlLog = window.__dlLog || [];

  // Wrap dataLayer.push so the inspector can capture events that fire
  // BEFORE the inspector's own script has run.
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

  // Fake user identity — pushed on every page load.
  window.dataLayer.push({
    event: 'user_data',
    user_data: {
      logged_in: false,
      user_id: 'anon-' + Math.random().toString(36).slice(2, 10)
    }
  });

  // Standard GTM snippet — injected once, ID sourced from GTM_ID above.
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l !== 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', GTM_ID);

  // Inject the <noscript> iframe fallback into <body> once it exists.
  function injectNoscript() {
    if (document.getElementById('__gtm-noscript')) return;
    var ns = document.createElement('noscript');
    ns.id = '__gtm-noscript';
    ns.innerHTML =
      '<iframe src="https://www.googletagmanager.com/ns.html?id=' + GTM_ID +
      '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
    document.body.insertBefore(ns, document.body.firstChild);
  }
  if (document.body) injectNoscript();
  else document.addEventListener('DOMContentLoaded', injectNoscript);
})();
