/**
 * Christmas Gift Tracker
 * Main Application Logic
 */

// --- Data & Storage Management ---
const StorageManager = {
    KEY: 'christmas_gift_tracker_data_v1',
    save(data) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Storage save failed:", e);
            UIManager.showToast("Failed to save data!", "error");
        }
    },
    load() {
        try {
            const data = localStorage.getItem(this.KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Storage load failed:", e);
            return [];
        }
    }
};

const GiftTracker = {
    gifts: [],

    init() {
        this.gifts = StorageManager.load();

        // Seed sample data if empty for first-time experience
        if (this.gifts.length === 0) {
            this.gifts = [
                {
                    id: crypto.randomUUID(),
                    childName: "Timmy",
                    giftName: "Red Bicycle",
                    price: 120.50,
                    status: "purchased",
                    dateAdded: Date.now()
                },
                {
                    id: crypto.randomUUID(),
                    childName: "Sarah",
                    giftName: "Doll House",
                    price: 85.00,
                    status: "pending",
                    dateAdded: Date.now() - 100000
                }
            ];
            StorageManager.save(this.gifts);
        }
    },

    addGift(gift) {
        const newGift = {
            id: crypto.randomUUID(),
            ...gift,
            dateAdded: Date.now()
        };
        this.gifts.push(newGift);
        StorageManager.save(this.gifts);
        return newGift;
    },

    updateGift(id, updatedFields) {
        const index = this.gifts.findIndex(g => g.id === id);
        if (index !== -1) {
            this.gifts[index] = { ...this.gifts[index], ...updatedFields };
            StorageManager.save(this.gifts);
            return true;
        }
        return false;
    },

    deleteGift(id) {
        this.gifts = this.gifts.filter(g => g.id !== id);
        StorageManager.save(this.gifts);
    },

    getStats() {
        const totalSpent = this.gifts
            .filter(g => g.status === 'purchased')
            .reduce((sum, g) => sum + Number(g.price), 0);

        const totalGifts = this.gifts.length;
        const avgPrice = totalGifts > 0
            ? this.gifts.reduce((sum, g) => sum + Number(g.price), 0) / totalGifts
            : 0;

        // Group by Child for Chart
        const spendingByChild = this.gifts.reduce((acc, gift) => {
            if (!acc[gift.childName]) acc[gift.childName] = 0;
            if (gift.status === 'purchased') {
                acc[gift.childName] += Number(gift.price);
            }
            return acc;
        }, {});

        return { totalSpent, totalGifts, avgPrice, spendingByChild };
    },

    getAllChildren() {
        return [...new Set(this.gifts.map(g => g.childName))];
    }
};

// --- UI Management ---
const UIManager = {
    chartInstance: null,

    init() {
        // Cache DOM elements
        this.form = document.getElementById('gift-form');
        this.listContainer = document.getElementById('gift-list');
        this.totalSpentEl = document.getElementById('total-spent');
        this.totalGiftsEl = document.getElementById('total-gifts');
        this.avgPriceEl = document.getElementById('avg-price');
        this.filterChild = document.getElementById('filter-child');
        this.searchInput = document.getElementById('search-input');
        this.sortOrder = document.getElementById('sort-order');
        this.editIdInput = document.getElementById('gift-id');
        this.cancelEditBtn = document.getElementById('cancel-edit');
        this.msgEl = document.getElementById('festive-message');

        this.bindEvents();
        this.render();
    },

    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        this.listContainer.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const id = e.target.closest('.gift-card').dataset.id;
                this.handleDelete(id);
            }
            if (e.target.closest('.edit-btn')) {
                const id = e.target.closest('.gift-card').dataset.id;
                this.handleEditStart(id);
            }
        });

        this.filterChild.addEventListener('change', () => this.renderList());
        this.searchInput.addEventListener('input', this.debounce(() => this.renderList(), 300));
        this.sortOrder.addEventListener('change', () => this.renderList());

        this.cancelEditBtn.addEventListener('click', () => this.resetForm());
    },

    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    handleFormSubmit() {
        const id = this.editIdInput.value;
        const giftData = {
            childName: document.getElementById('child-name').value.trim(),
            giftName: document.getElementById('gift-name').value.trim(),
            price: parseFloat(document.getElementById('gift-price').value),
            status: document.getElementById('gift-status').value
        };

        if (id) {
            GiftTracker.updateGift(id, giftData);
            this.showToast("Gift Updated! 🎁");
        } else {
            GiftTracker.addGift(giftData);
            this.showToast("Gift Added! 🎅");
            FestiveFeatures.triggerConfetti();
        }

        this.resetForm();
        this.render();
    },

    handleDelete(id) {
        if (confirm("Are you sure you want to remove this gift? 🥺")) {
            GiftTracker.deleteGift(id);
            this.showToast("Gift Removed 🗑️");
            this.render();
        }
    },

    handleEditStart(id) {
        const gift = GiftTracker.gifts.find(g => g.id === id);
        if (!gift) return;

        this.editIdInput.value = gift.id;
        document.getElementById('child-name').value = gift.childName;
        document.getElementById('gift-name').value = gift.giftName;
        document.getElementById('gift-price').value = gift.price;
        document.getElementById('gift-status').value = gift.status;

        this.form.querySelector('button[type="submit"]').textContent = "Update Gift 🔄";
        this.cancelEditBtn.classList.remove('hidden');

        this.form.scrollIntoView({ behavior: 'smooth' });
    },

    resetForm() {
        this.form.reset();
        this.editIdInput.value = '';
        this.form.querySelector('button[type="submit"]').textContent = "Add Gift 🎁";
        this.cancelEditBtn.classList.add('hidden');
    },

    render() {
        this.renderList();
        this.updateStats();
        this.updateFilters();
    },

    renderList() {
        let gifts = [...GiftTracker.gifts];

        // Filter
        const childFilter = this.filterChild.value;
        const search = this.searchInput.value.toLowerCase();

        if (childFilter !== 'all') {
            gifts = gifts.filter(g => g.childName === childFilter);
        }
        if (search) {
            gifts = gifts.filter(g =>
                g.childName.toLowerCase().includes(search) ||
                g.giftName.toLowerCase().includes(search)
            );
        }

        // Sort
        const sort = this.sortOrder.value;
        gifts.sort((a, b) => {
            if (sort === 'date-desc') return b.dateAdded - a.dateAdded;
            if (sort === 'price-asc') return a.price - b.price;
            if (sort === 'price-desc') return b.price - a.price;
            return 0;
        });

        this.listContainer.innerHTML = '';

        if (gifts.length === 0) {
            this.listContainer.innerHTML = '<p style="text-align:center; grid-column:1/-1;">No gifts found! Time to go shopping? 🛍️</p>';
            return;
        }

        gifts.forEach(gift => {
            const el = document.createElement('div');
            el.className = `gift-card status-${gift.status}`;
            el.dataset.id = gift.id; // Corrected: Using dataset.id
            el.innerHTML = `
                <h3>${this.escape(gift.giftName)}</h3>
                <p><strong>For:</strong> ${this.escape(gift.childName)}</p>
                <p><strong>Price:</strong> $${gift.price.toFixed(2)}</p>
                <p><strong>Status:</strong> ${gift.status === 'purchased' ? '✅ Purchased' : '🤔 Pending'}</p>
                <div class="gift-actions">
                    <button class="icon-btn edit-btn" aria-label="Edit">✏️</button>
                    <button class="icon-btn delete-btn" aria-label="Delete">🗑️</button>
                </div>
            `;
            this.listContainer.appendChild(el);
        });
    },

    escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    updateStats() {
        const stats = GiftTracker.getStats();
        this.totalSpentEl.textContent = `$${stats.totalSpent.toFixed(2)}`;
        this.totalGiftsEl.textContent = stats.totalGifts;
        this.avgPriceEl.textContent = `$${stats.avgPrice.toFixed(2)}`;

        this.updateChart(stats.spendingByChild);
    },

    updateChart(data) {
        const ctx = document.getElementById('spendingChart').getContext('2d');
        const labels = Object.keys(data);
        const values = Object.values(data);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Spent ($)',
                    data: values,
                    backgroundColor: 'rgba(212, 36, 38, 0.6)',
                    borderColor: 'rgba(212, 36, 38, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    updateFilters() {
        const children = GiftTracker.getAllChildren();
        const currentVal = this.filterChild.value;

        // Keep "All Children" and rebuild others
        this.filterChild.innerHTML = '<option value="all">All Children</option>';
        children.forEach(child => {
            const option = document.createElement('option');
            option.value = child;
            option.textContent = child;
            if (child === currentVal) option.selected = true;
            this.filterChild.appendChild(option);
        });
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#165B33' : '#D42426'};
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            animation: fadeInOut 3s forwards;
            z-index: 1000;
        `;

        // Add minimal animation styles dynamically if not present
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.innerHTML = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, 20px); }
                    10% { opacity: 1; transform: translate(-50%, 0); }
                    90% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -20px); }
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// --- Festive Features ---
const FestiveFeatures = {
    init() {
        this.initSnow();
        this.initCountdown();
        this.initMusic();
        this.initRandomMessages();
    },

    initSnow() {
        const container = document.getElementById('snow-container');
        const snowflakeCount = 50;

        for (let i = 0; i < snowflakeCount; i++) {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            flake.textContent = '❄';
            flake.style.left = Math.random() * 100 + 'vw';
            flake.style.animationDuration = (Math.random() * 3 + 2) + 's';
            flake.style.opacity = Math.random();
            flake.style.fontSize = (Math.random() * 10 + 10) + 'px';

            // CSS Animation for falling
            if (!document.getElementById('snow-style')) {
                const style = document.createElement('style');
                style.id = 'snow-style';
                style.textContent = `
                   @keyframes fall {
                       0% { transform: translateY(-10px) rotate(0deg); }
                       100% { transform: translateY(100vh) rotate(360deg); }
                   }
                   .snowflake {
                       position: absolute;
                       top: -10px;
                       animation-name: fall;
                       animation-timing-function: linear;
                       animation-iteration-count: infinite;
                   }
               `;
                document.head.appendChild(style);
            }

            container.appendChild(flake);
        }
    },

    initCountdown() {
        const el = document.getElementById('countdown');

        const update = () => {
            const now = new Date();
            const currentYear = now.getFullYear();
            let xmas = new Date(currentYear, 11, 25); // Dec 25

            if (now > xmas && now.getDate() !== 25) {
                xmas.setFullYear(currentYear + 1);
            }

            const diff = xmas - now;

            if (now.getMonth() === 11 && now.getDate() === 25) {
                el.textContent = "🎄 MERRY CHRISTMAS! 🎄";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            el.textContent = `${days}d ${hours}h ${minutes}m until Christmas!`;
        };

        update();
        setInterval(update, 60000); // Update every minute
    },

    initMusic() {
        // Simple public domain jingle or placeholder
        const audio = new Audio('https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/win.ogg'); // Using a reliable placeholder short loop for now, ideally replace with proper Xmas track
        audio.loop = true;

        const toggleBtn = document.getElementById('music-toggle');
        const volSlider = document.getElementById('volume-control');

        let isPlaying = false;

        toggleBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
                toggleBtn.textContent = '🔇';
            } else {
                audio.play().catch(e => console.log("Audio play blocked", e));
                toggleBtn.textContent = '🔊';
            }
            isPlaying = !isPlaying;
        });

        volSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value;
        });
    },

    initRandomMessages() {
        const messages = [
            "Ho Ho Ho! 🎅",
            "Naughty or Nice? 📜",
            "Jingle All The Way! 🔔",
            "Snow is falling! ❄️",
            "Wrap it up! 🎁"
        ];
        const el = document.getElementById('festive-message');

        setInterval(() => {
            el.style.opacity = 0;
            setTimeout(() => {
                el.textContent = messages[Math.floor(Math.random() * messages.length)];
                el.style.opacity = 1;
            }, 500);
        }, 10000);
    },

    triggerConfetti() {
        // Simple confetti effect using existing snowflakes logic or new particles
        // For simplicity, we'll just show a toast, but here's a placeholder for more.
        console.log("Confetti pop!");
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    GiftTracker.init();
    UIManager.init();
    FestiveFeatures.init();
});
