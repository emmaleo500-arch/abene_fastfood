/**
 * app.js — Sarvoraa core engine
 * Handles: cart (localStorage), toast notifications,
 *          contact form validation, shared nav cart badge
 */

// ─── Cart ────────────────────────────────────────────────────────────────────

const CART_KEY = 'sarvoraa_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  // item = { id, name, price, image, category }
  const cart = getCart();
  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart(cart);
  showToast(`"${item.name}" added to cart 🛒`);
}

function removeFromCart(id) {
  const cart = getCart().filter(c => c.id !== id);
  saveCart(cart);
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart(cart);
  // If we're on the order page, re-render
  if (typeof renderCart === 'function') renderCart();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

// ─── Badge ───────────────────────────────────────────────────────────────────

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = cartCount();
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; bottom: 1.5rem; right: 1.5rem;
      display: flex; flex-direction: column; gap: .5rem;
      z-index: 9999; pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bg = type === 'error' ? '#c0392b' : type === 'info' ? '#2a2824' : '#d4a373';
  toast.style.cssText = `
    background: ${bg}; color: #fff; padding: .75rem 1.25rem;
    border-radius: 50px; font-size: .875rem; font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,.5);
    opacity: 0; transform: translateY(12px);
    transition: opacity .25s, transform .25s;
    pointer-events: auto;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

// ─── "Order now" / "Add to cart" buttons ─────────────────────────────────────

function wireOrderButtons() {
  document.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = btn.closest('[data-dish-id]');
      if (!el) return;
      addToCart({
        id:       el.dataset.dishId,
        name:     el.dataset.dishName,
        price:    parseInt(el.dataset.dishPrice, 10),
        image:    el.dataset.dishImage,
        category: el.dataset.dishCategory || '',
      });
    });
  });
}

// ─── Contact form ─────────────────────────────────────────────────────────────

function wireContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = form.querySelector('[name="cname"]').value.trim();
    const email   = form.querySelector('[name="cemail"]').value.trim();
    const message = form.querySelector('[name="cmessage"]').value.trim();

    if (!name)                            return showToast('Please enter your name.', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                          return showToast('Enter a valid email address.', 'error');
    if (message.length < 10)             return showToast('Message is too short.', 'error');

    // Simulate a network request
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    setTimeout(() => {
      showToast('Message sent! We\'ll reply within 24 hours ');
      form.reset();
      btn.disabled = false;
      btn.textContent = 'Send message';
    }, 1200);
  });
}

// ─── Highlight active nav link from current URL ───────────────────────────────

function highlightActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === page);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  updateCartBadge();
  wireOrderButtons();
  wireContactForm();
});
