/* ── Product Data ── */
const PRODUCTS = [
  { id: 'vanilla',      name: 'Classic Vanilla',     price: 5.99, emoji: '\u{1F9C1}', bg: '#fff9c4', description: 'Rich Madagascar vanilla bean' },
  { id: 'chocolate',    name: 'Double Chocolate',    price: 6.49, emoji: '\u{1F36B}', bg: '#d7ccc8', description: 'Deep Belgian chocolate swirl' },
  { id: 'strawberry',   name: 'Strawberry Fields',   price: 6.49, emoji: '\u{1F353}', bg: '#fce4ec', description: 'Fresh-picked summer strawberries' },
  { id: 'mint-chip',    name: 'Mint Chocolate Chip',  price: 6.99, emoji: '\u{1F33F}', bg: '#e0f2f1', description: 'Cool mint with dark chocolate chips' },
  { id: 'cookie-dough', name: 'Cookie Dough',        price: 7.49, emoji: '\u{1F36A}', bg: '#fff3e0', description: 'Chunks of buttery cookie dough' },
  { id: 'salted-caramel', name: 'Salted Caramel',   price: 6.99, emoji: '\u{1F36E}', bg: '#fbe9e7', description: 'Sweet and salty caramel ribbons' },
  { id: 'pistachio',    name: 'Pistachio Dream',     price: 7.49, emoji: '\u{1F33B}', bg: '#f1f8e9', description: 'Roasted Sicilian pistachios' },
  { id: 'mango-sorbet', name: 'Mango Sorbet',        price: 5.99, emoji: '\u{1F96D}', bg: '#fff8e1', description: 'Tropical mango, dairy-free' },
];

/* ── Cart State ── */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
  }
  saveCart(cart);
  showToast(`${product.name} added to cart`);
}

function updateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    saveCart(cart.filter(i => i.id !== productId));
  } else {
    saveCart(cart);
  }
  if (typeof renderCart === 'function') renderCart();
}

function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
  if (typeof renderCart === 'function') renderCart();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartItemCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function clearCart() {
  localStorage.removeItem('cart');
  updateCartCount();
}

/* ── Cart Badge ── */
function updateCartCount() {
  document.querySelectorAll('.cart-count').forEach(el => {
    const count = getCartItemCount();
    el.textContent = count > 0 ? count : '';
  });
}

/* ── Toast ── */
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ── Product Card HTML ── */
function productCardHTML(product) {
  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-image" style="background: ${product.bg}">${product.emoji}</div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="description">${product.description}</p>
        <div class="price-row">
          <span class="price">$${product.price.toFixed(2)}</span>
          <button class="btn btn-primary btn-small" onclick="addToCart('${product.id}')">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
}

/* ── Mobile Nav Toggle ── */
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }
});

/* ── Auth State ── */
function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user'));
  } catch {
    return null;
  }
}

function setUser(user) {
  sessionStorage.setItem('user', JSON.stringify(user));
  updateAuthLinks();
}

function logout() {
  sessionStorage.removeItem('user');
  updateAuthLinks();
  showToast('Signed out');
  window.location.href = 'index.html';
}

function updateAuthLinks() {
  const user = getUser();
  document.querySelectorAll('.auth-link').forEach(el => {
    if (user) {
      el.textContent = 'Sign Out';
      el.href = '#';
      el.onclick = (e) => { e.preventDefault(); logout(); };
    } else {
      el.textContent = 'Sign In';
      el.href = 'login.html';
      el.onclick = null;
    }
  });
}

document.addEventListener('DOMContentLoaded', updateAuthLinks);
