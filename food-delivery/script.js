// Sample Data
const restaurants = [
    {
        id: 1,
        name: "Pizza Palace",
        cuisine: "Italian",
        rating: 4.5,
        deliveryTime: "30-40 mins",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"
    },
    {
        id: 2,
        name: "Burger Hub",
        cuisine: "American",
        rating: 4.3,
        deliveryTime: "25-35 mins",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"
    },
    {
        id: 3,
        name: "Spice Garden",
        cuisine: "Indian",
        rating: 4.7,
        deliveryTime: "35-45 mins",
        image: "https://images.unsplash.com/photo-1585937421612-70a008356f36?w=400"
    },
    {
        id: 4,
        name: "Sushi World",
        cuisine: "Japanese",
        rating: 4.6,
        deliveryTime: "40-50 mins",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400"
    }
];

const menuItems = [
    {
        id: 1,
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce, mozzarella, and basil",
        price: 299,
        category: "pizza",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400"
    },
    {
        id: 2,
        name: "Pepperoni Pizza",
        description: "Loaded with pepperoni and extra cheese",
        price: 399,
        category: "pizza",
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400"
    },
    {
        id: 3,
        name: "Classic Burger",
        description: "Juicy beef patty with lettuce, tomato, and special sauce",
        price: 199,
        category: "burger",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"
    },
    {
        id: 4,
        name: "Cheese Burger",
        description: "Double cheese with crispy bacon",
        price: 249,
        category: "burger",
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400"
    },
    {
        id: 5,
        name: "Butter Chicken",
        description: "Creamy tomato curry with tender chicken pieces",
        price: 349,
        category: "indian",
        image: "https://images.unsplash.com/photo-1585937421612-70a008356f36?w=400"
    },
    {
        id: 6,
        name: "Paneer Tikka Masala",
        description: "Grilled paneer in rich spicy gravy",
        price: 299,
        category: "indian",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400"
    },
    {
        id: 7,
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with molten center",
        price: 149,
        category: "dessert",
        image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400"
    },
    {
        id: 8,
        name: "Gulab Jamun",
        description: "Traditional Indian sweet in sugar syrup",
        price: 99,
        category: "dessert",
        image: "https://images.unsplash.com/photo-1593295844601-1f5b6a8c0a0c?w=400"
    }
];

// Cart State
let cart = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadRestaurants();
    loadMenuItems();
    setupFilterButtons();
});

// Load Restaurants
function loadRestaurants() {
    const restaurantList = document.getElementById('restaurant-list');
    restaurantList.innerHTML = restaurants.map(restaurant => `
        <div class="restaurant-card">
            <img src="${restaurant.image}" alt="${restaurant.name}" class="restaurant-image">
            <div class="restaurant-info">
                <h3>${restaurant.name}</h3>
                <p>${restaurant.cuisine} • ${restaurant.deliveryTime}</p>
                <div class="restaurant-rating">
                    <i class="fas fa-star"></i>
                    <span>${restaurant.rating}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Menu Items
function loadMenuItems(category = 'all') {
    const menuList = document.getElementById('menu-list');
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
    
    menuList.innerHTML = filteredItems.map(item => `
        <div class="menu-item">
            <img src="${item.image}" alt="${item.name}" class="menu-item-image">
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="menu-item-footer">
                    <span class="price">₹${item.price}</span>
                    <button class="add-to-cart" onclick="addToCart(${item.id})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup Filter Buttons
function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const category = this.getAttribute('data-category');
            loadMenuItems(category);
        });
    });
}

// Add to Cart
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    const existingItem = cart.find(i => i.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    updateCartCount();
    showNotification('Item added to cart!');
}

// Update Cart Count
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

// Toggle Cart Modal
function toggleCart() {
    const cartModal = document.getElementById('cart-modal');
    cartModal.classList.toggle('active');
    
    if (cartModal.classList.contains('active')) {
        loadCartItems();
    }
}

// Load Cart Items
function loadCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Your cart is empty</p>';
        cartTotalElement.textContent = '₹0';
        return;
    }
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price} x ${item.quantity}</p>
            </div>
            <div>
                <span>₹${item.price * item.quantity}</span>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalElement.textContent = `₹${total}`;
}

// Remove from Cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartCount();
    loadCartItems();
}

// Show Checkout Form
function showCheckoutForm() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    toggleCart();
    const checkoutModal = document.getElementById('checkout-modal');
    checkoutModal.classList.add('active');
    
    // Load order summary
    const orderSummaryItems = document.getElementById('order-summary-items');
    const orderTotal = document.getElementById('order-total');
    
    orderSummaryItems.innerHTML = cart.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>${item.name} x ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    orderTotal.textContent = `₹${total}`;
}

// Hide Checkout Form
function hideCheckoutForm() {
    const checkoutModal = document.getElementById('checkout-modal');
    checkoutModal.classList.remove('active');
}

// Place Order
function placeOrder(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const payment = document.getElementById('payment').value;
    
    // In a real application, you would send this data to a server
    console.log('Order placed:', {
        name,
        phone,
        address,
        payment,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
    
    // Hide checkout modal
    hideCheckoutForm();
    
    // Clear cart
    cart = [];
    updateCartCount();
    
    // Show success message
    const successMessage = document.getElementById('success-message');
    successMessage.classList.add('active');
    
    // Reset form
    document.getElementById('checkout-form').reset();
    
    // Hide success message after 3 seconds
    setTimeout(() => {
        successMessage.classList.remove('active');
    }, 3000);
    
    showNotification('Order placed successfully! Thank you for ordering.');
}

// Show Notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #00b894;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 5000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add animation keyframes
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const cartModal = document.getElementById('cart-modal');
    const checkoutModal = document.getElementById('checkout-modal');
    
    if (event.target === cartModal) {
        cartModal.classList.remove('active');
    }
    
    if (event.target === checkoutModal) {
        checkoutModal.classList.remove('active');
    }
}
