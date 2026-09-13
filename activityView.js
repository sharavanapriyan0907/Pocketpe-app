/* ==========================================================================
   PocketPe - Activity Screen View & Transaction Timeline
   "Every payment clearly tagged to its purpose."
   ========================================================================== */

import { state } from '../core/state.js';
import { categorizationEngine } from '../core/categorizationEngine.js';
import { sound } from '../core/sound.js';

export function renderActivityView(container, navigateTo) {
  const allTxs = state.transactions;
  let activeCategoryFilter = 'all';
  let searchQuery = '';

  function groupTransactions(txs) {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 3600 * 1000;

    txs.forEach(t => {
      const txTime = new Date(t.date).getTime();
      if (txTime >= startOfToday) {
        today.push(t);
      } else if (txTime >= startOfYesterday) {
        yesterday.push(t);
      } else {
        earlier.push(t);
      }
    });

    return { today, yesterday, earlier };
  }

  function render() {
    let filtered = allTxs.filter(t => {
      const matchesCat = activeCategoryFilter === 'all' || t.category === activeCategoryFilter || (activeCategoryFilter === 'credit' && t.type === 'credit');
      const matchesSearch = !searchQuery || t.merchantName.toLowerCase().includes(searchQuery) || (t.notes && t.notes.toLowerCase().includes(searchQuery));
      return matchesCat && matchesSearch;
    });

    const groups = groupTransactions(filtered);

    container.innerHTML = `
      <div class="app-header">
        <div>
          <h1 class="user-title">Activity</h1>
          <div class="greeting-text">Spending history by purpose</div>
        </div>
      </div>

      <!-- Search Input -->
      <div style="margin-bottom: 12px;">
        <input type="text" id="tx-search-input" class="form-input" placeholder="🔍 Search payments or merchants..." value="${searchQuery}" style="height: 42px; font-size: 14px;" />
      </div>

      <!-- Filter Chips -->
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 8px; scrollbar-width: none;">
        <button class="filter-chip secondary-btn ${activeCategoryFilter === 'all' ? 'active-filter' : ''}" data-cat="all" style="height: 32px; font-size: 12px; width: auto; padding: 0 14px; border-radius: var(--radius-full); ${activeCategoryFilter === 'all' ? 'background: var(--text-primary); color: var(--bg-surface);' : ''}">
          All
        </button>
        <button class="filter-chip secondary-btn ${activeCategoryFilter === 'food' ? 'active-filter' : ''}" data-cat="food" style="height: 32px; font-size: 12px; width: auto; padding: 0 14px; border-radius: var(--radius-full); ${activeCategoryFilter === 'food' ? 'background: var(--text-primary); color: var(--bg-surface);' : ''}">
          🍔 Food
        </button>
        <button class="filter-chip secondary-btn ${activeCategoryFilter === 'transport' ? 'active-filter' : ''}" data-cat="transport" style="height: 32px; font-size: 12px; width: auto; padding: 0 14px; border-radius: var(--radius-full); ${activeCategoryFilter === 'transport' ? 'background: var(--text-primary); color: var(--bg-surface);' : ''}">
          🚗 Transport
        </button>
        <button class="filter-chip secondary-btn ${activeCategoryFilter === 'friends' ? 'active-filter' : ''}" data-cat="friends" style="height: 32px; font-size: 12px; width: auto; padding: 0 14px; border-radius: var(--radius-full); ${activeCategoryFilter === 'friends' ? 'background: var(--text-primary); color: var(--bg-surface);' : ''}">
          🤝 Friends
        </button>
        <button class="filter-chip secondary-btn ${activeCategoryFilter === 'credit' ? 'active-filter' : ''}" data-cat="credit" style="height: 32px; font-size: 12px; width: auto; padding: 0 14px; border-radius: var(--radius-full); ${activeCategoryFilter === 'credit' ? 'background: var(--text-primary); color: var(--bg-surface);' : ''}">
          📥 Received
        </button>
      </div>

      <!-- Transactions List -->
      <div class="activity-list">
        ${filtered.length === 0 ? `
          <div style="text-align: center; padding: 48px 20px; color: var(--text-secondary);">
            <div style="font-size: 40px; margin-bottom: 10px;">📜</div>
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">No transactions found</h3>
            <p style="font-size: 13px; color: var(--text-muted);">Your spending history will appear here.</p>
          </div>
        ` : `
          ${renderTimelineSection('Today', groups.today)}
          ${renderTimelineSection('Yesterday', groups.yesterday)}
          ${renderTimelineSection('Earlier', groups.earlier)}
        `}
      </div>

      <!-- Transaction Detail Drawer -->
      <div id="tx-details-drawer" class="modal-backdrop">
        <div class="modal-sheet" id="tx-drawer-content"></div>
      </div>
    `;

    // Filter clicks
    container.querySelectorAll('.filter-chip').forEach(btn => {
      btn.onclick = () => {
        activeCategoryFilter = btn.dataset.cat;
        sound.playTap();
        render();
      };
    });

    // Search input
    const searchEl = document.getElementById('tx-search-input');
    searchEl.oninput = (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      render();
    };

    // Transaction item click
    container.querySelectorAll('.transaction-row').forEach(row => {
      row.onclick = () => {
        const txId = row.dataset.txid;
        openTransactionDetail(txId);
      };
    });
  }

  function renderTimelineSection(title, list) {
    if (!list || list.length === 0) return '';
    return `
      <div class="timeline-group-title">${title}</div>
      ${list.map(tx => {
        const catInfo = categorizationEngine.getCategoryInfo(tx.category);
        const isCredit = tx.type === 'credit';
        const isTransfer = tx.type === 'transfer';

        return `
          <div class="transaction-row" data-txid="${tx.id}">
            <div class="tx-left">
              <div class="tx-icon-badge" style="${isCredit ? 'background: var(--color-success-bg); color: var(--color-success);' : ''}">
                ${isCredit ? '📥' : (isTransfer ? '🔄' : catInfo.icon)}
              </div>
              <div class="tx-details">
                <span class="tx-merchant">${tx.merchantName}</span>
                <span class="tx-wallet-tag">
                  <span>${tx.walletName}</span>
                  ${tx.notes ? `• ${tx.notes}` : ''}
                </span>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="tx-amount ${isCredit ? 'credit' : 'debit'}">
                ${isCredit ? '+' : '-'} ₹${Number(tx.amount).toLocaleString('en-IN')}
              </div>
              <div class="tx-time">
                ${new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  function openTransactionDetail(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;

    const drawer = document.getElementById('tx-details-drawer');
    const content = document.getElementById('tx-drawer-content');
    const catInfo = categorizationEngine.getCategoryInfo(tx.category);

    content.innerHTML = `
      <div class="modal-grabber"></div>
      <div class="modal-header">
        <h3 class="modal-title">Payment Details</h3>
        <button class="modal-close-btn" id="close-tx-drawer">✕</button>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 36px; font-weight: 800; color: ${tx.type === 'credit' ? 'var(--color-success)' : 'var(--text-primary)'}; margin-bottom: 4px;">
          ${tx.type === 'credit' ? '+' : '-'} ₹${Number(tx.amount).toLocaleString('en-IN')}
        </div>
        <div style="font-size: 16px; font-weight: 700;">${tx.merchantName}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
          ${new Date(tx.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div style="background: var(--bg-surface-subtle); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; font-size: 13.5px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: var(--text-secondary);">Purpose Wallet</span>
          <span style="font-weight: 700;">${tx.walletName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: var(--text-secondary);">Category</span>
          <span style="font-weight: 600;">${catInfo.icon} ${catInfo.label}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-secondary);">Status</span>
          <span style="color: var(--color-success); font-weight: 700;">Completed (Simulated)</span>
        </div>
      </div>

      <button class="secondary-btn" id="btn-done-tx-drawer">
        Close
      </button>
    `;

    drawer.classList.add('open');
    sound.playTap();

    document.getElementById('close-tx-drawer').onclick = () => {
      drawer.classList.remove('open');
      sound.playTap();
    };

    document.getElementById('btn-done-tx-drawer').onclick = () => {
      drawer.classList.remove('open');
      sound.playTap();
    };
  }

  render();
}
