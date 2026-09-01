/*
 * Tracklution event bridge (container LS-47453901-6).
 *
 * The main Tracklution script + `tlq('track','PageView')` live inline in each
 * page. This file adds the conversion events on top of the sandbox's existing
 * dataLayer/GA4 instrumentation, so no existing event code is duplicated:
 *
 *   view_item      -> ViewContent
 *   add_to_cart    -> AddToCart
 *   begin_checkout -> InitiateCheckout
 *   contact form   -> Lead (+ ContactInfo)
 *   thank-you page -> ContactInfo + Purchase (once per order id)
 *
 * Must load BEFORE pages.js so the dl:push listener is registered before the
 * page-init events fire. Needs config.js (dl:push) and data.js (getProduct).
 */
(function () {
  function tlqSafe() {
    if (typeof window.tlq !== 'function') return;
    try { window.tlq.apply(null, arguments); } catch (e) { /* never break the page */ }
  }

  function money(n) { return +(Math.round(n * 100) / 100).toFixed(2); }

  function cleanContact(raw) {
    var out = {};
    Object.keys(raw).forEach(function (k) {
      var v = raw[k];
      if (typeof v === 'string') v = v.trim();
      if (v) out[k] = v;
    });
    return out;
  }

  function splitName(full) {
    var parts = (full || '').trim().split(/\s+/).filter(Boolean);
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
  }

  /* ---- dataLayer -> Tracklution standard events ---- */
  var MAP = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout' };

  window.addEventListener('dl:push', function (ev) {
    var d = ev.detail && ev.detail.data;
    if (!d || !d.event || !MAP[d.event]) return;
    var ec = d.ecommerce || {};
    var params = {};
    if (ec.value != null) params.value = money(ec.value);
    if (ec.currency) params.currency = ec.currency;
    tlqSafe('track', MAP[d.event], params);
  });

  /* ---- Contact form -> Lead ---- */
  function wireContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function () {
      var name = splitName(form.elements.name && form.elements.name.value);
      var info = cleanContact({
        email: form.elements.email && form.elements.email.value,
        firstName: name.firstName,
        lastName: name.lastName
      });
      if (Object.keys(info).length) tlqSafe('set', 'ContactInfo', info);
      tlqSafe('track', 'Lead');
    });
  }

  /* ---- Thank-you page -> ContactInfo + Purchase ---- */
  function firePurchase() {
    if (document.body.getAttribute('data-page') !== 'thankyou') return;
    var raw = sessionStorage.getItem('gtm_sandbox_last_txn');
    if (!raw) return;
    var order;
    try { order = JSON.parse(raw); } catch (e) { return; }
    if (!order || !order.id) return;

    // Only once per order: a reload of thankyou.html must not double-count.
    var SENT_KEY = 'tracklution_purchase_sent';
    if (sessionStorage.getItem(SENT_KEY) === order.id) return;

    var total = (order.lines || []).reduce(function (s, l) {
      var p = window.getProduct ? window.getProduct(l.id) : null;
      return s + (p ? p.price * l.quantity : 0);
    }, 0);

    var c = order.customer || {};
    var name = splitName(c.name);
    var info = cleanContact({
      email: c.email,
      phoneNumber: c.phone,
      firstName: name.firstName,
      lastName: name.lastName,
      address: c.address,
      postCode: c.zip,
      city: c.city,
      externalId: order.id
    });
    if (Object.keys(info).length) tlqSafe('set', 'ContactInfo', info);

    tlqSafe('track', 'Purchase', {
      value: money(total),
      currency: window.CURRENCY || 'USD',
      orderId: order.id
    });
    sessionStorage.setItem(SENT_KEY, order.id);
  }

  function init() { wireContactForm(); firePurchase(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
