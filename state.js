/* ==========================================================================
   PocketPe - Central Application State
   Reactive Observable State with LocalStorage Persistence
   ========================================================================== */

const STORAGE_KEY = 'pocketpe_app_state_v1';

const DEFAULT_WALLETS = [
  {
    id: 'w-food',
    name: 'Food & Dining',
    category: 'food',
    icon: '🍔',
    balance: 2000,
    targetAmount: 2500,
    monthlyLimit: 3000,
    splitPercent: 25,
    color: '#f97316',
    autoAddFreq: 'incoming'
  },
  {
    id: 'w-transport',
    name: 'Transport & Fuel',
    category: 'transport',
    icon: '🚗',
    balance: 800,
    targetAmount: 1000,
    monthlyLimit: 1500,
    splitPercent: 10,
    color: '#06b6d4',
    autoAddFreq: 'incoming'
  },
  {
    id: 'w-savings',
    name: 'Long-term Savings',
    category: 'savings',
    icon: '💰',
    balance: 2500,
    targetAmount: 5000,
    monthlyLimit: null,
    splitPercent: 20,
    color: '#10b981',
    autoAddFreq: 'incoming'
  },
  {
    id: 'w-college',
    name: 'College & Books',
    category: 'college',
    icon: '🎓',
    balance: 1500,
    targetAmount: 2000,
    monthlyLimit: 2500,
    splitPercent: 15,
    color: '#8b5cf6',
    autoAddFreq: 'incoming'
  },
  {
    id: 'w-friends',
    name: 'Friends & Outings',
    category: 'friends',
    icon: '🤝',
    balance: 1000,
    targetAmount: 1500,
    monthlyLimit: 2000,
    splitPercent: 10,
    color: '#ec4899',
    autoAddFreq: 'incoming'
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-1',
    merchantName: 'ABC Restaurant',
    amount: 280,
    category: 'food',
    walletId: 'w-food',
    walletName: 'Food & Dining',
    date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    type: 'debit',
    notes: 'Lunch with colleagues'
  },
  {
    id: 'tx-2',
    merchantName: 'City Bus Metro',
    amount: 40,
    category: 'transport',
    walletId: 'w-transport',
    walletName: 'Transport & Fuel',
    date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    type: 'debit',
    notes: 'Transit commute'
  },
  {
    id: 'tx-3',
    merchantName: 'College Canteen',
    amount: 120,
    category: 'food',
    walletId: 'w-food',
    walletName: 'Food & Dining',
    date: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    type: 'debit',
    notes: 'Evening tea & snacks'
  },
  {
    id: 'tx-4',
    merchantName: 'Sent to Friend (Rahul)',
    amount: 500,
    category: 'friends',
    walletId: 'w-friends',
    walletName: 'Friends & Outings',
    date: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
    type: 'debit',
    notes: 'Movie ticket split'
  },
  {
    id: 'tx-5',
    merchantName: 'Apollo Pharmacy',
    amount: 180,
    category: 'health',
    walletId: 'w-free', // paid from free money or general
    walletName: 'Free Money',
    date: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), // Yesterday
    type: 'debit',
    notes: 'First-aid & vitamins'
  },
  {
    id: 'tx-6',
    merchantName: 'Shell Fuel Station',
    amount: 450,
    category: 'transport',
    walletId: 'w-transport',
    walletName: 'Transport & Fuel',
    date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 2 days ago
    type: 'debit',
    notes: 'Vehicle petrol'
  }
];

class AppState {
  constructor() {
    this.listeners = [];
    this.data = this._loadInitialState();
  }

  _loadInitialState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage', e);
    }

    return {
      user: {
        name: 'Alex',
        greeting: 'Good morning'
      },
      // Free money allocation default percentage is 20% (so 25 + 10 + 20 + 15 + 10 + 20 = 100%)
      freeMoneySplitPercent: 20,
      freeMoneyBalance: 2200,
      wallets: DEFAULT_WALLETS,
      transactions: DEFAULT_TRANSACTIONS,
      merchantOverrides: {
        // user-learned categorization: { "Merchant Name": "category" }
      },
      settings: {
        theme: 'system', // 'system' | 'light' | 'dark'
        accent: 'emerald', // 'emerald' | 'indigo' | 'violet' | 'amber' | 'teal' | 'rose'
        soundEnabled: true,
        privacyMode: false,
        onboardingCompleted: true // set true so users can see full experience right away; can replay from settings
      }
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to persist state', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.data);
      } catch (err) {
        console.error('State subscriber error', err);
      }
    });
  }

  // --- Calculated Getters ---

  get allocatedBalance() {
    return this.data.wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  }

  get freeMoneyBalance() {
    return Number(this.data.freeMoneyBalance) || 0;
  }

  get totalBalance() {
    return this.allocatedBalance + this.freeMoneyBalance;
  }

  get wallets() {
    return this.data.wallets;
  }

  get transactions() {
    return this.data.transactions;
  }

  get settings() {
    return this.data.settings;
  }

  get merchantOverrides() {
    return this.data.merchantOverrides;
  }

  // --- Mutators ---

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
  }

  setFreeMoneyBalance(amount) {
    this.data.freeMoneyBalance = Math.max(0, Math.round(amount));
    this.save();
  }

  setFreeMoneySplitPercent(percent) {
    this.data.freeMoneySplitPercent = percent;
    this.save();
  }

  addWallet(walletData) {
    const newWallet = {
      id: 'w-' + Date.now(),
      name: walletData.name,
      category: walletData.category || 'custom',
      icon: walletData.icon || '💼',
      balance: Number(walletData.initialBalance || 0),
      targetAmount: walletData.targetAmount ? Number(walletData.targetAmount) : null,
      monthlyLimit: walletData.monthlyLimit ? Number(walletData.monthlyLimit) : null,
      splitPercent: Number(walletData.splitPercent || 0),
      color: walletData.color || '#10b981',
      autoAddFreq: walletData.autoAddFreq || 'incoming'
    };

    // If initial balance is funded from free money:
    if (newWallet.balance > 0) {
      this.data.freeMoneyBalance = Math.max(0, this.data.freeMoneyBalance - newWallet.balance);
    }

    this.data.wallets.push(newWallet);
    this.save();
    return newWallet;
  }

  updateWallet(walletId, updates) {
    const idx = this.data.wallets.findIndex(w => w.id === walletId);
    if (idx !== -1) {
      this.data.wallets[idx] = { ...this.data.wallets[idx], ...updates };
      this.save();
    }
  }

  deleteWallet(walletId) {
    const wallet = this.data.wallets.find(w => w.id === walletId);
    if (wallet) {
      // Reclaim remaining wallet funds into Free Money
      this.data.freeMoneyBalance += wallet.balance;
      this.data.wallets = this.data.wallets.filter(w => w.id !== walletId);
      this.save();
    }
  }

  addTransaction(tx) {
    const newTx = {
      id: 'tx-' + Date.now(),
      merchantName: tx.merchantName,
      amount: Number(tx.amount),
      category: tx.category || 'general',
      walletId: tx.walletId,
      walletName: tx.walletName,
      date: tx.date || new Date().toISOString(),
      type: tx.type || 'debit',
      notes: tx.notes || ''
    };
    this.data.transactions.unshift(newTx);
    this.save();
    return newTx;
  }

  setMerchantCategoryOverride(merchantName, category) {
    const cleanKey = merchantName.trim().toLowerCase();
    this.data.merchantOverrides[cleanKey] = category;
    this.save();
  }

  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this._loadInitialState();
    this.save();
  }
}

export const state = new AppState();
