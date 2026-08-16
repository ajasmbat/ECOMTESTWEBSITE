/*
 * Attribution capture + cross-tab broadcast for the live dashboard.
 *
 * - Reads utm_* / click_id / gclid / fbclid from the landing URL and stores
 *   them in sessionStorage so subsequent same-tab navigations keep the source.
 * - Assigns a persistent client_id in localStorage.
 * - Broadcasts a `pageview`, every `dataLayer.push`, and every raw click on
 *   BroadcastChannel('sgtm-live'), with a localStorage-event fallback so
 *   the dashboard tab picks up traffic from any other tab on this origin.
 */
(function () {
  var ATTR_KEY = 'sgtm.attribution';
  var CID_KEY  = 'sgtm.client_id';
  var TICK_KEY = 'sgtm.tick';
  var CHANNEL  = 'sgtm-live';

  function parseQuery() {
    var q = {};
    var s = (location.search || '').replace(/^\?/, '');
    if (!s) return q;
    s.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
      var v = decodeURIComponent(i < 0 ? '' : kv.slice(i + 1).replace(/\+/g, ' '));
      q[k] = v;
    });
    return q;
  }

  function readAttribution() {
    var raw;
    try { raw = sessionStorage.getItem(ATTR_KEY); } catch (e) {}
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function writeAttribution(a) {
    try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(a)); } catch (e) {}
  }

  function getOrCreateClientId() {
    var id;
    try { id = localStorage.getItem(CID_KEY); } catch (e) {}
    if (id) return id;
    id = 'cid_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try { localStorage.setItem(CID_KEY, id); } catch (e) {}
    return id;
  }

  var q = parseQuery();
  var hasIncoming = q.utm_source || q.utm_medium || q.utm_campaign ||
                    q.click_id || q.gclid || q.fbclid;

  var attribution = readAttribution();
  if (hasIncoming || !attribution) {
    attribution = {
      utm_source:   q.utm_source   || (q.gclid ? 'google' : q.fbclid ? 'facebook' : '(direct)'),
      utm_medium:   q.utm_medium   || (q.gclid ? 'cpc'    : q.fbclid ? 'paid_social' : '(none)'),
      utm_campaign: q.utm_campaign || '(none)',
      utm_content:  q.utm_content  || null,
      utm_term:     q.utm_term     || null,
      click_id:     q.click_id     || q.gclid || q.fbclid || null,
      landing_page: location.pathname + location.search,
      landed_at:    new Date().toISOString(),
      referrer:     document.referrer || null
    };
    writeAttribution(attribution);
  }

  var clientId = getOrCreateClientId();

  window.SGTMSource = {
    attribution: attribution,
    clientId: clientId,
    reset: function () {
      try { sessionStorage.removeItem(ATTR_KEY); } catch (e) {}
    }
  };

  var channel = null;
  try { channel = new BroadcastChannel(CHANNEL); } catch (e) {}

  var seq = 0;
  function broadcast(type, payload) {
    var msg = {
      type: type,
      ts: new Date().toISOString(),
      seq: ++seq,
      client_id: clientId,
      page: location.pathname,
      page_title: document.title,
      attribution: attribution,
      payload: payload
    };
    if (channel) {
      try { channel.postMessage(msg); } catch (e) {}
    }
    try { localStorage.setItem(TICK_KEY, JSON.stringify(msg)); } catch (e) {}
  }

  broadcast('pageview', {
    url: location.href,
    referrer: document.referrer || null
  });

  (window.__dlLog || []).forEach(function (entry) {
    broadcast('datalayer', entry.data);
  });

  window.addEventListener('dl:push', function (ev) {
    broadcast('datalayer', ev.detail && ev.detail.data);
  });

  function describeTarget(el) {
    if (!el || el.nodeType !== 1) return null;
    var text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
    if (text.length > 80) text = text.slice(0, 77) + '...';
    var out = {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.className && typeof el.className === 'string' ? el.className : null,
      text: text || null
    };
    if (el.tagName === 'A' && el.getAttribute('href')) out.href = el.getAttribute('href');
    if (el.tagName === 'BUTTON' && el.type) out.button_type = el.type;
    if (el.dataset) {
      var data = {};
      for (var k in el.dataset) data[k] = el.dataset[k];
      if (Object.keys(data).length) out.dataset = data;
    }
    return out;
  }

  document.addEventListener('click', function (ev) {
    var actionable = ev.target.closest('a, button, [role="button"], input[type="submit"], input[type="button"]');
    var el = actionable || ev.target;
    broadcast('click', {
      target: describeTarget(el),
      x: ev.clientX,
      y: ev.clientY
    });
  }, true);
})();
