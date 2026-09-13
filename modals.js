/* ==========================================================================
   PocketPe - Modals, Dialogs & Micro-Flow Components
   ========================================================================== */

import { state } from '../core/state.js';
import { walletEngine } from '../core/walletEngine.js';
import { sound } from '../core/sound.js';

/**
 * Lightweight Toast notification helper
 */
export function showToast(message, duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/**
 * Canvas Confetti Cannon
 */
export function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const particles = [];
  const colors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#3B82F6', '#14B8A6'];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 80,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.8) * 10,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      alpha: 1
    });
  }

  let animationFrame;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.rotation += p.vRot;
      p.alpha -= 0.012;

      if (p.alpha > 0) {
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive > 0) {
      animationFrame = requestAnimationFrame(update);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  update();
}

/**
 * Universal Modal Opener
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    sound.playTap();
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    sound.playTap();
  }
}

/**
 * Render & Handle Receive Money Modal
 */
export function setupReceiveMoneyModal() {
  const container = document.getElementById('receive-money-modal-content');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-grabber"></div>
    <div class="modal-header">
      <h3 class="modal-title">Receive Money</h3>
      <button class="modal-close-btn" id="close-receive-modal">✕</button>
    </div>

    <div id="receive-step-input">
      <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">
        Simulate incoming funds (salary, allowance, or gift). Watch it split automatically across your virtual wallets!
      </p>

      <div class="form-group">
        <label class="form-label">Amount to Receive (₹)</label>
        <input type="number" id="receive-amount-input" class="form-input" value="10000" min="100" step="100" />
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <button class="secondary-btn preset-amount-btn" data-val="2000" style="height: 38px; font-size: 13px;">+ ₹2,000</button>
        <button class="secondary-btn preset-amount-btn" data-val="5000" style="height: 38px; font-size: 13px;">+ ₹5,000</button>
        <button class="secondary-btn preset-amount-btn" data-val="10000" style="height: 38px; font-size: 13px;">+ ₹10,000</button>
      </div>

      <button class="primary-btn" id="btn-trigger-receive">
        <span>Distribute & Allocate Money</span>
        <span>↓</span>
      </button>
    </div>

    <div id="receive-step-anim" style="display: none;">
      <div class="flow-simulation-box">
        <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Incoming Deposit</div>
        <div class="flowing-money-emitter" id="flow-display-amount">+ ₹10,000</div>
        
        <div class="flow-arrow-stream">
          <div>↓</div>
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Splitting Across Purpose Wallets</div>
        </div>

        <div class="flowing-target-cards" id="flowing-cards-list"></div>
      </div>

      <button class="primary-btn" id="btn-finish-receive" style="margin-top: 12px;">
        Done
      </button>
    </div>
  `;

  // Preset clicks
  container.querySelectorAll('.preset-amount-btn').forEach(btn => {
    btn.onclick = () => {
      const input = document.getElementById('receive-amount-input');
      if (input) input.value = btn.dataset.val;
      sound.playTap();
    };
  });

  // Close button
  document.getElementById('close-receive-modal').onclick = () => closeModal('modal-receive-money');

  // Trigger allocation
  document.getElementById('btn-trigger-receive').onclick = () => {
    const input = document.getElementById('receive-amount-input');
    const amount = Number(input.value);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount.');
      return;
    }

    try {
      const result = walletEngine.receiveMoney(amount);
      launchConfetti();

      // Show animated distribution
      document.getElementById('receive-step-input').style.display = 'none';
      const animBox = document.getElementById('receive-step-anim');
      animBox.style.display = 'block';

      document.getElementById('flow-display-amount').textContent = `+ ₹${amount.toLocaleString('en-IN')}`;
      const cardsList = document.getElementById('flowing-cards-list');
      cardsList.innerHTML = '';

      result.distribution.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'flowing-card-row';
        row.style.animationDelay = `${index * 90}ms`;
        row.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${item.icon}</span>
            <div style="text-align: left;">
              <div style="font-size: 13px; font-weight: 700;">${item.name}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${item.percentage}% rule</div>
            </div>
          </div>
          <div style="font-size: 15px; font-weight: 800; color: var(--color-success);">
            + ₹${item.amount.toLocaleString('en-IN')}
          </div>
        `;
        cardsList.appendChild(row);
      });
    } catch (err) {
      showToast(err.message);
    }
  };

  document.getElementById('btn-finish-receive').onclick = () => {
    closeModal('modal-receive-money');
    document.getElementById('receive-step-input').style.display = 'block';
    document.getElementById('receive-step-anim').style.display = 'none';
    showToast('Money successfully allocated to your wallets!');
  };
}

/**
 * Render & Handle Move Money (Rebalance) Modal
 */
export function setupMoveMoneyModal() {
  const container = document.getElementById('move-money-modal-content');
  if (!container) return;

  const wallets = state.wallets;

  container.innerHTML = `
    <div class="modal-grabber"></div>
    <div class="modal-header">
      <h3 class="modal-title">Move Money</h3>
      <button class="modal-close-btn" id="close-move-modal">✕</button>
    </div>

    <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">
      Reassign rupees between your virtual wallets. No bank transfer required—just change the purpose!
    </p>

    <div class="form-group">
      <label class="form-label">Move From</label>
      <select id="move-from-select" class="form-input">
        <option value="w-free">🪙 Free Money (₹${state.freeMoneyBalance.toLocaleString('en-IN')})</option>
        ${wallets.map(w => `<option value="${w.id}">${w.icon} ${w.name} (₹${w.balance.toLocaleString('en-IN')})</option>`).join('')}
      </select>
    </div>

    <div style="text-align: center; margin: -6px 0 10px; color: var(--accent-primary); font-size: 20px;">
      ↓
    </div>

    <div class="form-group">
      <label class="form-label">Move To</label>
      <select id="move-to-select" class="form-input">
        ${wallets.map((w, idx) => `<option value="${w.id}" ${idx === 0 ? 'selected' : ''}>${w.icon} ${w.name} (₹${w.balance.toLocaleString('en-IN')})</option>`).join('')}
        <option value="w-free">🪙 Free Money (₹${state.freeMoneyBalance.toLocaleString('en-IN')})</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Amount to Move (₹)</label>
      <input type="number" id="move-amount-input" class="form-input" placeholder="e.g. 300" min="1" />
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 20px;">
      <button class="secondary-btn preset-move-btn" data-val="200" style="height: 38px; font-size: 13px;">₹200</button>
      <button class="secondary-btn preset-move-btn" data-val="500" style="height: 38px; font-size: 13px;">₹500</button>
      <button class="secondary-btn preset-move-btn" data-val="1000" style="height: 38px; font-size: 13px;">₹1,000</button>
    </div>

    <button class="primary-btn" id="btn-confirm-move">
      Move Money
    </button>
  `;

  document.getElementById('close-move-modal').onclick = () => closeModal('modal-move-money');

  container.querySelectorAll('.preset-move-btn').forEach(btn => {
    btn.onclick = () => {
      const input = document.getElementById('move-amount-input');
      if (input) input.value = btn.dataset.val;
      sound.playTap();
    };
  });

  document.getElementById('btn-confirm-move').onclick = () => {
    const fromId = document.getElementById('move-from-select').value;
    const toId = document.getElementById('move-to-select').value;
    const amount = Number(document.getElementById('move-amount-input').value);

    try {
      const res = walletEngine.moveMoney(fromId, toId, amount);
      closeModal('modal-move-money');
      showToast(`Successfully moved ₹${res.amount.toLocaleString('en-IN')} from ${res.fromName} to ${res.toName}!`);
    } catch (err) {
      showToast(err.message);
      sound.playWarningAlert();
    }
  };
}

/**
 * Render & Handle Create Wallet Modal (3 Simple Steps)
 */
export function setupCreateWalletModal() {
  const container = document.getElementById('create-wallet-modal-content');
  if (!container) return;

  const PRESETS = [
    { icon: '🍔', name: 'Food & Groceries', category: 'food', color: '#f97316' },
    { icon: '🚗', name: 'Transport & Fuel', category: 'transport', color: '#06b6d4' },
    { icon: '🏠', name: 'Rent & Living', category: 'rent', color: '#3b82f6' },
    { icon: '🎓', name: 'College & Courses', category: 'college', color: '#8b5cf6' },
    { icon: '💰', name: 'Dream Savings', category: 'savings', color: '#10b981' },
    { icon: '👨‍👩‍👧', name: 'Family & Home', category: 'family', color: '#eab308' },
    { icon: '✈️', name: 'Vacation Travel', category: 'travel', color: '#14b8a6' },
    { icon: '🤝', name: 'Friends & Outings', category: 'friends', color: '#ec4899' },
    { icon: '🍿', name: 'Entertainment', category: 'entertainment', color: '#a855f7' },
    { icon: '➕', name: 'Custom Purpose', category: 'custom', color: '#64748b' }
  ];

  let selectedPreset = PRESETS[0];

  function renderStep1() {
    container.innerHTML = `
      <div class="modal-grabber"></div>
      <div class="modal-header">
        <h3 class="modal-title">Create a Purpose Wallet</h3>
        <button class="modal-close-btn" id="close-create-wallet-modal">✕</button>
      </div>

      <p style="font-size: 13px; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
        Step 1 of 3
      </p>
      <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">What do you want to save money for?</h4>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
        ${PRESETS.map((p, idx) => `
          <button class="preset-choice-card secondary-btn ${idx === 0 ? 'active-choice' : ''}" data-idx="${idx}" style="height: auto; padding: 12px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; ${idx === 0 ? 'border-color: var(--accent-primary); background: var(--accent-surface);' : ''}">
            <span style="font-size: 26px;">${p.icon}</span>
            <span style="font-size: 12.5px; font-weight: 700; text-align: center;">${p.name}</span>
          </button>
        `).join('')}
      </div>

      <div class="form-group" id="custom-name-field" style="display: none;">
        <label class="form-label">Wallet Name</label>
        <input type="text" id="custom-wallet-name" class="form-input" placeholder="e.g. My Next Bike" />
      </div>

      <button class="primary-btn" id="btn-create-step2">
        Next: Set Amount
      </button>
    `;

    document.getElementById('close-create-wallet-modal').onclick = () => closeModal('modal-create-wallet');

    container.querySelectorAll('.preset-choice-card').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.preset-choice-card').forEach(c => {
          c.style.borderColor = 'var(--border-default)';
          c.style.background = 'var(--bg-surface-subtle)';
        });
        btn.style.borderColor = 'var(--accent-primary)';
        btn.style.background = 'var(--accent-surface)';
        selectedPreset = PRESETS[Number(btn.dataset.idx)];

        const customField = document.getElementById('custom-name-field');
        if (selectedPreset.category === 'custom') {
          customField.style.display = 'block';
        } else {
          customField.style.display = 'none';
        }
        sound.playTap();
      };
    });

    document.getElementById('btn-create-step2').onclick = () => {
      const customName = document.getElementById('custom-wallet-name')?.value.trim();
      if (selectedPreset.category === 'custom' && customName) {
        selectedPreset.name = customName;
      }
      renderStep2();
    };
  }

  function renderStep2() {
    container.innerHTML = `
      <div class="modal-grabber"></div>
      <div class="modal-header">
        <h3 class="modal-title">${selectedPreset.icon} ${selectedPreset.name}</h3>
        <button class="modal-close-btn" id="close-create-wallet-modal">✕</button>
      </div>

      <p style="font-size: 13px; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
        Step 2 of 3
      </p>
      <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">How much do you want to keep here?</h4>

      <div class="form-group">
        <label class="form-label">Target Goal Amount (₹)</label>
        <input type="number" id="new-wallet-target" class="form-input" placeholder="e.g. 5000" value="5000" />
      </div>

      <div class="form-group">
        <label class="form-label">Initial Balance (from Free Money: ₹${state.freeMoneyBalance.toLocaleString('en-IN')})</label>
        <input type="number" id="new-wallet-initial" class="form-input" placeholder="0" value="0" max="${state.freeMoneyBalance}" />
      </div>

      <div style="display: flex; gap: 10px; margin-top: 24px;">
        <button class="secondary-btn" id="btn-back-step1" style="flex: 1;">Back</button>
        <button class="primary-btn" id="btn-create-step3" style="flex: 2;">Next: Auto Addition</button>
      </div>
    `;

    document.getElementById('close-create-wallet-modal').onclick = () => closeModal('modal-create-wallet');
    document.getElementById('btn-back-step1').onclick = () => renderStep1();

    document.getElementById('btn-create-step3').onclick = () => {
      selectedPreset.targetAmount = Number(document.getElementById('new-wallet-target').value) || 0;
      selectedPreset.initialBalance = Number(document.getElementById('new-wallet-initial').value) || 0;
      renderStep3();
    };
  }

  function renderStep3() {
    container.innerHTML = `
      <div class="modal-grabber"></div>
      <div class="modal-header">
        <h3 class="modal-title">Automatic Addition</h3>
        <button class="modal-close-btn" id="close-create-wallet-modal">✕</button>
      </div>

      <p style="font-size: 13px; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
        Step 3 of 3
      </p>
      <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Do you want to automatically add money?</h4>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
        <label style="background: var(--bg-card); border: 1.5px solid var(--accent-primary); padding: 14px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="radio" name="autoAddOption" value="incoming" checked style="accent-color: var(--accent-primary);" />
          <div>
            <div style="font-size: 14px; font-weight: 700;">Every time I receive money</div>
            <div style="font-size: 12px; color: var(--text-muted);">Allocate a share from future deposits</div>
          </div>
        </label>

        <label style="background: var(--bg-card); border: 1px solid var(--border-default); padding: 14px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="radio" name="autoAddOption" value="monthly" style="accent-color: var(--accent-primary);" />
          <div>
            <div style="font-size: 14px; font-weight: 700;">Every month (Salary day)</div>
            <div style="font-size: 12px; color: var(--text-muted);">Reserve a fixed budget monthly</div>
          </div>
        </label>

        <label style="background: var(--bg-card); border: 1px solid var(--border-default); padding: 14px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="radio" name="autoAddOption" value="none" style="accent-color: var(--accent-primary);" />
          <div>
            <div style="font-size: 14px; font-weight: 700;">No automatic additions</div>
            <div style="font-size: 12px; color: var(--text-muted);">I'll add money manually when needed</div>
          </div>
        </label>
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="secondary-btn" id="btn-back-step2" style="flex: 1;">Back</button>
        <button class="primary-btn" id="btn-finalize-wallet" style="flex: 2;">Create Wallet</button>
      </div>
    `;

    document.getElementById('close-create-wallet-modal').onclick = () => closeModal('modal-create-wallet');
    document.getElementById('btn-back-step2').onclick = () => renderStep2();

    document.getElementById('btn-finalize-wallet').onclick = () => {
      const selectedOption = document.querySelector('input[name="autoAddOption"]:checked').value;
      state.addWallet({
        name: selectedPreset.name,
        category: selectedPreset.category,
        icon: selectedPreset.icon,
        color: selectedPreset.color,
        targetAmount: selectedPreset.targetAmount,
        initialBalance: selectedPreset.initialBalance,
        splitPercent: selectedOption === 'incoming' ? 10 : 0,
        autoAddFreq: selectedOption
      });

      closeModal('modal-create-wallet');
      launchConfetti();
      sound.playSuccessChime();
      showToast(`Created "${selectedPreset.name}" wallet!`);
    };
  }

  // Initial render on modal setup
  renderStep1();
}

/**
 * 5-Screen Onboarding Flow Walkthrough
 */
export function setupOnboardingModal() {
  const container = document.getElementById('onboarding-modal-content');
  if (!container) return;

  const SLIDES = [
    {
      title: 'Give every rupee a purpose.',
      subtitle: 'Stop keeping money as one confusing total. Convert mental budgeting into visible virtual wallets.',
      icon: '✨'
    },
    {
      title: 'Separate without new bank accounts.',
      subtitle: 'Your money stays in your single bank account, but PocketPe manages smart purpose allocations.',
      icon: '🏦'
    },
    {
      title: 'Automatically split incoming money.',
      subtitle: 'Whenever you get salary or allowance, PocketPe automatically fills your Food, EMI, and Savings wallets.',
      icon: '🔀'
    },
    {
      title: 'Pay from the right wallet.',
      subtitle: 'Scan a QR and PocketPe recommends the matching wallet, preventing accidental spending.',
      icon: '🛡️'
    },
    {
      title: 'Stay in complete control.',
      subtitle: 'Need more money in a wallet? Move rupees anytime with one tap. Simple, calm, and predictable.',
      icon: '🚀'
    }
  ];

  let currentSlide = 0;

  function renderSlide() {
    const s = SLIDES[currentSlide];
    container.innerHTML = `
      <div style="text-align: center; padding: 20px 10px 10px;">
        <div style="font-size: 64px; margin-bottom: 24px; animation: pulseScale 1s ease-in-out infinite alternate;">${s.icon}</div>
        <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; letter-spacing: -0.5px;">${s.title}</h2>
        <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 32px; max-width: 320px; margin-inline: auto;">
          ${s.subtitle}
        </p>

        <!-- Step Dots -->
        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 32px;">
          ${SLIDES.map((_, i) => `
            <div style="width: ${i === currentSlide ? '24px' : '8px'}; height: 8px; border-radius: 4px; background: ${i === currentSlide ? 'var(--accent-primary)' : 'var(--border-strong)'}; transition: all 250ms ease;"></div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 12px;">
          ${currentSlide > 0 ? `<button class="secondary-btn" id="btn-ob-prev" style="flex: 1;">Back</button>` : ''}
          <button class="primary-btn" id="btn-ob-next" style="flex: 2;">
            ${currentSlide === SLIDES.length - 1 ? "Let's set up your money" : 'Continue'}
          </button>
        </div>
      </div>
    `;

    if (document.getElementById('btn-ob-prev')) {
      document.getElementById('btn-ob-prev').onclick = () => {
        currentSlide--;
        renderSlide();
        sound.playTap();
      };
    }

    document.getElementById('btn-ob-next').onclick = () => {
      if (currentSlide < SLIDES.length - 1) {
        currentSlide++;
        renderSlide();
        sound.playTap();
      } else {
        closeModal('modal-onboarding');
        state.updateSettings({ onboardingCompleted: true });
        sound.playSuccessChime();
        showToast('Welcome to PocketPe! Every rupee has a purpose.');
      }
    };
  }

  renderSlide();
}
