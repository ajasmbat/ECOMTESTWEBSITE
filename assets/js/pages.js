/*
 * Per-page bootstrapping. Each page sets <body data-page="..."> and this
 * file dispatches to the right init function. Also renders the shared
 * header cart-badge and wires "add to cart" style delegated handlers.
 */
(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]+)').exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function money(n) {
    return '$' + (Math.round(n * 100) / 100).toFixed(2);
  }

  function refreshCartBadge() {
    var el = qs('#cart-badge');
    if (el) el.textContent = window.Cart.count();
  }

  /* --------- products.html --------- */
  function renderProductGrid() {
    var grid = qs('#product-grid');
    if (!grid) return;
    var listCtx = { item_list_id: 'products_all', item_list_name: 'All Products' };

    grid.innerHTML = window.PRODUCTS.map(function (p, i) {
      return (
        '<article class="card" data-product-id="' + p.id + '" data-index="' + i + '">' +
          '<div class="card-thumb">' + p.name.slice(0, 1) + '</div>' +
          '<h3 class="card-title"><a href="product.html?id=' + p.id + '" class="js-select-item">' + p.name + '</a></h3>' +
          '<p class="card-meta">' + p.brand + ' · ' + p.category + '</p>' +
          '<p class="card-price">' + money(p.price) + '</p>' +
          '<button type="button" class="btn btn-primary js-add-to-cart" data-product-id="' + p.id + '">Add to cart</button>' +
        '</article>'
      );
    }).join('');

    window.GA4.viewItemList(window.PRODUCTS, listCtx);

    grid.addEventListener('click', function (e) {
      var link = e.target.closest('.js-select-item');
      if (link) {
        var card = link.closest('[data-product-id]');
        var p = window.getProduct(card.dataset.productId);
        var idx = parseInt(card.dataset.index, 10);
        window.GA4.selectItem(p, listCtx, idx);
        return;
      }
      var addBtn = e.target.closest('.js-add-to-cart');
      if (addBtn) {
        var p2 = window.getProduct(addBtn.dataset.productId);
        window.Cart.add(p2.id, 1);
        window.GA4.addToCart(p2, 1);
        refreshCartBadge();
      }
    });
  }

  /* --------- product.html --------- */
  function renderProductDetail() {
    var root = qs('#product-detail');
    if (!root) return;
    var id = getParam('id') || 'sku-001';
    var p = window.getProduct(id);
    if (!p) {
      root.innerHTML = '<p>Product not found.</p>';
      return;
    }
    root.innerHTML =
      '<div class="detail">' +
        '<div class="detail-thumb">' + p.name.slice(0, 1) + '</div>' +
        '<div class="detail-body">' +
          '<h1>' + p.name + '</h1>' +
          '<p class="card-meta">' + p.brand + ' · ' + p.category + ' · SKU ' + p.id + '</p>' +
          '<p class="card-price">' + money(p.price) + '</p>' +
          '<p>' + p.description + '</p>' +
          '<div class="qty-row">' +
            '<label>Qty <input type="number" id="detail-qty" value="1" min="1" step="1"></label>' +
            '<button type="button" class="btn btn-primary" id="detail-add">Add to cart</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    window.GA4.viewItem(p);

    qs('#detail-add').addEventListener('click', function () {
      var q = Math.max(1, parseInt(qs('#detail-qty').value, 10) || 1);
      window.Cart.add(p.id, q);
      window.GA4.addToCart(p, q);
      refreshCartBadge();
    });
  }

  /* --------- cart.html --------- */
  function renderCart() {
    var root = qs('#cart-root');
    if (!root) return;

    function draw() {
      var lines = window.Cart.withProducts();
      if (!lines.length) {
        root.innerHTML = '<p>Your cart is empty. <a href="products.html">Browse products</a>.</p>';
        return;
      }
      root.innerHTML =
        '<table class="cart-table">' +
          '<thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Line total</th><th></th></tr></thead>' +
          '<tbody>' +
          lines.map(function (l) {
            return (
              '<tr data-product-id="' + l.product.id + '">' +
                '<td>' + l.product.name + '</td>' +
                '<td>' + money(l.product.price) + '</td>' +
                '<td>' +
                  '<button type="button" class="qty-btn js-dec">−</button>' +
                  '<span class="qty-val">' + l.quantity + '</span>' +
                  '<button type="button" class="qty-btn js-inc">+</button>' +
                '</td>' +
                '<td>' + money(l.product.price * l.quantity) + '</td>' +
                '<td><button type="button" class="btn btn-ghost js-remove">Remove</button></td>' +
              '</tr>'
            );
          }).join('') +
          '</tbody>' +
          '<tfoot><tr><td colspan="3"></td><td><strong>' + money(window.Cart.subtotal()) + '</strong></td><td></td></tr></tfoot>' +
        '</table>' +
        '<div class="cart-actions">' +
          '<a class="btn btn-primary" href="checkout.html" id="go-checkout">Checkout</a>' +
        '</div>';
    }

    draw();
    window.GA4.viewCart();

    root.addEventListener('click', function (e) {
      var row = e.target.closest('tr[data-product-id]');
      if (!row) {
        if (e.target.id === 'go-checkout') { window.GA4.beginCheckout(); }
        return;
      }
      var p = window.getProduct(row.dataset.productId);
      var line = window.Cart.all().find(function (l) { return l.id === p.id; });
      if (!line) return;

      if (e.target.classList.contains('js-inc')) {
        window.Cart.setQuantity(p.id, line.quantity + 1);
        window.GA4.addToCart(p, 1);
      } else if (e.target.classList.contains('js-dec')) {
        window.Cart.setQuantity(p.id, line.quantity - 1);
        window.GA4.removeFromCart(p, 1);
      } else if (e.target.classList.contains('js-remove')) {
        window.Cart.remove(p.id);
        window.GA4.removeFromCart(p, line.quantity);
      } else {
        return;
      }
      draw();
      refreshCartBadge();
    });

    window.addEventListener('cart:changed', refreshCartBadge);
  }

  /* --------- checkout.html --------- */
  function renderCheckout() {
    var form = qs('#checkout-form');
    if (!form) return;
    var summary = qs('#checkout-summary');
    var lines = window.Cart.withProducts();

    if (!lines.length) {
      summary.innerHTML = '<p>Your cart is empty. <a href="products.html">Add something first.</a></p>';
      form.style.display = 'none';
      return;
    }

    summary.innerHTML =
      '<ul>' + lines.map(function (l) {
        return '<li>' + l.product.name + ' × ' + l.quantity + ' — ' + money(l.product.price * l.quantity) + '</li>';
      }).join('') + '</ul>' +
      '<p><strong>Total: ' + money(window.Cart.subtotal()) + '</strong></p>';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var txnId = 'T-' + Date.now().toString(36).toUpperCase() + '-' +
                  Math.random().toString(36).slice(2, 6).toUpperCase();
      sessionStorage.setItem('gtm_sandbox_last_txn', JSON.stringify({
        id: txnId,
        lines: lines.map(function (l) { return { id: l.product.id, quantity: l.quantity }; })
      }));
      window.GA4.purchase(txnId, lines, { tax: 0, shipping: 0 });
      window.Cart.clear();
      window.location.href = 'thankyou.html';
    });
  }

  /* --------- thankyou.html --------- */
  function renderThankYou() {
    var root = qs('#order-root');
    if (!root) return;
    var raw = sessionStorage.getItem('gtm_sandbox_last_txn');
    if (!raw) {
      root.innerHTML = '<p>No recent order in this session. <a href="products.html">Shop again</a>.</p>';
      return;
    }
    var order = JSON.parse(raw);
    var lines = order.lines.map(function (l) {
      var p = window.getProduct(l.id);
      return p ? { product: p, quantity: l.quantity } : null;
    }).filter(Boolean);
    var total = lines.reduce(function (s, l) { return s + l.product.price * l.quantity; }, 0);

    root.innerHTML =
      '<h1>Thank you!</h1>' +
      '<p>Your order ID is <code>' + order.id + '</code>.</p>' +
      '<ul>' + lines.map(function (l) {
        return '<li>' + l.product.name + ' × ' + l.quantity + ' — ' + money(l.product.price * l.quantity) + '</li>';
      }).join('') + '</ul>' +
      '<p><strong>Total paid: ' + money(total) + '</strong></p>';
  }

  /* --------- init --------- */
  function init() {
    refreshCartBadge();
    var page = document.body.getAttribute('data-page');
    if (page === 'products') renderProductGrid();
    else if (page === 'product') renderProductDetail();
    else if (page === 'cart') renderCart();
    else if (page === 'checkout') renderCheckout();
    else if (page === 'thankyou') renderThankYou();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  window.addEventListener('cart:changed', refreshCartBadge);
})();
