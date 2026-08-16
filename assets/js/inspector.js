/*
 * dataLayer inspector — fixed panel, collapsible, bottom-right.
 * Pulls previously buffered pushes from window.__dlLog (populated in
 * config.js) so nothing is missed between page load and panel init,
 * then subscribes to the `dl:push` CustomEvent for live updates.
 */
(function () {
  var panel, list, toggleBtn, clearBtn, countBadge;
  var collapsed = false;

  function fmtTime(iso) {
    var d = new Date(iso);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
           '.' + ('' + d.getMilliseconds()).padStart(3, '0');
  }

  function eventName(data) {
    if (!data) return '(null)';
    if (typeof data !== 'object') return '(' + typeof data + ')';
    if (data.event) return data.event;
    if (data[0] === 'consent') return 'consent';
    if (data['gtm.start']) return 'gtm.start';
    return Object.keys(data)[0] || '(anonymous)';
  }

  function render(entry) {
    var wrap = document.createElement('details');
    wrap.className = 'dl-entry';
    var summary = document.createElement('summary');
    summary.innerHTML =
      '<span class="dl-time">' + fmtTime(entry.time) + '</span>' +
      '<span class="dl-event">' + escapeHtml(eventName(entry.data)) + '</span>';
    var pre = document.createElement('pre');
    pre.textContent = safeStringify(entry.data);
    wrap.appendChild(summary);
    wrap.appendChild(pre);
    list.insertBefore(wrap, list.firstChild);
    updateBadge();
  }

  function safeStringify(v) {
    try { return JSON.stringify(v, null, 2); }
    catch (e) { return String(v); }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function updateBadge() {
    countBadge.textContent = list.children.length;
  }

  function clear() {
    while (list.firstChild) list.removeChild(list.firstChild);
    window.__dlLog = [];
    updateBadge();
  }

  function toggle() {
    collapsed = !collapsed;
    panel.classList.toggle('collapsed', collapsed);
    toggleBtn.textContent = collapsed ? '▲' : '▼';
  }

  function mount() {
    panel = document.createElement('div');
    panel.id = 'dl-inspector';
    panel.innerHTML =
      '<header class="dl-header">' +
        '<strong>dataLayer</strong>' +
        '<span class="dl-count" title="events captured">0</span>' +
        '<span class="dl-spacer"></span>' +
        '<button type="button" class="dl-btn dl-clear" title="clear">clear</button>' +
        '<button type="button" class="dl-btn dl-toggle" title="collapse">▼</button>' +
      '</header>' +
      '<div class="dl-list" role="log" aria-live="polite"></div>';
    document.body.appendChild(panel);

    list = panel.querySelector('.dl-list');
    toggleBtn = panel.querySelector('.dl-toggle');
    clearBtn = panel.querySelector('.dl-clear');
    countBadge = panel.querySelector('.dl-count');

    toggleBtn.addEventListener('click', toggle);
    clearBtn.addEventListener('click', clear);

    // Replay everything that was captured before we mounted.
    (window.__dlLog || []).forEach(render);

    // Live subscription.
    window.addEventListener('dl:push', function (ev) { render(ev.detail); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
