/* ==========================================================================
   PocketPe - Smart Pay, Simulated QR Scanner & Payment Protection
   "Pay from the right wallet automatically. Never get stranded."
   ========================================================================== */

import { state } from '../core/state.js';
import { paymentEngine } from '../core/paymentEngine.js';
import { categorizationEngine, CATEGORY_DEFINITIONS } from '../core/categorizationEngine.js';
import { launchConfetti, showToast } from '../components/modals.js';
import { sound } from '../core/sound.js';

export function renderPayView(container, navigateTo) {
  // Preset demo merchants for testing
  const DEMO_MERCHANTS = [
    { name: 'ABC Restaurant', amount: 350, note: 'Lunch special' },
    { name: 'City Pharmacy', amount: 180, note: 'Vitamins & meds' },
    { name: 'Shell Fuel Station', amount: 650, note: 'Petrol refill' },
    { name: 'College Canteen', amount: 120, note: 'Snacks & tea' },
    { name: 'Big Food Feast', amount: 2500, note: 'Triggers Payment Protection demo' }
  ];

  let selectedMerchant = DEMO_MERCHANTS[0];

  function renderScanner() {
    container.innerHTML = `
      <div class="app-header">
        <div>
          <h1 class="user-title">Scan & Pay</h1>
          <div class="greeting-text">Simulated QR Payment Prototype</div>
        </div>
        <div style="background: var(--color-info-bg); color: var(--color-info); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-full); text-transform: uppercase;">
          Demo Mode
        </div>
      </div>

      <!-- Scanner Viewfinder Simulation -->
      <div class="scanner-viewfinder">
        <div class="scanner-grid-bg"></div>
        <div class="scanner-frame-box">
          <div class="scanner-laser-line"></div>
        </div>
        <div style="position: absolute; bottom: 14px; font-size: 12px; color: rgba(255, 255, 255, 0.8); font-weight: 500;">
          Align camera over QR code
        </div>
      </div>

      <!-- Quick Demo Merchant Selection -->
      <div class="section-header-row">
        <span class="section-title">Tap a Demo QR to Scan</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
        ${DEMO_MERCHANTS.map((m, idx) => `
          <button class="secondary-btn demo-merchant-btn" data-idx="${idx}" style="justify-content: space-between; height: 48px; padding: 0 16px; font-weight: 600;">
            <span style="display: flex; align-items: center; gap: 8px;">
              <span>📱</span>
              <span>${m.name}</span>
            </span>
            <span style="font-weight: 800; color: var(--accent-primary);">₹${m.amount.toLocaleString('en-IN')}</span>
          </button>
        `).join('')}
      </div>

      <!-- Custom QR / Manual Entry Button -->
      <button class="primary-btn" id="btn-custom-qr" style="background: var(--bg-card); color: var(--text-primary); border: 1.5px solid var(--border-default); box-shadow: none;">
        <span>Enter Custom Merchant or Amount</span>
      </button>

      <!-- Security Disclaimer -->
      <div style="margin-top: 24px; padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-md); text-align: center; font-size: 12px; color: var(--text-muted); line-height: 1.4;">
        🔒 <strong>Fintech Simulation Notice:</strong> This is an interactive MVP prototype. No real bank accounts or real UPI payments are connected.
      </div>
    `;

    // Demo merchant clicks
    container.querySelectorAll('.demo-merchant-btn').forEach(btn => {
      btn.onclick = () => {
        selectedMerchant = DEMO_MERCHANTS[Number(btn.dataset.idx)];
        sound.playTap();
        renderPaymentConfirmation();
      };
    });

    document.getElementById('btn-custom-qr').onclick = () => {
      renderCustomEntry();
    };
  }

  function renderCustomEntry() {
    container.innerHTML = `
      <div class="app-header">
        <div>
          <h1 class="user-title">Custom Demo Payment</h1>
          <div class="greeting-text">Enter any merchant name & amount</div>
        </div>
        <button class="header-action-btn" id="btn-back-scanner">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">Merchant Name</label>
        <input type="text" id="custom-merchant-name" class="form-input" placeholder="e.g. Star Books, Nike Store" value="ABC Store" />
      </div>

      <div class="form-group">
        <label class="form-label">Amount (₹)</label>
        <input type="number" id="custom-merchant-amount" class="form-input" placeholder="e.g. 500" value="450" min="1" />
      </div>

      <button class="primary-btn" id="btn-proceed-custom">
        Continue to Smart Recommendation →
      </button>
    `;

    document.getElementById('btn-back-scanner').onclick = () => renderScanner();

    document.getElementById('btn-proceed-custom').onclick = () => {
      const name = document.getElementById('custom-merchant-name').value.trim() || 'Demo Merchant';
      const amt = Number(document.getElementById('custom-merchant-amount').value) || 100;
      selectedMerchant = { name, amount: amt, note: 'Custom payment' };
      renderPaymentConfirmation();
    };
  }

  function renderPaymentConfirmation() {
    let evaluation = paymentEngine.evaluatePayment(selectedMerchant.name, selectedMerchant.amount);
    let chosenWalletId = evaluation.recommendedWalletId;
    let chosenCategoryId = evaluation.categoryInfo.category;

    function renderDetails() {
      // Re-evaluate if wallet or category changed
      const chosenWallet = chosenWalletId === 'w-free' 
        ? { id: 'w-free', name: 'Free Money', icon: '🪙', balance: state.freeMoneyBalance }
        : state.wallets.find(w => w.id === chosenWalletId) || { id: 'w-free', name: 'Free Money', icon: '🪙', balance: state.freeMoneyBalance };

      const available = chosenWallet.balance;
      const isSufficient = available >= selectedMerchant.amount;
      const shortfall = isSufficient ? 0 : selectedMerchant.amount - available;
      const canCoverWithFree = state.freeMoneyBalance >= shortfall && chosenWalletId !== 'w-free';

      container.innerHTML = `
        <div class="app-header">
          <div>
            <h1 class="user-title">Confirm Payment</h1>
            <div class="greeting-text">Smart Wallet Recommendation</div>
          </div>
          <button class="header-action-btn" id="btn-cancel-pay">✕</button>
        </div>

        <!-- Merchant Header Card -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 16px; text-align: center;">
          <div style="font-size: 38px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
            ₹${selectedMerchant.amount.toLocaleString('en-IN')}
          </div>
          <div style="font-size: 16px; font-weight: 700; color: var(--text-primary);">${selectedMerchant.name}</div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 6px;">
            <span style="font-size: 14px;">${evaluation.categoryInfo.icon}</span>
            <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">${evaluation.categoryInfo.categoryLabel}</span>
            ${evaluation.categoryInfo.isUserLearned ? `<span class="status-badge healthy" style="font-size: 10px;">Learned choice ✓</span>` : ''}
          </div>
        </div>

        <!-- Category Correction Section -->
        <div style="background: var(--bg-surface-subtle); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 12px; color: var(--text-secondary);">
            Not right? <strong>Change category</strong>
          </div>
          <button class="section-link-btn" id="btn-change-category" style="font-size: 12px;">
            Edit Category ✎
          </button>
        </div>

        <!-- Category Picker Drawer (Hidden by default) -->
        <div id="category-picker-box" style="display: none; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 10px;">What was this payment for?</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
            ${CATEGORY_DEFINITIONS.filter(c => c.id !== 'free').map(c => `
              <button class="secondary-btn cat-pick-btn" data-cat="${c.id}" style="height: auto; padding: 8px 4px; font-size: 11px; flex-direction: column; gap: 4px;">
                <span style="font-size: 18px;">${c.icon}</span>
                <span style="text-align: center;">${c.label}</span>
              </button>
            `).join('')}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
            <input type="checkbox" id="check-remember-category" checked style="accent-color: var(--accent-primary);" />
            <label for="check-remember-category">Remember this choice for <strong>${selectedMerchant.name}</strong></label>
          </div>
        </div>

        <!-- Recommended Wallet Card -->
        <div class="wallet-card" style="border: 2px solid ${isSufficient ? 'var(--accent-primary)' : '#f59e0b'}; margin-bottom: 16px; background: var(--bg-card);">
          <div class="wallet-card-top">
            <div class="wallet-title-group">
              <div class="wallet-emoji-badge">${chosenWallet.icon}</div>
              <div class="wallet-meta">
                <span class="wallet-name">${chosenWallet.name}</span>
                <span class="wallet-subtitle">
                  ${chosenWalletId === evaluation.recommendedWalletId ? 'Recommended by PocketPe' : 'Manually selected'}
                </span>
              </div>
            </div>
            <div class="wallet-amount-group">
              <span class="wallet-balance">₹${available.toLocaleString('en-IN')}</span>
              <span class="wallet-target">Available</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); border-top: 1px solid var(--border-default); padding-top: 10px; margin-top: 4px;">
            <span>Payment: ₹${selectedMerchant.amount.toLocaleString('en-IN')}</span>
            <span>Remaining after: <strong>₹${Math.max(0, available - selectedMerchant.amount).toLocaleString('en-IN')}</strong></span>
          </div>

          <div style="text-align: right; margin-top: 6px;">
            <button class="section-link-btn" id="btn-switch-wallet" style="font-size: 12px;">
              Change wallet ▾
            </button>
          </div>
        </div>

        <!-- Wallet Switcher Dropdown (Hidden by default) -->
        <div id="wallet-picker-box" style="display: none; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Pay from which wallet?</label>
            <select id="wallet-picker-select" class="form-input">
              <option value="w-free" ${chosenWalletId === 'w-free' ? 'selected' : ''}>🪙 Free Money (₹${state.freeMoneyBalance.toLocaleString('en-IN')})</option>
              ${state.wallets.map(w => `
                <option value="${w.id}" ${chosenWalletId === w.id ? 'selected' : ''}>
                  ${w.icon} ${w.name} (₹${w.balance.toLocaleString('en-IN')})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Payment Protection Box (If balance is insufficient) -->
        ${!isSufficient ? `
          <div class="protection-alert-card">
            <div class="protection-header">
              <div class="protection-icon">🛡️</div>
              <div class="protection-title">Payment Protection Active</div>
            </div>
            <div class="protection-desc">
              Your <strong>${chosenWallet.name}</strong> has ₹${available.toLocaleString('en-IN')}. You need <strong>₹${shortfall.toLocaleString('en-IN')} more</strong>.
            </div>

            ${canCoverWithFree ? `
              <button class="protection-solution-btn" id="btn-protect-cover-free">
                <span>Move ₹${shortfall.toLocaleString('en-IN')} from Free Money & Pay</span>
                <span>→</span>
              </button>
            ` : `
              <div style="font-size: 12px; color: var(--color-danger); margin-bottom: 10px;">
                Your Free Money (₹${state.freeMoneyBalance.toLocaleString('en-IN')}) is also not enough to cover the remaining ₹${shortfall.toLocaleString('en-IN')}.
              </div>
              <button class="secondary-btn" id="btn-protect-pick-another" style="height: 42px; font-size: 13px;">
                Choose another wallet
              </button>
            `}
          </div>
        ` : ''}

        <!-- Primary Pay Button -->
        <button class="primary-btn" id="btn-execute-pay" ${!isSufficient ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
          <span>Pay ₹${selectedMerchant.amount.toLocaleString('en-IN')}</span>
          <span>✓</span>
        </button>
      `;

      // Cancel button
      document.getElementById('btn-cancel-pay').onclick = () => renderScanner();

      // Change category button
      document.getElementById('btn-change-category').onclick = () => {
        const box = document.getElementById('category-picker-box');
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      };

      // Category pick buttons
      container.querySelectorAll('.cat-pick-btn').forEach(btn => {
        btn.onclick = () => {
          chosenCategoryId = btn.dataset.cat;
          const shouldRemember = document.getElementById('check-remember-category').checked;
          if (shouldRemember) {
            categorizationEngine.teachCategory(selectedMerchant.name, chosenCategoryId);
            showToast(`PocketPe learned! Future payments to ${selectedMerchant.name} will use this category.`);
          }
          evaluation = paymentEngine.evaluatePayment(selectedMerchant.name, selectedMerchant.amount);
          chosenWalletId = evaluation.recommendedWalletId;
          sound.playTap();
          renderDetails();
        };
      });

      // Switch wallet button
      document.getElementById('btn-switch-wallet').onclick = () => {
        const box = document.getElementById('wallet-picker-box');
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      };

      const walletSelect = document.getElementById('wallet-picker-select');
      if (walletSelect) {
        walletSelect.onchange = (e) => {
          chosenWalletId = e.target.value;
          sound.playTap();
          renderDetails();
        };
      }

      // Protection cover from free money button
      const protectCoverBtn = document.getElementById('btn-protect-cover-free');
      if (protectCoverBtn) {
        protectCoverBtn.onclick = () => {
          try {
            paymentEngine.processPayment({
              merchantName: selectedMerchant.name,
              amount: selectedMerchant.amount,
              categoryId: chosenCategoryId,
              walletId: chosenWalletId,
              coverFromFreeMoney: true
            });
            renderReceipt(selectedMerchant.name, selectedMerchant.amount, chosenWallet.name, true);
          } catch (err) {
            showToast(err.message);
          }
        };
      }

      // Protection choose another wallet
      const protectAnotherBtn = document.getElementById('btn-protect-pick-another');
      if (protectAnotherBtn) {
        protectAnotherBtn.onclick = () => {
          document.getElementById('wallet-picker-box').style.display = 'block';
        };
      }

      // Execute normal payment
      document.getElementById('btn-execute-pay').onclick = () => {
        try {
          paymentEngine.processPayment({
            merchantName: selectedMerchant.name,
            amount: selectedMerchant.amount,
            categoryId: chosenCategoryId,
            walletId: chosenWalletId,
            coverFromFreeMoney: false
          });
          renderReceipt(selectedMerchant.name, selectedMerchant.amount, chosenWallet.name, false);
        } catch (err) {
          showToast(err.message);
        }
      };
    }

    renderDetails();
  }

  function renderReceipt(merchantName, amount, walletName, wasProtected) {
    launchConfetti();

    container.innerHTML = `
      <div style="text-align: center; padding: 24px 10px;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--color-success-bg); color: var(--color-success); font-size: 34px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 2px solid var(--color-success);">
          ✓
        </div>
        
        <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--color-success); letter-spacing: 0.5px; margin-bottom: 4px;">
          Demo Payment Successful
        </div>
        
        <h2 style="font-size: 38px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
          ₹${amount.toLocaleString('en-IN')}
        </h2>
        <div style="font-size: 16px; font-weight: 600; color: var(--text-secondary); margin-bottom: 24px;">
          Paid to ${merchantName}
        </div>

        <!-- Receipt Card -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 18px; text-align: left; margin-bottom: 24px; font-size: 13.5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">Source Wallet</span>
            <span style="font-weight: 700;">${walletName}</span>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">Date & Time</span>
            <span style="font-weight: 600;">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">Simulated Reference</span>
            <span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted);">PKT-${Date.now().toString().slice(-6)}</span>
          </div>

          ${wasProtected ? `
            <div style="background: #fffbeb; border-radius: var(--radius-sm); padding: 8px 10px; font-size: 12px; color: #92400e; margin-top: 8px;">
              🛡️ <strong>Payment Protection used:</strong> Shortfall was safely drawn from Free Money.
            </div>
          ` : ''}
        </div>

        <button class="primary-btn" id="btn-finish-receipt" style="margin-bottom: 10px;">
          Done
        </button>
        <button class="secondary-btn" id="btn-pay-another">
          Make Another Payment
        </button>
      </div>
    `;

    document.getElementById('btn-finish-receipt').onclick = () => navigateTo('home');
    document.getElementById('btn-pay-another').onclick = () => renderScanner();
  }

  // Initial load
  renderScanner();
}
