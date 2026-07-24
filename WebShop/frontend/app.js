(function() {
    'use strict';

    const API_BASE = 'http://127.0.0.1:8000';

    let currentUser = null;
    let cart = { items: [], total: 0, user_id: 0, cart_id: 0 };
    let items = [];
    let favorites = [];
    let stats = null;
    let currentDetailItemId = null;
    let selectedCartItems = new Set();

    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownContent = document.getElementById('dropdownContent');
    const profileBtn = document.getElementById('profileBtn');
    const profileNameShort = document.getElementById('profileNameShort');
    const profileAvatar = document.getElementById('profileAvatar');
    const dropdownUsername = document.getElementById('dropdownUsername');
    const dropdownUserType = document.getElementById('dropdownUserType');
    const dropdownLogout = document.getElementById('dropdownLogout');

    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginMessage = document.getElementById('loginMessage');

    const registerUsername = document.getElementById('registerUsername');
    const registerPassword = document.getElementById('registerPassword');
    const registerSeller = document.getElementById('registerSeller');
    const registerShopName = document.getElementById('registerShopName');
    const registerBtn = document.getElementById('registerBtn');
    const registerMessage = document.getElementById('registerMessage');

    const profileUsername = document.getElementById('profileUsername');
    const profileType = document.getElementById('profileType');
    const profileSince = document.getElementById('profileSince');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const profileEditForm = document.getElementById('profileEditForm');
    const newUsername = document.getElementById('newUsername');
    const editPassword = document.getElementById('editPassword');
    const saveUsernameBtn = document.getElementById('saveUsernameBtn');
    const profileMessage = document.getElementById('profileMessage');

    const itemGrid = document.getElementById('itemGrid');
    const refreshItemsBtn = document.getElementById('refreshItemsBtn');
    const addItemBtn = document.getElementById('addItemBtn');

    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotal = document.getElementById('cartTotal');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartCountBadge = document.getElementById('cartCountBadge');
    const cartBadge = document.getElementById('cartBadge');

    const ordersContainer = document.getElementById('ordersContainer');
    const favoritesContainer = document.getElementById('favoritesContainer');

    const totalSales = document.getElementById('totalSales');
    const totalRevenue = document.getElementById('totalRevenue');
    const totalItems = document.getElementById('totalItems');
    const avgOrder = document.getElementById('avgOrder');
    const salesChart = document.getElementById('salesChart');

    const addItemModal = document.getElementById('addItemModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const newItemName = document.getElementById('newItemName');
    const newItemPrice = document.getElementById('newItemPrice');
    const submitItemBtn = document.getElementById('submitItemBtn');
    const itemMessage = document.getElementById('itemMessage');

    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const detailName = document.getElementById('detailName');
    const detailShop = document.getElementById('detailShop');
    const detailPrice = document.getElementById('detailPrice');
    const detailRating = document.getElementById('detailRating');
    const detailReviews = document.getElementById('detailReviews');
    const detailShopName = document.getElementById('detailShopName');
    const detailAddToCart = document.getElementById('detailAddToCart');
    const detailFavorite = document.getElementById('detailFavorite');
    const detailReviewsList = document.getElementById('detailReviewsList');
    const reviewRating = document.getElementById('reviewRating');
    const reviewBody = document.getElementById('reviewBody');
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    const reviewMessage = document.getElementById('reviewMessage');

    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    registerSeller.addEventListener('change', function() {
        const shopNameGroup = document.getElementById('shopNameGroup');
        if (this.value === 'true') {
            shopNameGroup.style.display = 'block';
        } else {
            shopNameGroup.style.display = 'none';
        }
    });

    function showNotification(message, type = 'success') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        notification.innerHTML = `
            <span>${icons[type] || 'ℹ️'}</span>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s';
                setTimeout(() => {
                    if (notification.parentElement) notification.remove();
                }, 300);
            }
        }, 3000);
    }

    function showModalMessage(el, type, msg) {
        el.className = `auth-message ${type}`;
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    }

    async function checkHealth() {
        try {
            const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                statusDot.className = 'status-dot online';
                statusText.textContent = 'API Online';
                return true;
            }
        } catch (_) {}
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'API Offline';
        return false;
    }

    checkHealth();
    setInterval(checkHealth, 30000);

    async function register(username, password, seller, shopName) {
        const res = await fetch(`${API_BASE}/login/sign-up`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                seller: seller === 'true',
                shop_name: shopName || null
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Registration failed');
        }
        return res.json();
    }

    async function login(username, password) {
        const res = await fetch(`${API_BASE}/login/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Login failed');
        }
        return res.json();
    }

    async function fetchItems() {
        try {
            const res = await fetch(`${API_BASE}/item/`);
            if (!res.ok) throw new Error('Failed to fetch items');
            items = await res.json();
            renderItems();
        } catch (_) {
            renderItems();
        }
    }

    async function createItem(name, price) {
        const res = await fetch(`${API_BASE}/item/create-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, seller_id: currentUser.user_id }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to create item');
        }
        return res.json();
    }

    async function fetchProductDetails(itemId) {
        try {
            const [itemRes, reviewsRes] = await Promise.all([
                fetch(`${API_BASE}/item/get-item/${itemId}`),
                fetch(`${API_BASE}/reviews/list-reviews-item/${itemId}`)
            ]);

            if (!itemRes.ok) throw new Error('Failed to fetch item');
            const item = await itemRes.json();

            let reviews = [];
            let avgRating = 0;

            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                reviews = reviewsData || [];
                if (reviews.length > 0) {
                    avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                }
            }

            return { item, reviews, avgRating };
        } catch (err) {
            showNotification('Failed to load product details', 'error');
            return null;
        }
    }

    async function fetchCart() {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/cart/user-cart/${currentUser.user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                if (res.status === 404) {
                    cart = { items: [], total: 0, user_id: currentUser.user_id, cart_id: 0 };
                    selectedCartItems.clear();
                    renderCart();
                    updateBadge();
                    renderItems();
                    return;
                }
                throw new Error('Failed to fetch cart');
            }
            cart = await res.json();
            selectedCartItems.clear();
            cart.items.forEach(item => selectedCartItems.add(item.item_id));
            renderCart();
            updateBadge();
            renderItems();
        } catch (_) {
            cart = { items: [], total: 0, user_id: currentUser?.user_id || 0, cart_id: 0 };
            selectedCartItems.clear();
            renderCart();
            updateBadge();
            renderItems();
        }
    }

    async function addToCart(itemId) {
        if (!currentUser) {
            showNotification('Please login first', 'error');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/cart/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id, item_id: itemId, quantity: 1 }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to add to cart');
            }
            cart = await res.json();
            const item = items.find(i => i.item_id === itemId);
            showNotification(`"${item?.name || 'Item'}" added to cart 🛒`, 'success');
            renderCart();
            updateBadge();
            renderItems();
            updateDetailButtons(itemId);
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    async function addOneToCart(itemId) {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/cart/add-one`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id, item_id: itemId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to add one');
            }
            cart = await res.json();
            showNotification('Added one more item 🛒', 'success');
            renderCart();
            updateBadge();
            renderItems();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    async function removeOneFromCart(itemId) {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/cart/remove-one`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id, item_id: itemId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to remove item');
            }
            cart = await res.json();
            selectedCartItems.delete(itemId);
            showNotification('Removed one item from cart', 'info');
            renderCart();
            updateBadge();
            renderItems();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    async function removeAllFromCart(itemId) {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/cart/remove-all`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id, item_id: itemId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to remove all items');
            }
            cart = await res.json();
            selectedCartItems.delete(itemId);
            showNotification('Removed all items from cart', 'info');
            renderCart();
            updateBadge();
            renderItems();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    async function clearCart() {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/cart/clear-cart/${currentUser.user_id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to clear cart');
            }
            cart = await res.json();
            selectedCartItems.clear();
            showNotification('Cart cleared successfully 🗑️', 'success');
            renderCart();
            updateBadge();
            renderItems();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    function toggleSelectAll() {
        if (!cart.items || cart.items.length === 0) return;

        window._userInteractedWithCart = true;

        const allSelected = cart.items.every(item => selectedCartItems.has(item.item_id));

        if (allSelected) {
            selectedCartItems.clear();
        } else {
            cart.items.forEach(item => selectedCartItems.add(item.item_id));
        }

        renderCart();
        updateSelectedTotal();
    }

    function updateSelectedTotal() {
        let selectedTotal = 0;
        cart.items.forEach(item => {
            if (selectedCartItems.has(item.item_id)) {
                selectedTotal += item.item_price * item.quantity;
            }
        });

        const allSelected = cart.items.length > 0 && cart.items.every(item => selectedCartItems.has(item.item_id));

        if (cart.items.length > 0) {
            document.getElementById('selectedTotal').style.display = 'block';
            document.getElementById('selectedTotalAmount').textContent = selectedTotal.toFixed(2);
            checkoutBtn.style.display = 'inline-block';
            selectAllBtn.style.display = 'inline-block';
            selectAllBtn.textContent = allSelected ? '❌ Deselect All' : '✅ Select All';
        } else {
            document.getElementById('selectedTotal').style.display = 'none';
            checkoutBtn.style.display = 'none';
            selectAllBtn.style.display = 'none';
        }
    }

    async function fetchFavorites() {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/favourites/favourite-list/${currentUser.user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                if (res.status === 404) {
                    favorites = [];
                    renderFavorites();
                    renderItems();
                    return;
                }
                throw new Error('Failed to fetch favorites');
            }
            const data = await res.json();
            favorites = data.map(f => {
                const item = items.find(i => i.item_id === f.item_id);
                return {
                    id: f.favourite_id,
                    item_id: f.item_id,
                    user_id: f.user_id,
                    name: item?.name || 'Unknown Item',
                    price: item?.price || 0
                };
            });
            renderFavorites();
            renderItems();
        } catch (_) {
            favorites = [];
            renderFavorites();
            renderItems();
        }
    }

    async function toggleFavorite(itemId) {
        if (!currentUser) {
            showNotification('Please login first', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/favourites/add-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.user_id,
                    item_id: itemId
                }),
            });

            if (res.status === 200) {
                const data = await res.json();
                if (data.favourite_id) {
                    const item = items.find(i => i.item_id === itemId);
                    const exists = favorites.some(f => f.item_id === itemId);
                    if (!exists) {
                        favorites.push({
                            id: data.favourite_id,
                            item_id: data.item_id,
                            user_id: data.user_id,
                            name: item?.name || 'Unknown Item',
                            price: item?.price || 0
                        });
                        showNotification(`Added "${item?.name || 'Item'}" to favorites ❤️`, 'success');
                    }
                } else {
                    showNotification(data.detail || 'Removed from favorites', 'info');
                    favorites = favorites.filter(f => f.item_id !== itemId);
                }
                renderFavorites();
                renderItems();
                updateDetailButtons(itemId);
            } else {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to toggle favorite');
            }
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    async function submitReview(itemId, userId, rating, body, author) {
        const res = await fetch(`${API_BASE}/reviews/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                item_id: itemId,
                rating: parseInt(rating),
                body: body,
                author: author || 'User'
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to submit review');
        }
        return res.json();
    }

    async function deleteReview(reviewId, userId, itemId) {
        const res = await fetch(`${API_BASE}/reviews/remove-review`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                review_id: reviewId,
                user_id: userId,
                item_id: itemId
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to delete review');
        }
        return res.json();
    }

    async function makeOrder(userId, itemIds) {
        const payload = {
            user_id: userId,
            order_items: itemIds
        };

        const res = await fetch(`${API_BASE}/order/make-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to create order');
        }
        return res.json();
    }

    async function cancelOrder(orderId) {
        if (!currentUser) {
            showNotification('Please login first', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to cancel order #${orderId}?`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/order/cancel-order`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.user_id,
                    order_id: orderId
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to cancel order');
            }
            showNotification(`Order #${orderId} cancelled successfully`, 'success');
            await fetchOrders();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    async function fetchOrders() {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/order/all-orders/${currentUser.user_id}`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            const orders = await res.json();
            renderOrders(orders);
        } catch (err) {
            ordersContainer.innerHTML = `<div class="empty-message">${err.message}</div>`;
        }
    }

    function renderOrders(orders) {
        ordersContainer.innerHTML = '';
        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = '<div class="empty-message">No orders yet</div>';
            return;
        }
        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-item';

            const itemNames = order.item_ids.map(id => {
                const item = items.find(i => i.item_id === id);
                return item?.name || 'Item #' + id;
            }).join(', ');

            const statusColor = order.status === 'Pending' ? '#f59e0b' :
                               order.status === 'Completed' ? '#22c55e' : '#ef4444';

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:0.5rem;">
                    <div>
                        <span><strong>Order #${order.order_id}</strong></span>
                        <span style="margin-left:0.5rem; color:#64748b; font-size:0.85rem;">
                            ${itemNames}
                        </span>
                        <span style="margin-left:1rem; font-weight:600; color:#2563eb;">
                            $${(order.total || 0).toFixed(2)}
                        </span>
                        <span style="margin-left:1rem; color:${statusColor}; font-size:0.8rem; font-weight:500;">
                            ${order.status}
                        </span>
                        <span style="margin-left:1rem; color:#64748b; font-size:0.85rem;">
                            ${new Date(order.ordered_at).toLocaleDateString()}
                        </span>
                    </div>
                    ${order.status === 'Pending' ? `
                        <button class="btn btn-danger btn-sm cancel-order-btn" data-order-id="${order.order_id}">
                            ✕ Cancel
                        </button>
                    ` : ''}
                </div>
            `;
            ordersContainer.appendChild(div);
        });

        ordersContainer.querySelectorAll('.cancel-order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = Number(btn.dataset.orderId);
                cancelOrder(orderId);
            });
        });
    }

    async function fetchStats() {
        if (!currentUser || !currentUser.seller) {
            document.querySelector('.tab-btn[data-tab="stats"]').style.display = 'none';
            return;
        }

        document.querySelector('.tab-btn[data-tab="stats"]').style.display = 'block';

        try {
            const ordersRes = await fetch(`${API_BASE}/order/all-orders/${currentUser.user_id}`);
            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            const orders = await ordersRes.json();

            const itemsRes = await fetch(`${API_BASE}/item/`);
            if (!itemsRes.ok) throw new Error('Failed to fetch items');
            const allItems = await itemsRes.json();
            const sellerItems = allItems.filter(item => item.seller_id === currentUser.user_id);

            let totalSales = 0;
            let totalRevenue = 0;
            let itemsSold = 0;
            let itemSalesCount = {};
            let ordersCount = 0;

            orders.forEach(order => {
                if (order.status === 'Cancelled') return;

                let orderHasSellerItems = false;
                let orderTotal = 0;

                order.item_ids.forEach(itemId => {
                    const item = allItems.find(i => i.item_id === itemId);
                    if (item && item.seller_id === currentUser.user_id) {
                        orderHasSellerItems = true;
                        itemsSold += 1;
                        orderTotal += item.price;

                        if (!itemSalesCount[itemId]) {
                            itemSalesCount[itemId] = { count: 0, revenue: 0, name: item.name };
                        }
                        itemSalesCount[itemId].count += 1;
                        itemSalesCount[itemId].revenue += item.price;
                    }
                });

                if (orderHasSellerItems) {
                    ordersCount += 1;
                    totalRevenue += orderTotal;
                }
            });

            totalSales = itemsSold;

            document.getElementById('totalSales').textContent = totalSales;
            document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
            document.getElementById('totalItems').textContent = sellerItems.length || 0;
            document.getElementById('avgOrder').textContent = ordersCount > 0
                ? `$${(totalRevenue / ordersCount).toFixed(2)}`
                : '$0.00';

            renderTopItems(itemSalesCount);
            renderSalesChart(orders, allItems);

        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }

    function renderTopItems(itemSalesCount) {
        const container = document.getElementById('topItemsContainer');
        if (!container) {
            const statsSection = document.querySelector('.stats-section') || document.getElementById('stats');
            if (statsSection) {
                const newContainer = document.createElement('div');
                newContainer.id = 'topItemsContainer';
                newContainer.className = 'stats-section';
                newContainer.innerHTML = `
                    <h4 style="margin: 1.5rem 0 0.8rem;">🏆 Top Selling Items</h4>
                    <div id="topItemsList"></div>
                `;
                statsSection.appendChild(newContainer);
            }
            return;
        }

        const listContainer = document.getElementById('topItemsList') || container;
        listContainer.innerHTML = '';

        const sortedItems = Object.values(itemSalesCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        if (sortedItems.length === 0) {
            listContainer.innerHTML = '<div class="empty-message">No items sold yet</div>';
            return;
        }

        sortedItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'top-item';
            div.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="item-name">${item.name}</span>
                <span class="item-sales">${item.count} sold</span>
                <span class="item-revenue">$${item.revenue.toFixed(2)}</span>
                <span class="badge-sales">${item.count > 5 ? '🔥 Popular' : '⭐'}</span>
            `;
            listContainer.appendChild(div);
        });
    }

    function renderSalesChart(orders, allItems) {
        const chart = document.getElementById('salesChart');
        if (!chart) return;

        const monthlySales = {};
        orders.forEach(order => {
            if (order.status === 'Cancelled') return;

            const date = new Date(order.ordered_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'short' });

            if (!monthlySales[monthKey]) {
                monthlySales[monthKey] = { month: monthName, sales: 0, revenue: 0 };
            }

            let hasSellerItem = false;
            order.item_ids.forEach(itemId => {
                const item = allItems.find(i => i.item_id === itemId);
                if (item && item.seller_id === currentUser.user_id) {
                    hasSellerItem = true;
                    monthlySales[monthKey].revenue += item.price;
                }
            });

            if (hasSellerItem) {
                monthlySales[monthKey].sales += 1;
            }
        });

        const sortedMonths = Object.keys(monthlySales).sort();

        if (sortedMonths.length === 0) {
            chart.innerHTML = '<div class="chart-placeholder">No sales data yet</div>';
            return;
        }

        const maxSales = Math.max(...sortedMonths.map(m => monthlySales[m].sales), 1);

        let chartHtml = '<div style="display:flex; align-items:flex-end; gap:1rem; height:150px; padding-top:1rem; width:100%;">';

        sortedMonths.forEach(monthKey => {
            const data = monthlySales[monthKey];
            const height = (data.sales / maxSales) * 100;
            chartHtml += `
                <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                    <div style="background:#2563eb; width:100%; max-width:40px; height:${height}%; min-height:4px; border-radius:4px 4px 0 0;"></div>
                    <span style="font-size:0.7rem; margin-top:0.3rem; color:#64748b;">${data.month}</span>
                    <span style="font-size:0.6rem; color:#2563eb; font-weight:600;">${data.sales}</span>
                </div>
            `;
        });

        chartHtml += '</div>';
        chart.innerHTML = chartHtml;
    }

    async function openProductModal(itemId) {
        const data = await fetchProductDetails(itemId);
        if (!data) return;

        const { item, reviews, avgRating } = data;
        currentDetailItemId = itemId;

        detailName.textContent = item.name;
        detailShop.textContent = item.shop_name || 'Unknown Shop';
        detailPrice.textContent = `$${(item.price || 0).toFixed(2)}`;
        detailShopName.textContent = item.shop_name || 'Unknown';

        detailRating.textContent = avgRating.toFixed(1);
        detailReviews.textContent = reviews.length;

        updateDetailButtons(itemId);
        renderProductReviews(reviews);

        productModal.style.display = 'flex';
    }

    function updateDetailButtons(itemId) {
        const isInCart = cart.items?.some(c => c.item_id === itemId) || false;
        detailAddToCart.textContent = isInCart ? '✅ Already in Cart' : '🛒 Add to Cart';
        detailAddToCart.disabled = isInCart;
        detailAddToCart.className = isInCart ? 'btn btn-success' : 'btn btn-primary';

        const isFavorite = favorites.some(f => f.item_id === itemId);
        detailFavorite.textContent = isFavorite ? '❤️ Remove from Favorites' : '♡ Add to Favorites';
        detailFavorite.className = isFavorite ? 'btn btn-danger' : 'btn btn-outline';
    }

    function renderProductReviews(reviews) {
        detailReviewsList.innerHTML = '';
        if (!reviews || reviews.length === 0) {
            detailReviewsList.innerHTML = '<div class="empty-message">No reviews yet</div>';
            return;
        }
        reviews.forEach(review => {
            const div = document.createElement('div');
            div.className = 'review-item';
            const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

            const isAuthor = currentUser && review.user_id === currentUser.user_id;

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                    <div style="flex:1;">
                        <div>
                            <span class="review-author">${review.author || 'User'}</span>
                            <span class="review-rating">${stars}</span>
                        </div>
                        <div class="review-text">${review.body}</div>
                        <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.3rem;">
                            ${new Date(review.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    ${isAuthor ? `
                        <button class="btn btn-danger btn-sm delete-review-btn" 
                                data-review-id="${review.review_id}" 
                                data-item-id="${review.item_id}"
                                style="flex-shrink:0; width:auto; padding:0.2rem 0.6rem; font-size:0.75rem; margin-left:0.5rem;">
                            ✕ Delete
                        </button>
                    ` : ''}
                </div>
            `;
            detailReviewsList.appendChild(div);
        });

        detailReviewsList.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reviewId = Number(btn.dataset.reviewId);
                const itemId = Number(btn.dataset.itemId);

                if (!confirm('Are you sure you want to delete this review?')) return;

                try {
                    await deleteReview(reviewId, currentUser.user_id, itemId);
                    showNotification('Review deleted successfully', 'success');

                    const data = await fetchProductDetails(itemId);
                    if (data) {
                        renderProductReviews(data.reviews);
                        detailRating.textContent = data.avgRating.toFixed(1);
                        detailReviews.textContent = data.reviews.length;
                    }
                } catch (err) {
                    showNotification(err.message, 'error');
                }
            });
        });
    }

    function renderItems() {
        itemGrid.innerHTML = '';
        if (!items || items.length === 0) {
            itemGrid.innerHTML = '<div class="empty-message">No items available</div>';
            return;
        }
        items.forEach(item => {
            const isFavorite = favorites.some(f => f.item_id === item.item_id);
            const isInCart = cart.items?.some(c => c.item_id === item.item_id) || false;
            const shopName = item.shop_name || 'Unknown Shop';
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="product-emoji">📦</div>
                <div class="product-title">${item.name}</div>
                <div class="product-price">$${(item.price || 0).toFixed(2)}</div>
                <div class="product-shop">🏪 ${shopName}</div>
                <div class="product-actions">
                    ${isInCart ? 
                        `<button class="btn btn-success" data-id="${item.item_id}" data-action="go-to-cart">🛒 Go to Cart</button>` :
                        `<button class="btn" data-id="${item.item_id}" data-action="add-to-cart">Add to Cart</button>`
                    }
                    <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'} btn-sm" 
                            data-id="${item.item_id}" 
                            data-action="favorite">
                        ${isFavorite ? '❤️' : '♡'}
                    </button>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn')) return;
                openProductModal(item.item_id);
            });
            itemGrid.appendChild(card);
        });
        itemGrid.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.dataset.id);
                const action = btn.dataset.action;
                if (action === 'favorite') toggleFavorite(id);
                else if (action === 'add-to-cart') addToCart(id);
                else if (action === 'go-to-cart') switchTab('cart');
            });
        });
    }

    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (!cart || !cart.items || cart.items.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-message">Your cart is empty</div>';
            cartTotal.innerHTML = '';
            document.getElementById('selectedTotal').style.display = 'none';
            checkoutBtn.style.display = 'none';
            selectAllBtn.style.display = 'none';
            selectedCartItems.clear();
            return;
        }

        if (selectedCartItems.size === 0 && !window._userInteractedWithCart) {
            cart.items.forEach(item => selectedCartItems.add(item.item_id));
        }

        let total = 0;
        let selectedTotal = 0;
        const allSelected = cart.items.length > 0 && cart.items.every(item => selectedCartItems.has(item.item_id));

        cart.items.forEach(item => {
            total += item.item_price * item.quantity;
            const isChecked = selectedCartItems.has(item.item_id);
            if (isChecked) {
                selectedTotal += item.item_price * item.quantity;
            }

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.5rem; flex:1; flex-wrap:wrap;">
                    <input type="checkbox" class="cart-select" data-id="${item.item_id}" ${isChecked ? 'checked' : ''}>
                    <span><strong>${item.item_name}</strong></span>
                    <span style="color:#64748b;">× ${item.quantity}</span>
                    <span style="color:#334155;">$${(item.item_price * item.quantity).toFixed(2)}</span>
                </div>
                <div style="display:flex; gap:0.4rem;">
                    <button class="btn btn-outline btn-sm" data-action="remove-one" data-id="${item.item_id}">−</button>
                    <button class="btn btn-outline btn-sm" data-action="add-one" data-id="${item.item_id}">+</button>
                    <button class="btn btn-danger btn-sm" data-action="remove-all" data-id="${item.item_id}">✕</button>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });

        cartItemsContainer.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const id = Number(btn.dataset.id);
                if (action === 'add-one') addOneToCart(id);
                else if (action === 'remove-one') removeOneFromCart(id);
                else if (action === 'remove-all') removeAllFromCart(id);
            });
        });

        cartItemsContainer.querySelectorAll('.cart-select').forEach(cb => {
            cb.addEventListener('change', () => {
                window._userInteractedWithCart = true;
                const id = Number(cb.dataset.id);
                if (cb.checked) {
                    selectedCartItems.add(id);
                } else {
                    selectedCartItems.delete(id);
                }
                updateSelectedTotal();
            });
        });

        cartTotal.innerHTML = `<span class="summary">Total: $${total.toFixed(2)}</span>`;

        if (cart.items.length > 0) {
            selectAllBtn.style.display = 'inline-block';
            selectAllBtn.textContent = allSelected ? '❌ Deselect All' : '✅ Select All';
            checkoutBtn.style.display = 'inline-block';
            document.getElementById('selectedTotal').style.display = 'block';
            document.getElementById('selectedTotalAmount').textContent = selectedTotal.toFixed(2);
        } else {
            selectAllBtn.style.display = 'none';
            checkoutBtn.style.display = 'none';
            document.getElementById('selectedTotal').style.display = 'none';
        }
    }
    function renderFavorites() {
        favoritesContainer.innerHTML = '';
        if (!favorites || favorites.length === 0) {
            favoritesContainer.innerHTML = '<div class="empty-message">No favorites yet 💔</div>';
            return;
        }
        favorites.forEach(item => {
            const div = document.createElement('div');
            div.className = 'favorite-item';
            div.innerHTML = `
                <span><strong>${item.name}</strong> — $${(item.price || 0).toFixed(2)}</span>
                <span class="heart" data-id="${item.item_id}">❤️</span>
            `;
            favoritesContainer.appendChild(div);
        });
        favoritesContainer.querySelectorAll('.heart').forEach(el => {
            el.addEventListener('click', () => {
                const id = Number(el.dataset.id);
                toggleFavorite(id);
            });
        });
    }

    function updateBadge() {
        const count = cart?.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
        cartCountBadge.textContent = count;
        cartBadge.style.display = currentUser ? 'inline-flex' : 'none';
    }

    function updateProfileUI() {
        if (!currentUser) return;
        const initials = currentUser.username.substring(0, 2).toUpperCase();
        profileAvatar.textContent = initials;
        profileNameShort.textContent = currentUser.username;
        dropdownUsername.textContent = currentUser.username;
        dropdownUserType.textContent = currentUser.seller ? `🛒 ${currentUser.shop_name || 'Seller'}` : '👤 Buyer';

        profileUsername.textContent = currentUser.username;
        profileType.textContent = currentUser.seller ? `🛒 ${currentUser.shop_name || 'Seller'}` : '👤 Buyer';
        profileSince.textContent = `Member since: ${new Date(currentUser.date_registration).toLocaleDateString()}`;

        const isSeller = currentUser.seller;
        document.querySelectorAll('.seller-only').forEach(el => {
            el.style.display = isSeller ? 'block' : 'none';
        });
        addItemBtn.style.display = isSeller ? 'inline-block' : 'none';

        if (isSeller) {
            document.querySelector('.tab-btn[data-tab="stats"]').style.display = 'block';
        }
    }

    function showAuthMessage(el, type, msg) {
        el.className = `auth-message ${type}`;
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }

    async function handleRegister() {
        const username = registerUsername.value.trim();
        const password = registerPassword.value.trim();
        const seller = registerSeller.value;
        const shopName = registerShopName.value.trim();

        if (!username || !password) {
            showAuthMessage(registerMessage, 'error', 'Please fill all fields');
            return;
        }

        if (seller === 'true' && !shopName) {
            showAuthMessage(registerMessage, 'error', 'Please enter your shop name');
            return;
        }

        try {
            await register(username, password, seller, shopName);
            showAuthMessage(registerMessage, 'success', 'Registration successful! Please login.');
            showNotification('Account created successfully! 🎉', 'success');
            registerUsername.value = '';
            registerPassword.value = '';
            registerShopName.value = '';
            document.querySelector('.auth-tab[data-auth="login"]').click();
        } catch (err) {
            showAuthMessage(registerMessage, 'error', err.message);
            showNotification(err.message, 'error');
        }
    }

    async function handleLogin() {
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();

        if (!username || !password) {
            showAuthMessage(loginMessage, 'error', 'Please fill all fields');
            return;
        }

        try {
            const user = await login(username, password);
            currentUser = user;

            showAuthMessage(loginMessage, 'success', `Welcome, ${user.username}!`);
            showNotification(`Welcome back, ${user.username}! 👋`, 'success');

            authSection.style.display = 'none';
            mainContent.style.display = 'block';
            profileDropdown.style.display = 'inline-block';
            cartBadge.style.display = 'inline-flex';

            updateProfileUI();

            await Promise.all([
                fetchItems(),
                fetchCart(),
                fetchFavorites(),
                fetchOrders(),
                fetchStats()
            ]);

            loginUsername.value = '';
            loginPassword.value = '';

            switchTab('items');
        } catch (err) {
            showAuthMessage(loginMessage, 'error', err.message);
            showNotification(err.message, 'error');
        }
    }

    function handleLogout() {
        currentUser = null;
        cart = { items: [], total: 0, user_id: 0, cart_id: 0 };
        items = [];
        favorites = [];
        selectedCartItems.clear();

        authSection.style.display = 'block';
        mainContent.style.display = 'none';
        profileDropdown.style.display = 'none';
        cartBadge.style.display = 'none';
        cartCountBadge.textContent = '0';

        renderItems();
        renderCart();
        renderFavorites();
        showNotification('Logged out successfully 👋', 'info');
    }

    async function handleChangeUsername() {
        const newName = newUsername.value.trim();
        const password = editPassword.value.trim();

        if (!newName || !password) {
            showAuthMessage(profileMessage, 'error', 'Please fill all fields');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/login/change-name`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_username: currentUser.username,
                    password,
                    new_username: newName
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to change username');
            }
            const updated = await res.json();
            currentUser.username = updated.username;
            updateProfileUI();
            showAuthMessage(profileMessage, 'success', 'Username updated successfully!');
            showNotification('Username updated successfully!', 'success');
            newUsername.value = '';
            editPassword.value = '';
            profileEditForm.style.display = 'none';
        } catch (err) {
            showAuthMessage(profileMessage, 'error', err.message);
            showNotification(err.message, 'error');
        }
    }

    async function handleDeleteAccount() {
        const password = prompt('Enter your password to confirm account deletion:');
        if (!password) return;

        if (!confirm('Are you sure you want to delete your account? This cannot be undone!')) return;

        try {
            const res = await fetch(`${API_BASE}/login/delete-acc`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.user_id, password }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to delete account');
            }
            showNotification('Account deleted successfully', 'success');
            setTimeout(handleLogout, 1500);
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    function showAddItemModal() {
        addItemModal.style.display = 'flex';
        newItemName.value = '';
        newItemPrice.value = '';
        itemMessage.style.display = 'none';
    }

    function hideAddItemModal() {
        addItemModal.style.display = 'none';
    }

    async function handleCreateItem() {
        const name = newItemName.value.trim();
        const price = parseFloat(newItemPrice.value);

        if (!name || isNaN(price) || price <= 0) {
            showAuthMessage(itemMessage, 'error', 'Please enter valid name and price');
            return;
        }

        try {
            await createItem(name, price);
            showAuthMessage(itemMessage, 'success', 'Item created successfully!');
            showNotification('Item created successfully! 🎉', 'success');
            setTimeout(() => {
                hideAddItemModal();
                fetchItems();
            }, 1000);
        } catch (err) {
            showAuthMessage(itemMessage, 'error', err.message);
            showNotification(err.message, 'error');
        }
    }

    async function handleSubmitReview() {
        if (!currentUser) {
            showModalMessage(reviewMessage, 'error', 'Please login first');
            return;
        }

        const rating = reviewRating.value;
        const body = reviewBody.value.trim();
        const author = currentUser.username || 'User';

        if (!body) {
            showModalMessage(reviewMessage, 'error', 'Please write a review');
            return;
        }

        try {
            await submitReview(currentDetailItemId, currentUser.user_id, rating, body, author);
            showModalMessage(reviewMessage, 'success', 'Review submitted successfully!');
            reviewBody.value = '';

            const data = await fetchProductDetails(currentDetailItemId);
            if (data) {
                renderProductReviews(data.reviews);
                detailRating.textContent = data.avgRating.toFixed(1);
                detailReviews.textContent = data.reviews.length;
            }
        } catch (err) {
            showModalMessage(reviewMessage, 'error', err.message);
        }
    }

    async function handleCheckout() {
        if (!currentUser) {
            showNotification('Please login first', 'error');
            return;
        }

        if (selectedCartItems.size === 0) {
            showNotification('Please select items to checkout', 'error');
            return;
        }

        const itemIds = Array.from(selectedCartItems);
        const selectedItems = cart.items.filter(item => selectedCartItems.has(item.item_id));
        const total = selectedItems.reduce((sum, item) => sum + item.item_price * item.quantity, 0);

        if (!confirm(`Checkout ${selectedItems.length} item(s) for $${total.toFixed(2)}?`)) {
            return;
        }

        try {
            await makeOrder(currentUser.user_id, itemIds);
            showNotification('Order created successfully! 🎉', 'success');

            for (const itemId of itemIds) {
                await removeAllFromCart(itemId);
            }

            selectedCartItems.clear();
            await fetchCart();
            await fetchOrders();

            switchTab('orders');
        } catch (err) {
            showNotification(err.message, 'error');
        }
    }

    const tabButtons = document.querySelectorAll('.tab-btn');
    const panes = {
        items: document.getElementById('items'),
        cart: document.getElementById('cart'),
        orders: document.getElementById('orders'),
        favorites: document.getElementById('favorites'),
        stats: document.getElementById('stats'),
        profile: document.getElementById('profile'),
    };

    function switchTab(tabId) {
        tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        Object.keys(panes).forEach(key => {
            panes[key].classList.toggle('active', key === tabId);
        });
        if (tabId === 'cart') fetchCart();
        if (tabId === 'items') fetchItems();
        if (tabId === 'favorites') fetchFavorites();
        if (tabId === 'orders') fetchOrders();
        if (tabId === 'profile') updateProfileUI();
        if (tabId === 'stats' && currentUser?.seller) fetchStats();
    }

    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContent.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdownContent.classList.remove('show');
    });

    dropdownContent.querySelectorAll('.dropdown-item[data-tab]').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchTab(tab);
            dropdownContent.classList.remove('show');
        });
    });

    dropdownLogout.addEventListener('click', handleLogout);

    closeProductModal.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    detailAddToCart.addEventListener('click', async () => {
        if (!currentDetailItemId) return;
        await addToCart(currentDetailItemId);
        updateDetailButtons(currentDetailItemId);
    });

    detailFavorite.addEventListener('click', async () => {
        if (!currentDetailItemId) return;
        await toggleFavorite(currentDetailItemId);
        updateDetailButtons(currentDetailItemId);
    });

    submitReviewBtn.addEventListener('click', handleSubmitReview);

    selectAllBtn.addEventListener('click', toggleSelectAll);
    checkoutBtn.addEventListener('click', handleCheckout);

    loginBtn.addEventListener('click', handleLogin);
    loginPassword.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
    loginUsername.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });

    registerBtn.addEventListener('click', handleRegister);
    registerPassword.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleRegister(); });

    clearCartBtn.addEventListener('click', clearCart);
    cartBadge.addEventListener('click', () => switchTab('cart'));

    refreshItemsBtn.addEventListener('click', fetchItems);
    addItemBtn.addEventListener('click', showAddItemModal);

    editProfileBtn.addEventListener('click', () => {
        profileEditForm.style.display = profileEditForm.style.display === 'none' ? 'block' : 'none';
    });
    saveUsernameBtn.addEventListener('click', handleChangeUsername);
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);

    closeModalBtn.addEventListener('click', hideAddItemModal);
    addItemModal.addEventListener('click', (e) => {
        if (e.target === addItemModal) hideAddItemModal();
    });
    submitItemBtn.addEventListener('click', handleCreateItem);

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const form = tab.dataset.auth;
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(`${form}Form`).classList.add('active');
        });
    });

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    async function init() {
        const online = await checkHealth();
        if (online) {
            await fetchItems();
        }
        authSection.style.display = 'block';
        mainContent.style.display = 'none';
        profileDropdown.style.display = 'none';
        cartBadge.style.display = 'none';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.switchTab = switchTab;
    window.addToCart = addToCart;
    window.toggleFavorite = toggleFavorite;

})();
