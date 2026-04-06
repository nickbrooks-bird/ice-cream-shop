/* ── Bird SDK Tracking Layer ── */

/**
 * Helper: safely call Bird SDK methods.
 * The SDK loads async, so we queue calls until it's ready.
 */
function waitForBird(callback) {
  if (window.Bird && window.Bird.tracker) {
    callback(window.Bird);
  } else {
    setTimeout(() => waitForBird(callback), 200);
  }
}

function trackEvent(eventName, properties) {
  waitForBird(bird => {
    bird.tracker.track(eventName, properties || {});
    console.log('[Bird SDK]', eventName, properties || {});
  });
}

function identifyUser(email, attributes) {
  waitForBird(bird => {
    bird.contact.identify({ strategy: 'Visitor', identifier: { key: 'emailaddress', value: email } }, attributes || {});
    console.log('[Bird SDK] identify', email, attributes || {});
  });
}

/* ── Patch addToCart ── */
const _origAddToCart = addToCart;
addToCart = function(productId) {
  _origAddToCart(productId);
  const product = PRODUCTS.find(p => p.id === productId);
  if (product) {
    trackEvent('Product Added to Cart', {
      product_id: product.id,
      name: product.name,
      price: product.price,
      currency: 'USD',
    });
  }
};

/* ── Patch removeFromCart ── */
const _origRemoveFromCart = removeFromCart;
removeFromCart = function(productId) {
  const product = PRODUCTS.find(p => p.id === productId) || getCart().find(i => i.id === productId);
  _origRemoveFromCart(productId);
  if (product) {
    trackEvent('Product Removed from Cart', {
      product_id: product.id || productId,
      name: product.name,
    });
  }
};

/* ── Patch updateQty ── */
const _origUpdateQty = updateQty;
updateQty = function(productId, delta) {
  const cartBefore = getCart();
  const itemBefore = cartBefore.find(i => i.id === productId);
  _origUpdateQty(productId, delta);
  if (itemBefore && delta < 0 && itemBefore.qty + delta <= 0) {
    trackEvent('Product Removed from Cart', {
      product_id: productId,
      name: itemBefore.name,
    });
  }
};

/* ── Patch clearCart (order placed) ── */
const _origClearCart = clearCart;
clearCart = function() {
  const cart = getCart();
  const total = getCartTotal();
  const items = cart.map(item => ({
    product_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.qty,
  }));
  trackEvent('Order Completed', {
    total: total,
    currency: 'USD',
    tax: +(total * 0.08).toFixed(2),
    shipping: 4.99,
    items: items,
  });
  _origClearCart();
};

/* ── Patch setUser (login/register) ── */
const _origSetUser = setUser;
setUser = function(user) {
  _origSetUser(user);

  // Fire a tracking event so it shows in the events timeline
  if (user.firstName) {
    trackEvent('Account Created', {
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
    });
  } else {
    trackEvent('Signed In', {
      email: user.email,
    });
  }

  // Identify the contact (associates events with this email)
  identifyUser(user.email, {
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
  });
};

/* ── Cart Viewed ── */
document.addEventListener('DOMContentLoaded', () => {
  // Track cart views
  if (window.location.pathname.endsWith('cart.html') || window.location.pathname.endsWith('cart')) {
    const cart = getCart();
    if (cart.length > 0) {
      trackEvent('Cart Viewed', {
        items: cart.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
        })),
        total: getCartTotal(),
        currency: 'USD',
      });
    }
  }

  // Track checkout started
  if (window.location.pathname.endsWith('checkout.html') || window.location.pathname.endsWith('checkout')) {
    const cart = getCart();
    if (cart.length > 0) {
      trackEvent('Checkout Started', {
        items: cart.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
        })),
        total: getCartTotal(),
        currency: 'USD',
      });
    }
  }
});
