/* Fake product catalog. Six items — enough variety for list/item testing. */
window.CURRENCY = 'USD';

window.PRODUCTS = [
  {
    id: 'sku-001',
    name: 'Classic Cotton Tee',
    price: 24.99,
    category: 'apparel',
    brand: 'Acme',
    description: 'A soft, breathable cotton t-shirt. Fits true to size and holds up in the wash.'
  },
  {
    id: 'sku-002',
    name: 'Denim Trucker Jacket',
    price: 89.00,
    category: 'apparel',
    brand: 'Acme',
    description: 'A mid-weight denim jacket with a classic cut, roomy enough for a mid-layer.'
  },
  {
    id: 'sku-003',
    name: 'Everyday Sneakers',
    price: 74.50,
    category: 'footwear',
    brand: 'Runner',
    description: 'Cushioned trainers built for long days on your feet. Neutral colorway.'
  },
  {
    id: 'sku-004',
    name: 'Leather Belt',
    price: 32.00,
    category: 'accessories',
    brand: 'Acme',
    description: 'Full-grain leather belt with a brushed steel buckle.'
  },
  {
    id: 'sku-005',
    name: 'Wool Beanie',
    price: 18.00,
    category: 'accessories',
    brand: 'Warmth',
    description: 'A snug merino-wool beanie for cold mornings.'
  },
  {
    id: 'sku-006',
    name: 'Canvas Backpack',
    price: 55.00,
    category: 'accessories',
    brand: 'Trail',
    description: '20L canvas backpack with padded laptop sleeve and side water-bottle pockets.'
  }
];

window.getProduct = function (id) {
  return window.PRODUCTS.find(function (p) { return p.id === id; }) || null;
};

/* Build a GA4-shaped item object from a product + quantity + list context. */
window.toGA4Item = function (product, quantity, listCtx) {
  var item = {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand,
    item_category: product.category,
    price: product.price,
    quantity: quantity || 1,
    currency: window.CURRENCY
  };
  if (listCtx) {
    if (listCtx.item_list_id) item.item_list_id = listCtx.item_list_id;
    if (listCtx.item_list_name) item.item_list_name = listCtx.item_list_name;
    if (typeof listCtx.index === 'number') item.index = listCtx.index;
  }
  return item;
};
