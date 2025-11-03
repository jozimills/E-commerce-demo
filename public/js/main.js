// Professional E-commerce JavaScript
class EliteShop {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('eliteShopCart')) || [];
        this.wishlist = JSON.parse(localStorage.getItem('eliteShopWishlist')) || [];
        this.currentFilter = 'all';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartUI();
        this.setupProductFilters();
        this.setupSearch();
        this.setupSmoothScrolling();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Cart functionality
        document.getElementById('open-cart')?.addEventListener('click', () => this.openCart());
        document.getElementById('close-cart')?.addEventListener('click', () => this.closeCart());
        document.getElementById('cart-backdrop')?.addEventListener('click', () => this.closeCart());
        document.getElementById('checkout-btn')?.addEventListener('click', () => this.checkout());

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Search
        document.querySelector('.search-bar')?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.querySelector('.search-btn')?.addEventListener('click', () => this.performSearch());

        // Form submission
        document.querySelector('form')?.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Wishlist functionality
        document.querySelectorAll('.quick-action-btn[title="Add to Wishlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleWishlist(e));
        });
    }

    // Cart Management
    addToCart(productId, price, name, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: productId,
                name: name,
                price: price,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${name} added to cart!`, 'success');
        this.openCart();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.showNotification('Item removed from cart', 'info');
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    updateCartUI() {
        const cartContent = document.getElementById('cart-drawer-content');
        const cartFooter = document.getElementById('cart-drawer-footer');
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');

        // Update cart count badge
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        if (!cartContent) return;

        if (this.cart.length === 0) {
            cartContent.innerHTML = '<p class="cart-empty">Your cart is empty. Start shopping to add items!</p>';
            if (cartFooter) cartFooter.style.display = 'none';
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        cartContent.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="shop.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span style="padding: 0 1rem; font-weight: 600;">${item.quantity}</span>
                        <button class="quantity-btn" onclick="shop.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="remove-cart-btn" onclick="shop.removeFromCart('${item.id}')" title="Remove item">&times;</button>
            </div>
        `).join('');

        if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
        if (cartFooter) cartFooter.style.display = 'block';
    }

    openCart() {
        document.getElementById('cart-drawer')?.classList.add('open');
        document.getElementById('cart-backdrop')?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeCart() {
        document.getElementById('cart-drawer')?.classList.remove('open');
        document.getElementById('cart-backdrop')?.classList.remove('show');
        document.body.style.overflow = '';
    }

    saveCart() {
        localStorage.setItem('eliteShopCart', JSON.stringify(this.cart));
    }

    // Product Filtering
    setupProductFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter products
                const category = button.dataset.category;
                this.filterProducts(category);
            });
        });
    }

    filterProducts(category) {
        this.currentFilter = category;
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const productCategory = card.dataset.category;
            const shouldShow = category === 'all' || productCategory === category;
            
            if (shouldShow) {
                card.style.display = 'block';
                card.style.animation = 'fadeInUp 0.6s ease-out';
            } else {
                card.style.display = 'none';
            }
        });

        // Update URL without reload
        const url = new URL(window.location);
        if (category === 'all') {
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', category);
        }
        window.history.pushState({}, '', url);
    }

    // Search Functionality
    setupSearch() {
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        }
    }

    handleSearch(query) {
        if (query.length < 2) {
            this.clearSearchResults();
            return;
        }

        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    performSearch(query = null) {
        const searchQuery = query || document.querySelector('.search-bar')?.value.toLowerCase();
        if (!searchQuery) return;

        const productCards = document.querySelectorAll('.product-card');
        let hasResults = false;

        productCards.forEach(card => {
            const title = card.querySelector('.product-title')?.textContent.toLowerCase();
            const category = card.querySelector('.product-category')?.textContent.toLowerCase();
            
            const matches = title?.includes(searchQuery) || category?.includes(searchQuery);
            
            if (matches) {
                card.style.display = 'block';
                hasResults = true;
            } else {
                card.style.display = 'none';
            }
        });

        // Show search results message
        this.showSearchResults(searchQuery, hasResults);
    }

    showSearchResults(query, hasResults) {
        let resultsMessage = document.querySelector('.search-results-message');
        
        if (!resultsMessage) {
            resultsMessage = document.createElement('div');
            resultsMessage.className = 'search-results-message';
            resultsMessage.style.cssText = `
                text-align: center; 
                padding: 2rem; 
                margin: 1rem 0;
                background: var(--primary-50);
                border-radius: var(--radius-lg);
                border: 1px solid var(--primary-200);
            `;
            document.querySelector('.product-grid')?.parentNode.insertBefore(resultsMessage, document.querySelector('.product-grid'));
        }

        if (hasResults) {
            resultsMessage.innerHTML = `<p>Search results for "<strong>${query}</strong>"</p>`;
        } else {
            resultsMessage.innerHTML = `
                <p>No products found for "<strong>${query}</strong>"</p>
                <p style="color: var(--neutral-600); font-size: 0.9rem;">Try searching for electronics, fashion, home, or health products</p>
            `;
        }
    }

    clearSearchResults() {
        const resultsMessage = document.querySelector('.search-results-message');
        if (resultsMessage) {
            resultsMessage.remove();
        }

        // Show all products in current category
        this.filterProducts(this.currentFilter);
    }

    // Navigation
    handleNavigation(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

        // Update active nav state
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        e.target.classList.add('active');
    }

    setupSmoothScrolling() {
        // Add smooth scrolling to all anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Wishlist Management
    toggleWishlist(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const productCard = e.target.closest('.product-card');
        const productId = productCard.querySelector('.add-to-cart')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        const productName = productCard.querySelector('.product-title')?.textContent;
        
        if (!productId) return;

        const isInWishlist = this.wishlist.includes(productId);
        
        if (isInWishlist) {
            this.wishlist = this.wishlist.filter(id => id !== productId);
            e.target.innerHTML = '♡';
            this.showNotification(`${productName} removed from wishlist`, 'info');
        } else {
            this.wishlist.push(productId);
            e.target.innerHTML = '❤️';
            this.showNotification(`${productName} added to wishlist!`, 'success');
        }
        
        localStorage.setItem('eliteShopWishlist', JSON.stringify(this.wishlist));
    }

    // Checkout Process
    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'warning');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Simulate checkout process
        this.showNotification('Redirecting to secure checkout...', 'info');
        
        setTimeout(() => {
            alert(`Checkout Summary:\n\nItems: ${this.cart.length}\nTotal: $${total.toFixed(2)}\n\nThank you for shopping with EliteShop!\n\n(This is a demo - no actual payment processed)`);
            
            // Clear cart after "purchase"
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.closeCart();
        }, 1000);
    }

    // Form Handling
    handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Simulate form submission
        this.showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
        form.reset();
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-500)' : type === 'warning' ? 'var(--warning-500)' : type === 'error' ? 'var(--error-500)' : 'var(--primary-500)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            max-width: 300px;
            font-weight: 500;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        // Cart shortcut (Ctrl+B)
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            this.openCart();
        }
        
        // Search shortcut (Ctrl+K)
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.querySelector('.search-bar')?.focus();
        }
        
        // Close cart with Escape
        if (e.key === 'Escape') {
            this.closeCart();
        }
    }

    // Animations and Visual Effects
    setupAnimations() {
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .product-card:hover {
                animation: none;
            }
            
            .cart-badge {
                animation: pulse 1s ease-in-out;
            }
        `;
        document.head.appendChild(style);

        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease-out';
                }
            });
        }, { threshold: 0.1 });

        // Observe product cards
        document.querySelectorAll('.product-card').forEach(card => {
            observer.observe(card);
        });
    }

    // Utility Methods
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for HTML onclick handlers
function addToCart(productId, price, name, quantity = 1) {
    window.shop.addToCart(productId, price, name, quantity);
}

// Initialize the shop when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shop = new EliteShop();
    
    // Load wishlist state
    document.querySelectorAll('.quick-action-btn[title="Add to Wishlist"]').forEach(btn => {
        const productCard = btn.closest('.product-card');
        const productId = productCard?.querySelector('.add-to-cart')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        
        if (productId && window.shop.wishlist.includes(productId)) {
            btn.innerHTML = '❤️';
        }
    });
    
    // Handle URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        const filterBtn = document.querySelector(`[data-category="${category}"]`);
        if (filterBtn) {
            filterBtn.click();
        }
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EliteShop;
}