/* ==========================================================================
   PocketPe - Home Screen View
   "How much money do I have and what is it meant for?"
   ========================================================================== */

import { state } from '../core/state.js';
import { walletEngine } from '../core/walletEngine.js';
import { openModal, setupReceiveMoneyModal, setupMoveMoneyModal } from '../components/modals.js';
import { sound } from '../core/sound.js';

export function renderHomeView(container, navigateTo) {
  const isPrivacy = state.settings.privacyMode;
  const total = state.totalBalance;
  const allocated = state.allocatedBalance;
  const free = state.freeMoneyBalance;
  const allocatedPercent = total > 0 ? Math.round((allocated / total) * 100) : 0;
  const freePercent = 100 - allocatedPercent;

  const wallets = state.wallets;
  const insights = walletEngine.generateInsights();

  // Time-aware greeting
  const hour = new Date().getHours();
  let greetingTime = 'Good morning';
  if (hour >= 12 && hour < 17) greetingTime = 'Good afternoon';
  if (hour >= 17) greetingTime = 'Good evening';

  function formatMoney(num) {
    if (isPrivacy) return '••••••';
    return num.toLocaleString('en-IN');
  }

  container.innerHTML = `
    <!-- Top Header & Greeting -->
    <div class="app-header">
      <div>
        <div class="greeting-text">${greetingTime} 👋</div>
        <h1 class="user-title">${state.data.user.name}'s Money</h1>
      </div>
      <button class="header-action-btn" id="btn-home-profile" title="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>
    </div>

    <!-- Hero Balance Card -->
    <div class="hero-balance-card">
      <div class="balance-caption-row">
        <span class="balance-caption">Total Balance</span>
        <button class="balance-privacy-btn" id="btn-toggle-privacy" title="Toggle visibility">
          ${isPrivacy ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ` : `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          `}
        </button>
      </div>

      <div class="balance-amount-display">
        <span class="rupee-symbol">₹</span>
        <span>${formatMoney(total)}</span>
      </div>

      <!-- Allocated vs Free Money Breakdown -->
      <div class="balance-split-summary">
        <div class="split-pill-item">
          <span class="split-pill-label">
            <span class="split-dot allocated"></span>
            Reserved for Purpose
          </span>
          <span class="split-pill-value">₹${formatMoney(allocated)}</span>
        </div>
        <div class="split-pill-item" style="text-align: right;">
          <span class="split-pill-label" style="justify-content: flex-end;">
            <span class="split-dot free"></span>
            Free Money
          </span>
          <span class="split-pill-value">₹${formatMoney(free)}</span>
        </div>
      </div>

      <!-- Visual split proportion bar -->
      <div class="balance-split-bar" title="${allocatedPercent}% allocated, ${freePercent}% free">
        <div class="bar-segment-allocated" style="width: ${allocatedPercent}%;"></div>
        <div class="bar-segment-free" style="width: ${freePercent}%;"></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions-grid">
      <button class="quick-action-btn" id="btn-quick-receive">
        <div class="quick-action-icon">📥</div>
        <span class="quick-action-label">Receive Money</span>
      </button>

      <button class="quick-action-btn" id="btn-quick-move">
        <div class="quick-action-icon">🔄</div>
        <span class="quick-action-label">Move Money</span>
      </button>

      <button class="quick-action-btn" id="btn-quick-split">
        <div class="quick-action-icon">🔀</div>
        <span class="quick-action-label">Split Rules</span>
      </button>

      <button class="quick-action-btn" id="btn-quick-pay">
        <div class="quick-action-icon">📱</div>
        <span class="quick-action-label">Scan & Pay</span>
      </button>
    </div>

    <!-- Smart 1-Sentence Insight -->
    ${insights.length > 0 ? `
      <div class="insights-card">
        <span class="insight-icon">${insights[0].icon}</span>
        <div class="insight-content">
          <div class="insight-label">${insights[0].label}</div>
          <div class="insight-text">${insights[0].text}</div>
        </div>
      </div>
    ` : ''}

    <!-- Purpose Wallets Section Header -->
    <div class="section-header-row">
      <h2 class="section-title">Your Purpose Wallets</h2>
      <button class="section-link-btn" id="btn-view-all-wallets">View all (${wallets.length})</button>
    </div>

    <!-- Wallet Cards List -->
    <div class="wallets-container" id="home-wallets-list">
      ${wallets.map(wallet => {
        const hasTarget = wallet.targetAmount && wallet.targetAmount > 0;
        const progressPct = hasTarget ? Math.min(100, Math.round((wallet.balance / wallet.targetAmount) * 100)) : 100;
        
        // Human status badge
        let statusBadge = '';
        if (hasTarget && progressPct >= 100) {
          statusBadge = `<span class="status-badge healthy">Target Reached 🎉</span>`;
        } else if (hasTarget && progressPct <= 30) {
          statusBadge = `<span class="status-badge warning">Low Balance</span>`;
        }

        return `
          <div class="wallet-card" data-wallet-id="${wallet.id}">
            <div class="wallet-card-top">
              <div class="wallet-title-group">
                <div class="wallet-emoji-badge">${wallet.icon}</div>
                <div class="wallet-meta">
                  <span class="wallet-name">${wallet.name}</span>
                  <span class="wallet-subtitle">${wallet.splitPercent}% of incoming deposits</span>
                </div>
              </div>
              <div class="wallet-amount-group">
                <span class="wallet-balance">₹${formatMoney(wallet.balance)}</span>
                ${hasTarget ? `<span class="wallet-target">of ₹${formatMoney(wallet.targetAmount)} target</span>` : ''}
              </div>
            </div>

            ${hasTarget ? `
              <div class="wallet-progress-container">
                <div class="wallet-progress-bar">
                  <div class="wallet-progress-fill" style="width: ${progressPct}%; background: ${wallet.color || 'var(--accent-primary)'};"></div>
                </div>
                <div class="wallet-footer-info">
                  <span>${progressPct}% of goal</span>
                  ${statusBadge}
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach Event Handlers
  document.getElementById('btn-home-profile').onclick = () => navigateTo('profile');
  document.getElementById('btn-view-all-wallets').onclick = () => navigateTo('wallets');

  document.getElementById('btn-toggle-privacy').onclick = () => {
    state.updateSettings({ privacyMode: !isPrivacy });
    sound.playTap();
  };

  document.getElementById('btn-quick-receive').onclick = () => {
    setupReceiveMoneyModal();
    openModal('modal-receive-money');
  };

  document.getElementById('btn-quick-move').onclick = () => {
    setupMoveMoneyModal();
    openModal('modal-move-money');
  };

  document.getElementById('btn-quick-split').onclick = () => {
    navigateTo('split');
  };

  document.getElementById('btn-quick-pay').onclick = () => {
    navigateTo('pay');
  };

  // Card click navigates to Wallets screen with specific wallet opened
  container.querySelectorAll('.wallet-card').forEach(card => {
    card.onclick = () => {
      sound.playTap();
      navigateTo('wallets', { selectedWalletId: card.dataset.walletId });
    };
  });
}
