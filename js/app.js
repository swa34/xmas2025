class Storage {
    constructor(key = 'xmas_gift_tracker_data') {
        this.key = key;
    }

    get() {
        const data = localStorage.getItem(this.key);
        if (!data) return this.initialData();
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Data corruption, resetting', e);
            return this.initialData();
        }
    }

    save(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
    }

    initialData() {
        return {
            children: [],
            settings: {
                snowEnabled: true
            }
        };
    }
}

class App {
    constructor() {
        this.storage = new Storage();
        this.data = this.storage.get();
        // DOM Elements
        this.elements = {
            grid: document.getElementById('children-grid'),
            childModal: document.getElementById('child-modal'),
            giftModal: document.getElementById('gift-modal'),
            childForm: document.getElementById('child-form'),
            giftForm: document.getElementById('gift-form'),
            addChildBtn: document.getElementById('add-child-btn'),
            closeButtons: document.querySelectorAll('.close-modal'),
            snowContainer: document.querySelector('.snow-container'),
            snowToggle: document.getElementById('toggle-snow')
        };

        this.currentChildId = null; // For gift modal context

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
        if (this.data.settings.snowEnabled) {
            this.startSnow();
        }
    }

    save() {
        this.storage.save(this.data);
        this.render();
    }

    setupEventListeners() {
        // Modal toggles
        this.elements.addChildBtn.addEventListener('click', () => this.openModal('child'));
        this.elements.closeButtons.forEach(btn =>
            btn.addEventListener('click', () => this.closeModals())
        );

        // Child Form
        this.elements.childForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addChild();
        });

        // Gift Form
        this.elements.giftForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGift();
        });

        // Global clicks (delegation for dynamic elements)
        this.elements.grid.addEventListener('click', (e) => {
            const target = e.target;

            // Delete Child
            if (target.closest('.delete-child-btn')) {
                const childId = target.closest('.child-card').dataset.id;
                this.deleteChild(childId);
            }

            // Open Gift Modal
            if (target.closest('.add-gift-btn')) {
                const childId = target.closest('.child-card').dataset.id;
                this.currentChildId = childId;
                this.openModal('gift');
            }

            // Toggle Gift Status
            if (target.closest('.gift-status-btn')) {
                const btn = target.closest('.gift-status-btn');
                const giftId = btn.dataset.giftId;
                const childId = btn.closest('.child-card').dataset.id;
                this.toggleGiftStatus(childId, giftId);
            }
        });

        // Outside click close modal
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Snow Toggle
        this.elements.snowToggle.addEventListener('click', () => {
            this.data.settings.snowEnabled = !this.data.settings.snowEnabled;
            this.save();
            if (this.data.settings.snowEnabled) {
                this.startSnow();
            } else {
                this.stopSnow();
            }
        });
    }

    // --- Logic ---

    addChild() {
        const name = document.getElementById('child-name').value;
        const budget = parseFloat(document.getElementById('child-budget').value);

        const newChild = {
            id: crypto.randomUUID(),
            name,
            budget,
            gifts: []
        };

        this.data.children.push(newChild);
        this.save();
        this.closeModals();
        this.elements.childForm.reset();
    }

    addGift() {
        if (!this.currentChildId) return;

        const name = document.getElementById('gift-name').value;
        const price = parseFloat(document.getElementById('gift-price').value);

        const newGift = {
            id: crypto.randomUUID(),
            name,
            price,
            status: 'idea' // idea -> purchased -> wrapped
        };

        const child = this.data.children.find(c => c.id === this.currentChildId);
        if (child) {
            child.gifts.push(newGift);
            this.save();

            // Locate the new gift element to animate it
            setTimeout(() => {
                const childCard = document.querySelector(`.child-card[data-id="${this.currentChildId}"]`);
                if (childCard) {
                    const gifts = childCard.querySelectorAll('.gift-item');
                    const lastGift = gifts[gifts.length - 1];
                    if (lastGift) {
                        lastGift.classList.add('gift-added');
                        setTimeout(() => lastGift.classList.remove('gift-added'), 1000);
                    }
                }
            }, 0);
        }

        this.closeModals();
        this.elements.giftForm.reset();
    }

    deleteChild(id) {
        if (confirm('Are you sure?')) {
            this.data.children = this.data.children.filter(c => c.id !== id);
            this.save();
        }
    }

    toggleGiftStatus(childId, giftId) {
        const child = this.data.children.find(c => c.id === childId);
        const gift = child.gifts.find(g => g.id === giftId);
        if (gift) {
            const statuses = ['idea', 'purchased', 'wrapped'];
            const idx = statuses.indexOf(gift.status);
            gift.status = statuses[(idx + 1) % statuses.length];
            this.save();
        }
    }

    // --- DOM Methods ---

    openModal(type) {
        if (type === 'child') {
            this.elements.childModal.classList.remove('hidden');
        } else if (type === 'gift') {
            document.getElementById('gift-child-id').value = this.currentChildId;
            this.elements.giftModal.classList.remove('hidden');
        }
    }

    closeModals() {
        this.elements.childModal.classList.add('hidden');
        this.elements.giftModal.classList.add('hidden');
        this.currentChildId = null;
    }

    render() {
        const grid = this.elements.grid;

        if (this.data.children.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-gift fa-3x"></i>
                    <p>No children added yet. Start by adding one!</p>
                </div>`;
            return;
        }

        grid.innerHTML = this.data.children.map(child => {
            const totalSpent = child.gifts.reduce((sum, g) => sum + g.price, 0);
            const progress = (totalSpent / child.budget) * 100;
            const progressColor = progress > 100 ? '#D42426' : '#165B33';

            return `
            <div class="child-card" data-id="${child.id}">
                <div class="child-header">
                    <h3 class="child-name">${this.escape(child.name)}</h3>
                    <button class="icon-btn delete-child-btn" style="width:30px;height:30px;font-size:0.8rem"><i class="fas fa-trash"></i></button>
                </div>
                
                <div class="budget-info">
                    <span>Spent: $${totalSpent.toFixed(2)}</span>
                    <span>Budget: $${child.budget.toFixed(2)}</span>
                </div>
                
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%; background-color: ${progressColor}"></div>
                </div>

                <ul class="gifts-list">
                    ${child.gifts.map(gift => `
                        <li class="gift-item" data-child-id="${child.id}" data-gift-id="${gift.id}">
                            <div class="gift-details">
                                <button class="gift-status-btn ${gift.status !== 'idea' ? 'checked' : ''}" data-gift-id="${gift.id}">
                                    <i class="fas ${gift.status === 'wrapped' ? 'fa-gift' : (gift.status === 'purchased' ? 'fa-check-circle' : 'fa-circle')}"></i>
                                </button>
                                <span>${this.escape(gift.name)}</span>
                            </div>
                            <span class="gift-price">$${gift.price.toFixed(2)}</span>
                        </li>
                    `).join('')}
                </ul>

                <button class="add-gift-btn">
                    <i class="fas fa-plus"></i> Add Gift
                </button>
            </div>
            `;
        }).join('');
    }

    escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    startSnow() {
        if (this.snowInterval) clearInterval(this.snowInterval);
        this.elements.snowContainer.innerHTML = '';
        this.snowInterval = setInterval(() => {
            const snowflake = document.createElement('div');
            snowflake.classList.add('snowflake');
            snowflake.innerHTML = '❄';
            snowflake.style.left = Math.random() * 100 + 'vw';
            snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
            snowflake.style.opacity = Math.random();
            this.elements.snowContainer.appendChild(snowflake);

            setTimeout(() => {
                snowflake.remove();
            }, 5000);
        }, 200);
    }

    stopSnow() {
        clearInterval(this.snowInterval);
        this.elements.snowContainer.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
