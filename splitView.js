/* ==========================================================================
   PocketPe - Automatic Money Splitting View
   "How should we split your money? Every rupee has a purpose."
   ========================================================================== */

import { state } from '../core/state.js';
import { walletEngine } from '../core/walletEngine.js';
import { showToast, launchConfetti } from '../components/modals.js';
import { sound } from '../core/sound.js';

export function renderSplitView(container, navigateTo) {
  const wallets = state.wallets;
  let freePercent = state.data.freeMoneySplitPercent || 0;
  
  // Local working copy of percentages
  const percentages = {};
  wallets.forEach(w => {
    percentages[w.id] = Number(w.splitPercent) || 0;
  });

  const SAMPLE_DEPOSIT = 10000;

  function calculateTotal() {
    let sum = Number(freePercent) || 0;
    for (const wid in percentages) {
      sum += Number(percentages[wid]) || 0;
    }
    return sum;
  }

  function render() {
    const totalPercent = calculateTotal();
    const isValid = totalPercent === 100;
    const diff = 100 - totalPercent;

    container.innerHTML = `
      <div class="app-header">
        <div>
          <h1 class="user-title">Money Split Rules</h1>
          <div class="greeting-text">How should we split your money?</div>
        </div>
        <button class="header-action-btn" id="btn-split-back" title="Back">✕</button>
      </div>

      <!-- Header Status Card -->
      <div class="split-header-summary">
        <div class="split-total-status">
          <span style="font-size: 14px; font-weight: 700; color: var(--text-secondary);">Total Split Allocation</span>
          <span style="font-size: 18px; font-weight: 800; color: ${isValid ? 'var(--color-success)' : (totalPercent < 100 ? 'var(--color-warning)' : 'var(--color-danger)')};">
            ${totalPercent}% / 100%
          </span>
        </div>

        <div class="split-progress-track">
          <div style="height: 100%; width: ${Math.min(100, totalPercent)}%; background: ${isValid ? 'var(--color-success)' : (totalPercent < 100 ? 'var(--color-warning)' : 'var(--color-danger)')}; transition: width 200ms ease;"></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; font-size: 12.5px;">
          <span style="font-weight: 600; color: ${isValid ? 'var(--color-success)' : (totalPercent < 100 ? 'var(--color-warning)' : 'var(--color-danger)')};">
            ${isValid ? '✓ Perfectly balanced at 100%' : (diff > 0 ? `Your split is ${totalPercent}%. Add ${diff}%.` : `Your split is ${totalPercent}%. Reduce by ${Math.abs(diff)}%.`)}
          </span>
          ${!isValid ? `
            <button class="section-link-btn" id="btn-auto-balance" style="font-size: 12px; font-weight: 700;">
              Auto-fill Free Money
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Live Calculation Sample Notice -->
      <div style="background: var(--bg-surface-subtle); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
        <span style="color: var(--text-secondary);">Live preview for a sample deposit of:</span>
        <span style="font-weight: 800; color: var(--text-primary); font-size: 14px;">₹${SAMPLE_DEPOSIT.toLocaleString('en-IN')}</span>
      </div>

      <!-- Wallet Sliders List -->
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
        ${wallets.map(w => {
          const pct = percentages[w.id] || 0;
          const shareRupees = Math.round(SAMPLE_DEPOSIT * (pct / 100));

          return `
            <div class="split-rule-item">
              <div class="split-rule-top">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">${w.icon}</span>
                  <span style="font-size: 14px; font-weight: 700;">${w.name}</span>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 14px; font-weight: 800; color: var(--text-primary);">${pct}%</span>
                  <span style="font-size: 12px; color: var(--text-muted); margin-left: 4px;">(₹${shareRupees.toLocaleString('en-IN')})</span>
                </div>
              </div>

              <div class="split-slider-container">
                <input type="range" class="custom-range-slider wallet-slider" data-wid="${w.id}" min="0" max="100" step="5" value="${pct}" />
              </div>
            </div>
          `;
        }).join('')}

        <!-- Free Money Rule Item -->
        <div class="split-rule-item" style="border: 1.5px dashed var(--border-strong); background: var(--bg-surface-subtle);">
          <div class="split-rule-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">🪙</span>
              <span style="font-size: 14px; font-weight: 700;">Free Money (Unallocated)</span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 14px; font-weight: 800; color: #3b82f6;">${freePercent}%</span>
              <span style="font-size: 12px; color: var(--text-muted); margin-left: 4px;">(₹${Math.round(SAMPLE_DEPOSIT * (freePercent / 100)).toLocaleString('en-IN')})</span>
            </div>
          </div>

          <div class="split-slider-container">
            <input type="range" id="free-money-slider" class="custom-range-slider" min="0" max="100" step="5" value="${freePercent}" />
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <button class="primary-btn" id="btn-save-split-rules" ${!isValid ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
        Save Split Rules
      </button>
    `;

    document.getElementById('btn-split-back').onclick = () => navigateTo('home');

    // Wallet slider inputs
    container.querySelectorAll('.wallet-slider').forEach(slider => {
      slider.oninput = (e) => {
        const wid = e.target.dataset.wid;
        percentages[wid] = Number(e.target.value);
        render();
      };
    });

    // Free money slider input
    const freeSlider = document.getElementById('free-money-slider');
    if (freeSlider) {
      freeSlider.oninput = (e) => {
        freePercent = Number(e.target.value);
        render();
      };
    }

    // Auto-balance button
    const autoBalanceBtn = document.getElementById('btn-auto-balance');
    if (autoBalanceBtn) {
      autoBalanceBtn.onclick = () => {
        let otherSum = 0;
        for (const wid in percentages) {
          otherSum += Number(percentages[wid]) || 0;
        }
        if (otherSum <= 100) {
          freePercent = 100 - otherSum;
        } else {
          // Proportionally scale down if already > 100
          freePercent = 0;
          const factor = 100 / otherSum;
          for (const wid in percentages) {
            percentages[wid] = Math.round(percentages[wid] * factor);
          }
        }
        sound.playTap();
        render();
      };
    }

    // Save rules button
    const saveBtn = document.getElementById('btn-save-split-rules');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const res = walletEngine.saveSplitPercentages(percentages, freePercent);
        if (res.valid) {
          sound.playSuccessChime();
          launchConfetti();
          showToast('Allocation rules updated successfully!');
          navigateTo('home');
        } else {
          showToast(res.message);
          sound.playWarningAlert();
        }
      };
    }
  }

  render();
}
