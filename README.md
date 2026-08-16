# GTM & GA4 Practice Sandbox

A deliberately-underbuilt static store for practicing Google Tag Manager and GA4 configuration. Pure HTML / CSS / vanilla JS — no build step, no npm, no framework.

---

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static file server works; nothing needs to be built.

## Swap in your GTM container ID

The container ID is stored in **one** place. Open [`assets/js/config.js`](assets/js/config.js) and change:

```js
var GTM_ID = 'GTM-XXXXXXX';
```

That's it. Every page loads `config.js`, and the snippet + `<noscript>` iframe are injected from there.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Repo → **Settings → Pages**.
3. Source: **Deploy from a branch**, Branch: `main`, Folder: `/ (root)`.
4. Save. Your site is live at `https://<user>.github.io/<repo>/`.

All internal links use **relative paths**, so it works both at the domain root and inside a subdirectory.

---

## File structure

```
.
├── index.html          # home + all "deliberate gap" elements
├── products.html       # 6-item grid — view_item_list on load
├── product.html        # detail page, reads ?id= — view_item on load
├── cart.html           # line items + qty controls — view_cart / add / remove
├── checkout.html       # form + place order — begin_checkout + purchase
├── thankyou.html       # order confirmation with random transaction_id
├── contact.html        # form (deliberate gap — no push on submit)
├── about.html          # ~2000 words of lorem — for Scroll Depth trigger
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── config.js       # GTM_ID + snippet injection + push wrapper
│       ├── data.js         # fake product catalog + GA4 item helper
│       ├── cart.js         # localStorage cart + window.GA4 event helpers
│       ├── pages.js        # per-page rendering & event wiring
│       └── inspector.js    # bottom-right dataLayer inspector panel
└── README.md
```

### The dataLayer inspector

Fixed panel bottom-right on every page. Collapsible. Shows time-stamped, pretty-printed JSON per push, most-recent first, with a **clear** button.

It captures events that fire *before* the panel itself mounts by wrapping `dataLayer.push` inside `config.js` (which runs earlier) and buffering entries in `window.__dlLog`. On mount, the panel replays the buffer and then subscribes to a `dl:push` `CustomEvent` for live updates.

---

## Trackable elements — cheat sheet

Everything with an explicit `event` name pushes via `window.dataLayer`. Everything under **Deliberate gaps** pushes nothing — practice building GTM click triggers by selector.

### All pages

| Element | How to catch it |
|---|---|
| `user_data` push on load | dataLayer event `user_data` (contains `logged_in`, `user_id`) |
| GTM container | `<script>` in `<head>`, `<noscript>` iframe injected into `<body>` |

### `index.html` — deliberate gaps (no dataLayer pushes)

| Element | Selector to trigger on |
|---|---|
| Subscribe button | `#newsletter-btn` |
| Download brochure link | `a[href$=".pdf"]` |
| Outbound link | `a[href^="http"]:not([href*="localhost"])` (or Click URL contains `example.com`) |
| Track-me buttons ×3 | `.track-me` — use `data-label` for the label variable |
| Phone link | `a[href^="tel:"]` |
| Email link | `a[href^="mailto:"]` |

### `products.html`

| Trigger | dataLayer event |
|---|---|
| Page load | `view_item_list` (with `item_list_id: "products_all"`, `items[]`) |
| Click a product title | `select_item` |
| Click "Add to cart" on a card | `add_to_cart` |

### `product.html`

| Trigger | dataLayer event |
|---|---|
| Page load | `view_item` |
| Click "Add to cart" | `add_to_cart` |

### `cart.html`

| Trigger | dataLayer event |
|---|---|
| Page load | `view_cart` |
| Click **+** on a line | `add_to_cart` (qty 1) |
| Click **−** on a line | `remove_from_cart` (qty 1) |
| Click **Remove** on a line | `remove_from_cart` (full line qty) |
| Click **Checkout** | `begin_checkout` (fires before navigation) |

### `checkout.html`

| Trigger | dataLayer event |
|---|---|
| Submit the form (Place order) | `purchase` (fires **before** the redirect) with `transaction_id`, `value`, `tax`, `shipping`, `items[]` |

### `thankyou.html`

No new dataLayer pushes on this page — the `purchase` event was pushed on checkout, immediately before the redirect. This is the standard pattern for GA4 with a redirect-based confirmation.

### `contact.html` — deliberate gap

| Element | Selector to trigger on |
|---|---|
| Contact form | `form#contact-form` — build a Form Submit trigger |
| Phone / email links | `a[href^="tel:"]`, `a[href^="mailto:"]` |

### `about.html`

No pushes of its own — use it to build a GTM **Scroll Depth** trigger (25 / 50 / 75 / 90%) and confirm each threshold fires as you scroll.

---

## GA4 ecommerce event schema

Every commerce event pushes the recommended GA4 shape: `{ event: '<name>', ecommerce: { currency, value, items: [...] } }`, preceded by `{ ecommerce: null }` to clear the previous object per Google's recommendation. Item objects use `item_id`, `item_name`, `item_brand`, `item_category`, `price`, `quantity`, `currency`, and (for list events) `item_list_id`, `item_list_name`, `index`. The `purchase` event additionally includes `transaction_id`, `tax`, and `shipping`.
