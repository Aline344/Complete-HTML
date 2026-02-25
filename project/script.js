// DOM Elements
const cartBtn = document.getElementById('cart-toggle-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartLoading = document.getElementById('cart-loading');
const headerCartCount = document.getElementById('header-cart-count');
const headerCartTotal = document.getElementById('header-cart-total');
const sidebarCartCount = document.getElementById('sidebar-cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const toast = document.getElementById('toast');

// API Base URL
const API_URL = 'http://localhost:3000/api/cart';

// State
let cart = [];

// Event Listeners
cartBtn.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);

// Functions
function toggleCart() {
  cartSidebar.classList.toggle('active');
  cartOverlay.classList.toggle('active');

  // Fetch latest cart when opening
  if (cartSidebar.classList.contains('active')) {
    fetchCart();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Fetch Cart Data
async function fetchCart() {
  try {
    cartLoading.style.display = 'block';
    cartItemsContainer.innerHTML = ''; // clear current items

    const response = await fetch(API_URL);
    const data = await response.json();

    cart = data;
    updateCartUI();
  } catch (error) {
    console.error('Error fetching cart:', error);
    cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Failed to load cart items.</div>';
  } finally {
    cartLoading.style.display = 'none';
    renderCartItems();
  }
}

// Add to Cart
async function addToCart(name, price) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, price })
    });

    const data = await response.json();

    if (response.ok) {
      cart = data.cart;
      updateCartUI();
      showToast(`${name} added to cart!`);
    } else {
      showToast('Failed to add item to cart.');
    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Network error.');
  }
}

// Update DOM elements based on cart state
function updateCartUI() {
  const totalItems = cart.length;
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

  // Update header
  headerCartCount.textContent = totalItems;
  headerCartTotal.textContent = totalPrice;

  // Update sidebar counts
  sidebarCartCount.textContent = totalItems;
  cartTotalPrice.textContent = `$${totalPrice}`;
}

// Render items in the sidebar
function renderCartItems() {
  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
    return;
  }

  cart.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        `;
    cartItemsContainer.appendChild(itemEl);
  });
}

// Initial fetch on load to set badge numbers
fetchCart();
