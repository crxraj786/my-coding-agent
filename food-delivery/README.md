# FoodieExpress - Food Delivery Website

A complete, responsive food delivery website built with HTML, CSS, and JavaScript.

## 📁 Project Location

The website is deployed in the folder:
```
/workspace/food-delivery/
```

## 📂 Folder Structure

```
food-delivery/
├── index.html      # Main HTML file
├── styles.css      # All styling and animations
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## ✨ Features

- **Responsive Design** - Works on all devices (desktop, tablet, mobile)
- **Restaurant Listings** - Display multiple restaurants with ratings
- **Menu System** - Filter menu items by category (Pizza, Burgers, Indian, Desserts)
- **Shopping Cart** - Add/remove items, view cart total
- **Checkout Form** - Complete order form with delivery details
- **Order Confirmation** - Success message after placing order
- **Modern UI** - Beautiful animations and smooth transitions
- **Contact Section** - Contact information and social links

## 🚀 How to Run

### Option 1: Open Directly in Browser
Simply open `index.html` file in any web browser:
```bash
# On Linux/Mac
xdg-open /workspace/food-delivery/index.html

# Or just drag and drop the file into your browser
```

### Option 2: Using a Local Server
```bash
cd /workspace/food-delivery
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

### Option 3: Using Node.js (if installed)
```bash
cd /workspace/food-delivery
npx serve
```

## 🎯 Usage Instructions

1. **Browse Restaurants** - Scroll down to see popular restaurants
2. **View Menu** - Check out available food items
3. **Filter Items** - Click on category buttons to filter menu items
4. **Add to Cart** - Click "Add" button on any menu item
5. **View Cart** - Click the cart icon in the navbar
6. **Checkout** - Fill in your details and place order
7. **Confirmation** - See success message after ordering

## 🛠️ Technologies Used

- HTML5
- CSS3 (with CSS Variables and Animations)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons
- Unsplash Images (for demo purposes)

## 📱 Responsive Breakpoints

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## 🎨 Color Scheme

- Primary: #ff6b35 (Orange)
- Secondary: #f7c59f (Light Orange)
- Dark: #2d3436 (Dark Gray)
- Light: #ffffff (White)
- Success: #00b894 (Green)

## 📝 Notes

- This is a frontend-only demo website
- No backend/server integration
- Sample data is hardcoded in JavaScript
- Images are loaded from Unsplash CDN
- Perfect for learning and customization

## 🔧 Customization

You can easily customize:
- Restaurant data in `script.js`
- Menu items in `script.js`
- Colors in `styles.css` (CSS variables)
- Content in `index.html`

Enjoy your food delivery website! 🍕🍔🍜
