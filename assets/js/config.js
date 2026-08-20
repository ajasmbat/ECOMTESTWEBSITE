/*
 * Central config for the GTM sandbox.
 *
 * Tagging server: https://data.ajasmbat.store
 * Web container:  GTM-T2F5VZTK
 *
 * The GTM snippet itself lives inline in each page's <head> (see any .html file).
 * This file only sets up the dataLayer instrumentation the on-page inspector
 * reads, so it must load BEFORE the GTM snippet.
 */
(function () {
  window.__GTM_ID = 'GTM-T2F5VZTK';

  // ---- dataLayer bootstrap + inspector hook ----
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
})();
