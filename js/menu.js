/**
 * menu.js — Sarvoraa menu page logic
 * Handles: category filter tabs, live search, cart badge pulse animation
 * Depends on: app.js (must load first)
 */

// ─── Category filter ──────────────────────────────────────────────────────────

function initCategoryFilter() {
  const tabs  = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-dish-id]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Active tab styling
      tabs.forEach(t => t.classList.remove('filter-active'));
      tab.classList.add('filter-active');

      const filter = tab.dataset.filter;

      cards.forEach(card => {
        const cat = (card.dataset.dishCategory || '').toLowerCase();
        const show = filter === 'all' || cat === filter.toLowerCase();
        card.style.transition = 'opacity .2s, transform .2s';

        if (show) {
          card.style.opacity   = '1';
          card.style.transform = 'scale(1)';
          card.style.display   = '';
        } else {
          card.style.opacity   = '0';
          card.style.transform = 'scale(.95)';
          // hide after transition
          setTimeout(() => {
            if (card.dataset.dishCategory.toLowerCase() !== filter.toLowerCase() &&
                filter !== 'all') {
              card.style.display = 'none';
            }
          }, 200);
        }
      });

      updateResultCount(filter, cards);
    });
  });
}

// ─── Live search ──────────────────────────────────────────────────────────────

function initSearch() {
  const input = document.getElementById('menu-search');
  const cards = document.querySelectorAll('[data-dish-id]');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();

    // Reset category tabs so search works independently
    document.querySelectorAll('[data-filter]').forEach(t => t.classList.remove('filter-active'));
    const allTab = document.querySelector('[data-filter="all"]');
    if (allTab) allTab.classList.add('filter-active');

    let visible = 0;
    cards.forEach(card => {
      const name = (card.dataset.dishName || '').toLowerCase();
      const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
      const match = !q || name.includes(q) || desc.includes(q);
      card.style.display   = match ? '' : 'none';
      card.style.opacity   = match ? '1' : '0';
      if (match) visible++;
    });

    showNoResults(visible === 0 && q.length > 0);
  });
}

// ─── No-results state ─────────────────────────────────────────────────────────

function showNoResults(show) {
  let el = document.getElementById('no-results');
  if (!el) {
    el = document.createElement('p');
    el.id = 'no-results';
    el.className = 'col-span-3 text-center text-[#8a8078] py-12 text-lg';
    el.textContent = 'No dishes match your search. Try something else!';
    const grid = document.getElementById('dish-grid');
    if (grid) grid.appendChild(el);
  }
  el.style.display = show ? 'block' : 'none';
}

// ─── Result count label ───────────────────────────────────────────────────────

function updateResultCount(filter, cards) {
  const label = document.getElementById('result-count');
  if (!label) return;
  const count = filter === 'all'
    ? cards.length
    : [...cards].filter(c => c.dataset.dishCategory.toLowerCase() === filter.toLowerCase()).length;
  label.textContent = `${count} dish${count !== 1 ? 'es' : ''}`;
}

// ─── Cart badge pulse on add ──────────────────────────────────────────────────

function pulseBadge() {
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.classList.remove('badge-pulse');
    // force reflow so animation restarts
    void b.offsetWidth;
    b.classList.add('badge-pulse');
  });
}

// Monkey-patch addToCart to trigger pulse (app.js must be loaded first)
(function patchAddToCart() {
  const _orig = window.addToCart;
  if (!_orig) return;
  window.addToCart = function(item) {
    _orig(item);
    pulseBadge();
  };
})();

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initCategoryFilter();
  initSearch();

  // Seed result count label
  const cards = document.querySelectorAll('[data-dish-id]');
  const label = document.getElementById('result-count');
  if (label) label.textContent = `${cards.length} dishes`;
});
