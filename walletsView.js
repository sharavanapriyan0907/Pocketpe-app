/* ==========================================================================
   PocketPe - Wallets Screen View & Wallet Details
   "Every wallet represents a distinct mental purpose."
   ========================================================================== */

import { state } from '../core/state.js';
import { openModal, setupCreateWalletModal, setupMoveMoneyModal, showToast } from '../components/modals.js';
import { sound } from '../core/sound.js';

export function renderWalletsView(container, navigateTo, params = {}) {
  const wallets = state.wallets;
  const isPrivacy = state.settings.privacyMode;

  function formatMoney(num) {
    if (isPrivacy) return '••••••';
    return Number(num).toLocaleString('en-IN');
  }

  container.innerHTML = `
    <!-- Screen Header -->
    <div class="app-header">
      <div>
        <h1 class="user-title">Virtual Wallets</h1>
        <div class="greeting-text">Your money, divided by purpose</div>
      </div>
      <button class="primary-btn" id="btn-open-create-wallet" style="width: auto; height: 38px; padding: 0 14px; font-size: 13px; border-radius: var(--radius-full);">
        <span>+ New Wallet</span>
      </button>
    </div>

    <!-- Search / Filter input -->
    <div style="margin-bottom: 16px;">
      <input type="text" id="wallet-search-input" class="form-input" placeholder="🔍 Search your wallets..." style="height: 42px; font-size: 14px;" />
    </div>

    <!-- Free Money Overview Card -->
    <div class="wallet-card" id="free-money-card" style="background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface-subtle) 100%); border: 1.5px dashed var(--border-strong); margin-bottom: 16px;">
      <div class="wallet-card-top">
        <div class="wallet-title-group">
          <div class="wallet-emoji-badge" style="background: rgba(59, 130, 246, 0.12); color: #3b82f6;">🪙</div>
          <div class="wallet-meta">
            <span class="wallet-name">Free Money (Unallocated)</span>
            <span class="wallet-subtitle">${state.data.freeMoneySplitPercent}% of incoming deposits</span>
          </div>
        </div>
        <div class="wallet-amount-group">
          <span class="wallet-balance" style="color: #3b82f6;">₹${formatMoney(state.freeMoneyBalance)}</span>
          <span class="wallet-target">Safe to spend anywhere</span>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
        <button class="secondary-btn" id="btn-rebalance-free" style="height: 32px; font-size: 12px; width: auto; padding: 0 12px;">
          Assign to a Wallet →
        </button>
      </div>
    </div>

    <!-- Wallets List -->
    <div class="wallets-container" id="all-wallets-list">
      ${wallets.length === 0 ? `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🌱</div>
          <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 6px;">Your money needs a home.</h3>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
            Create your first purpose wallet to start assigning meaning to every rupee.
          </p>
          <button class="primary-btn" id="btn-empty-create-wallet">Create your first wallet</button>
        </div>
      ` : wallets.map(wallet => {
        const hasTarget = wallet.targetAmount && wallet.targetAmount > 0;
        const progressPct = hasTarget ? Math.min(100, Math.round((wallet.balance / wallet.targetAmount) * 100)) : 100;
        const remaining = hasTarget ? Math.max(0, wallet.targetAmount - wallet.balance) : 0;

        return `
          <div class="wallet-card item-wallet" data-id="${wallet.id}">
            <div class="wallet-card-top">
              <div class="wallet-title-group">
                <div class="wallet-emoji-badge">${wallet.icon}</div>
                <div class="wallet-meta">
                  <span class="wallet-name">${wallet.name}</span>
                  <span class="wallet-subtitle">${wallet.splitPercent}% auto-split</span>
                </div>
              </div>
              <div class="wallet-amount-group">
                <span class="wallet-balance">₹${formatMoney(wallet.balance)}</span>
                ${hasTarget ? `<span class="wallet-target">Target: ₹${formatMoney(wallet.targetAmount)}</span>` : ''}
              </div>
            </div>

            ${hasTarget ? `
              <div class="wallet-progress-container">
                <div class="wallet-progress-bar">
                  <div class="wallet-progress-fill" style="width: ${progressPct}%; background: ${wallet.color || 'var(--accent-primary)'};"></div>
                </div>
                <div class="wallet-footer-info">
                  <span>${progressPct}% filled</span>
                  <span>₹${formatMoney(remaining)} needed</span>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>

    <!-- Wallet Details Drawer Modal Placeholder -->
    <div id="wallet-details-drawer" class="modal-backdrop">
      <div class="modal-sheet" id="wallet-drawer-content"></div>
    </div>
  `;

  // Create Wallet Button Listeners
  const openCreateModal = () => {
    setupCreateWalletModal();
    openModal('modal-create-wallet');
  };

  document.getElementById('btn-open-create-wallet')?.addEventListener('click', openCreateModal);
  document.getElementById('btn-empty-create-wallet')?.addEventListener('click', openCreateModal);

  // Assign Free Money button
  document.getElementById('btn-rebalance-free')?.addEventListener('click', () => {
    setupMoveMoneyModal();
    openModal('modal-move-money');
  });

  // Search Filter
  const searchInput = document.getElementById('wallet-search-input');
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    container.querySelectorAll('.item-wallet').forEach(item => {
      const name = item.querySelector('.wallet-name').textContent.toLowerCase();
      item.style.display = name.includes(q) ? 'flex' : 'none';
    });
  });

  // Wallet Details Drawer Handler
  function openWalletDrawer(walletId) {
    const wallet = state.wallets.find(w => w.id === walletId);
    if (!wallet) return;

    const drawer = document.getElementById('wallet-details-drawer');
    const drawerContent = document.getElementById('wallet-drawer-content');
    const relatedTxs = state.transactions.filter(t => t.walletId === walletId);
    const hasTarget = wallet.targetAmount && wallet.targetAmount > 0;
    const progressPct = hasTarget ? Math.min(100, Math.round((wallet.balance / wallet.targetAmount) * 100)) : 100;
    const remainingNeeded = hasTarget ? Math.max(0, wallet.targetAmount - wallet.balance) : 0;

    drawerContent.innerHTML = `
      <div class="modal-grabber"></div>
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 28px;">${wallet.icon}</span>
          <div>
            <h3 class="modal-title">${wallet.name}</h3>
            <div style="font-size: 12px; color: var(--text-muted);">${wallet.splitPercent}% auto-split allocation</div>
          </div>
        </div>
        <button class="modal-close-btn" id="close-wallet-drawer">✕</button>
      </div>

      <!-- Current Balance Info Box -->
      <div style="background: var(--bg-surface-subtle); padding: 18px; border-radius: var(--radius-lg); margin-bottom: 20px; text-align: center;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Available for this Purpose</div>
        <div style="font-size: 34px; font-weight: 800; color: var(--text-primary); margin-bottom: 12px;">₹${formatMoney(wallet.balance)}</div>
        
        ${hasTarget ? `
          <div style="text-align: left; margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px;">
              <span>Target: ₹${formatMoney(wallet.targetAmount)}</span>
              <span>${progressPct}% reached</span>
            </div>
            <div class="wallet-progress-bar">
              <div class="wallet-progress-fill" style="width: ${progressPct}%; background: ${wallet.color || 'var(--accent-primary)'};"></div>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
              ${remainingNeeded === 0 ? 'Goal achieved! You can safely use or increase the target.' : `₹${formatMoney(remainingNeeded)} remaining to achieve target.`}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Action Buttons -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px;">
        <button class="primary-btn" id="btn-drawer-add-funds" style="height: 44px; font-size: 14px;">
          Move Money Here
        </button>
        <button class="secondary-btn" id="btn-drawer-spend" style="height: 44px; font-size: 14px;">
          Pay from Wallet
        </button>
      </div>

      <!-- Recent Transactions from this Wallet -->
      <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 12px;">Recent Payments from this Wallet</h4>
      <div class="activity-list" style="margin-bottom: 20px;">
        ${relatedTxs.length === 0 ? `
          <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
            No payments made from this wallet yet.
          </div>
        ` : relatedTxs.map(tx => `
          <div class="transaction-row">
            <div class="tx-left">
              <div class="tx-icon-badge">${wallet.icon}</div>
              <div class="tx-details">
                <span class="tx-merchant">${tx.merchantName}</span>
                <span class="tx-time">${new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
            <div class="tx-amount debit">
              - ₹${formatMoney(tx.amount)}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Delete Wallet Option -->
      <div style="border-top: 1px solid var(--border-default); padding-top: 16px; text-align: center;">
        <button id="btn-delete-wallet" style="background: none; border: none; color: var(--color-danger); font-size: 13px; font-weight: 600; cursor: pointer;">
          Remove this wallet & return ₹${formatMoney(wallet.balance)} to Free Money
        </button>
      </div>
    `;

    drawer.classList.add('open');
    sound.playTap();

    document.getElementById('close-wallet-drawer').onclick = () => {
      drawer.classList.remove('open');
      sound.playTap();
    };

    document.getElementById('btn-drawer-add-funds').onclick = () => {
      drawer.classList.remove('open');
      setupMoveMoneyModal();
      openModal('modal-move-money');
      // Pre-select destination
      setTimeout(() => {
        const destSelect = document.getElementById('move-to-select');
        if (destSelect) destSelect.value = walletId;
      }, 50);
    };

    document.getElementById('btn-drawer-spend').onclick = () => {
      drawer.classList.remove('open');
      navigateTo('pay');
    };

    document.getElementById('btn-delete-wallet').onclick = () => {
      if (confirm(`Remove "${wallet.name}"? Its balance of ₹${wallet.balance.toLocaleString('en-IN')} will be returned to Free Money.`)) {
        state.deleteWallet(walletId);
        drawer.classList.remove('open');
        sound.playTap();
        showToast(`Removed "${wallet.name}" wallet.`);
      }
    };
  }

  // Click on wallet item
  container.querySelectorAll('.item-wallet').forEach(card => {
    card.onclick = () => openWalletDrawer(card.dataset.id);
  });

  // If navigated with a selected wallet pre-opened
  if (params.selectedWalletId) {
    setTimeout(() => openWalletDrawer(params.selectedWalletId), 100);
  }
}
