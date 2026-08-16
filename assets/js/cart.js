/*
 * Cart storage + GA4 ecommerce event emitters.
 * Cart shape in localStorage: [{ id: 'sku-001', quantity: 2 }, ...]
 */
(function () {
  var STORAGE_KEY = 'gtm_sandbox_cart_v1';

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function write(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:changed'));
  }

  function all() { return read(); }

  function count() {
    return read().reduce(function (n, l) { return n + l.quantity; }, 0);
  }

  function subtotal() {
    return read().reduce(function (sum, line) {
      var p = window.getProduct(line.id);
      return sum + (p ? p.price * line.quantity : 0);
    }, 0);
  }

  function withProducts() {
    return read().map(function (line) {
      var p = window.getProduct(line.id);
      return p ? { product: p, quantity: line.quantity } : null;
    }).filter(Boolean);
  }

  function add(id, quantity) {
    var qty = quantity || 1;
    var cart = read();
    var line = cart.find(function (l) { return l.id === id; });
    if (line) line.quantity += qty;
    else cart.push({ id: id, quantity: qty });
    write(cart);
  }

  function setQuantity(id, quantity) {
    var cart = read();
    var line = cart.find(function (l) { return l.id === id; });
    if (!line) return;
    if (quantity <= 0) {
      cart = cart.filter(function (l) { return l.id !== id; });
    } else {
      line.quantity = quantity;
    }
    write(cart);
  }

  function remove(id) {
    var cart = read().filter(function (l) { return l.id !== id; });
    write(cart);
  }

  function clear() { write([]); }

  window.Cart = {
    all: all,
    count: count,
    subtotal: subtotal,
    withProducts: withProducts,
    add: add,
    setQuantity: setQuantity,
    remove: remove,
    clear: clear
  };

  /* ---------- GA4 ecommerce event helpers ---------- */

  function push(event, ecommerce) {
    // Clear the ecommerce object first, per Google's recommendation, so
    // stale item arrays don't leak between events.
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event: event, ecommerce: ecommerce });
  }

  window.GA4 = {
    viewItemList: function (products, listCtx) {
      var items = products.map(function (p, i) {
        return window.toGA4Item(p, 1, Object.assign({ index: i }, listCtx || {}));
      });
      push('view_item_list', {
        item_list_id: (listCtx && listCtx.item_list_id) || undefined,
        item_list_name: (listCtx && listCtx.item_list_name) || undefined,
        items: items
      });
    },

    selectItem: function (product, listCtx, index) {
      push('select_item', {
        item_list_id: (listCtx && listCtx.item_list_id) || undefined,
        item_list_name: (listCtx && listCtx.item_list_name) || undefined,
        items: [window.toGA4Item(product, 1, Object.assign({ index: index }, listCtx || {}))]
      });
    },

    viewItem: function (product) {
      push('view_item', {
        currency: window.CURRENCY,
        value: product.price,
        items: [window.toGA4Item(product, 1)]
      });
    },

    addToCart: function (product, quantity) {
      var qty = quantity || 1;
      push('add_to_cart', {
        currency: window.CURRENCY,
        value: +(product.price * qty).toFixed(2),
        items: [window.toGA4Item(product, qty)]
      });
    },

    removeFromCart: function (product, quantity) {
      var qty = quantity || 1;
      push('remove_from_cart', {
        currency: window.CURRENCY,
        value: +(product.price * qty).toFixed(2),
        items: [window.toGA4Item(product, qty)]
      });
    },

    viewCart: function () {
      var lines = window.Cart.withProducts();
      push('view_cart', {
        currency: window.CURRENCY,
        value: +window.Cart.subtotal().toFixed(2),
        items: lines.map(function (l) { return window.toGA4Item(l.product, l.quantity); })
      });
    },

    beginCheckout: function () {
      var lines = window.Cart.withProducts();
      push('begin_checkout', {
        currency: window.CURRENCY,
        value: +window.Cart.subtotal().toFixed(2),
        items: lines.map(function (l) { return window.toGA4Item(l.product, l.quantity); })
      });
    },

    purchase: function (transactionId, lines, opts) {
      opts = opts || {};
      var value = lines.reduce(function (s, l) { return s + l.product.price * l.quantity; }, 0);
      push('purchase', {
        transaction_id: transactionId,
        currency: window.CURRENCY,
        value: +value.toFixed(2),
        tax: opts.tax != null ? opts.tax : 0,
        shipping: opts.shipping != null ? opts.shipping : 0,
        items: lines.map(function (l) { return window.toGA4Item(l.product, l.quantity); })
      });
    }
  };
})();
