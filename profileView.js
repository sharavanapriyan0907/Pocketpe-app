/* ==========================================================================
   PocketPe - Profile & Settings View
   Theme Engine, Accent Colors, Preferences & Fintech Disclaimers
   ========================================================================== */

import { state } from '../core/state.js';
import { sound } from '../core/sound.js';
import { openModal, setupOnboardingModal, showToast } from '../components/modals.js';

export function renderProfileView(container, navigateTo) {
  const settings = state.settings;

  const ACCENT_OPTIONS = [
    { id: 'emerald', label: 'Emerald Fintech', color: '#10B981' },
    { id: 'indigo', label: 'Indigo Royal', color: '#6366F1' },
    { id: 'violet', label: 'Violet Luxe', color: '#8B5CF6' },
    { id: 'amber', label: 'Amber Warm', color: '#F59E0B' },
    { id: 'teal', label: 'Teal Ocean', color: '#06B6D4' },
    { id: 'rose', label: 'Rose Coral', color: '#F43F5E' }
  ];

  container.innerHTML = `
    <div class="app-header">
      <div>
        <h1 class="user-title">Profile & Preferences</h1>
        <div class="greeting-text">Control your PocketPe experience</div>
      </div>
    </div>

    <!-- User Mini Profile -->
    <div style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 18px; display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
      <div style="width: 54px; height: 54px; border-radius: 50%; background: var(--accent-gradient); color: var(--accent-contrast); font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center;">
        ${state.data.user.name.charAt(0)}
      </div>
      <div>
        <div style="font-size: 17px; font-weight: 800;">${state.data.user.name}</div>
        <div style="font-size: 13px; color: var(--text-secondary);">Intent-Based Budgeting Active</div>
      </div>
    </div>

    <!-- Theme Mode Selection -->
    <div style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 20px;">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px;">Appearance Theme</h3>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
        <button class="theme-mode-btn secondary-btn ${settings.theme === 'light' ? 'active-theme' : ''}" data-mode="light" style="height: 40px; font-size: 13px; ${settings.theme === 'light' ? 'border-color: var(--accent-primary); background: var(--accent-surface); font-weight: 700;' : ''}">
          ☀️ Light
        </button>
        <button class="theme-mode-btn secondary-btn ${settings.theme === 'dark' ? 'active-theme' : ''}" data-mode="dark" style="height: 40px; font-size: 13px; ${settings.theme === 'dark' ? 'border-color: var(--accent-primary); background: var(--accent-surface); font-weight: 700;' : ''}">
          🌙 Dark
        </button>
        <button class="theme-mode-btn secondary-btn ${settings.theme === 'system' ? 'active-theme' : ''}" data-mode="system" style="height: 40px; font-size: 13px; ${settings.theme === 'system' ? 'border-color: var(--accent-primary); background: var(--accent-surface); font-weight: 700;' : ''}">
          ⚙️ System
        </button>
      </div>

      <h4 style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">Accent Color</h4>
      <div class="theme-swatches-grid">
        ${ACCENT_OPTIONS.map(acc => `
          <button class="swatch-btn ${settings.accent === acc.id ? 'active' : ''}" data-accent="${acc.id}" style="background: ${acc.color};" title="${acc.label}"></button>
        `).join('')}
      </div>
    </div>

    <!-- App Preferences -->
    <div style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 20px;">
      <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 14px;">App Controls</h3>

      <!-- Sound Effects Toggle -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-default);">
        <div>
          <div style="font-size: 14px; font-weight: 600;">Sound Effects</div>
          <div style="font-size: 12px; color: var(--text-muted);">Auditory feedback on money actions</div>
        </div>
        <input type="checkbox" id="toggle-sound" ${settings.soundEnabled ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent-primary); cursor: pointer;" />
      </div>

      <!-- Privacy Mode Toggle -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-default);">
        <div>
          <div style="font-size: 14px; font-weight: 600;">Privacy Mode</div>
          <div style="font-size: 12px; color: var(--text-muted);">Hide balance numbers on screen</div>
        </div>
        <input type="checkbox" id="toggle-privacy" ${settings.privacyMode ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent-primary); cursor: pointer;" />
      </div>

      <!-- Replay Onboarding Button -->
      <div style="padding: 12px 0 4px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 14px; font-weight: 600;">Product Walkthrough</div>
          <div style="font-size: 12px; color: var(--text-muted);">Replay "Every Rupee Has a Purpose" tour</div>
        </div>
        <button class="secondary-btn" id="btn-replay-onboarding" style="width: auto; height: 32px; font-size: 12px; padding: 0 12px;">
          Replay
        </button>
      </div>
    </div>

    <!-- Reset Demo Data Option -->
    <div style="background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 24px;">
      <h3 style="font-size: 15px; font-weight: 700; color: var(--color-danger); margin-bottom: 6px;">Reset Demo Data</h3>
      <p style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 14px;">
        Restore demo balances (₹10,000 total balance, default wallets, initial transactions, and learning memory).
      </p>
      <button class="secondary-btn" id="btn-reset-demo" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.4); height: 40px; font-size: 13px;">
        Reset All to Demo Defaults
      </button>
    </div>

    <!-- Security & Prototype Disclaimer Card -->
    <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 24px; font-size: 12px; color: var(--text-muted); line-height: 1.5;">
      <div style="font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        <span>🛡️</span>
        <span>Fintech Prototype Notice</span>
      </div>
      PocketPe is a concept prototype demonstrating intent-based virtual money management. No real bank accounts, UPI infrastructure, or real currency movements are processed. All balances and transactions are local simulations.
    </div>

    <!-- Version Info -->
    <div style="text-align: center; font-size: 12px; color: var(--text-muted); padding-bottom: 20px;">
      PocketPe MVP • v1.0.0 • "Every rupee has a purpose."
    </div>
  `;

  // Theme Mode click
  container.querySelectorAll('.theme-mode-btn').forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      state.updateSettings({ theme: mode });
      sound.playTap();
      applyTheme();
    };
  });

  // Accent click
  container.querySelectorAll('.swatch-btn').forEach(btn => {
    btn.onclick = () => {
      const accent = btn.dataset.accent;
      state.updateSettings({ accent });
      sound.playTap();
      applyTheme();
    };
  });

  // Sound toggle
  const soundToggle = document.getElementById('toggle-sound');
  if (soundToggle) {
    soundToggle.onchange = (e) => {
      const enabled = e.target.checked;
      state.updateSettings({ soundEnabled: enabled });
      sound.enabled = enabled;
      sound.playTap();
    };
  }

  // Privacy toggle
  const privacyToggle = document.getElementById('toggle-privacy');
  if (privacyToggle) {
    privacyToggle.onchange = (e) => {
      const mode = e.target.checked;
      state.updateSettings({ privacyMode: mode });
      sound.playTap();
    };
  }

  // Replay Onboarding
  document.getElementById('btn-replay-onboarding').onclick = () => {
    setupOnboardingModal();
    openModal('modal-onboarding');
  };

  // Reset Demo
  document.getElementById('btn-reset-demo').onclick = () => {
    if (confirm('Reset all wallets, transactions, and categories back to fresh demo defaults?')) {
      state.resetToDefaults();
      sound.playSuccessChime();
      showToast('Demo data reset to defaults!');
      applyTheme();
      navigateTo('home');
    }
  };
}

/**
 * Apply theme tokens instantly to DOM
 */
export function applyTheme() {
  const settings = state.settings;
  const root = document.documentElement;

  // 1. Accent
  root.setAttribute('data-accent', settings.accent || 'emerald');

  // 2. Theme Mode
  if (settings.theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (settings.theme === 'light') {
    root.removeAttribute('data-theme');
  } else {
    // System mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  // Sync sound manager
  sound.enabled = settings.soundEnabled !== false;
}
