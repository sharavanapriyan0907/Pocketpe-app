/* ==========================================================================
   PocketPe - Application Controller & Router
   "Every rupee has a purpose."
   ========================================================================== */

import { state } from './core/state.js';
import { sound } from './core/sound.js';
import { applyTheme, renderProfileView } from './views/profileView.js';
import { renderHomeView } from './views/homeView.js';
import { renderWalletsView } from './views/walletsView.js';
import { renderPayView } from './views/payView.js';
import { renderSplitView } from './views/splitView.js';
import { renderActivityView } from './views/activityView.js';
import { openModal, setupOnboardingModal } from './components/modals.js';

class PocketPeApp {
  constructor() {
    this.currentScreen = 'home';
    this.screenParams = {};
  }

  init() {
    // 1. Initialize Theme
    applyTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (state.settings.theme === 'system') {
        applyTheme();
      }
    });

    // 2. Setup Clock in Status Bar
    this._startClock();

    // 3. Bind Bottom Navigation
    this._bindNavigation();

    // 4. Bind Desktop Shell Toggle
    this._bindDesktopControls();

    // 5. Subscribe to State Changes (Reactive View Updates)
    state.subscribe(() => {
      this._renderCurrentScreen();
    });

    // 6. First-time Onboarding check
    if (!state.settings.onboardingCompleted) {
      setupOnboardingModal();
      openModal('modal-onboarding');
    }

    // 7. Initial Render
    this.navigateTo('home');
  }

  navigateTo(screenId, params = {}) {
    this.currentScreen = screenId;
    this.screenParams = params;
    sound.playTap();

    // Update bottom nav highlights
    document.querySelectorAll('.nav-item').forEach(btn => {
      if (btn.dataset.target === screenId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle screen container visibility
    document.querySelectorAll('.screen-page').forEach(page => {
      page.classList.remove('active');
    });

    const activeContainer = document.getElementById(`screen-${screenId}`);
    if (activeContainer) {
      activeContainer.classList.add('active');
    }

    // Scroll to top of app container smoothly
    const scrollContainer = document.getElementById('app-screen-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }

    // Render screen contents
    this._renderCurrentScreen();
  }

  _renderCurrentScreen() {
    const activeContainer = document.getElementById(`screen-${this.currentScreen}`);
    if (!activeContainer) return;

    switch (this.currentScreen) {
      case 'home':
        renderHomeView(activeContainer, (screen, p) => this.navigateTo(screen, p));
        break;
      case 'wallets':
        renderWalletsView(activeContainer, (screen, p) => this.navigateTo(screen, p), this.screenParams);
        break;
      case 'pay':
        renderPayView(activeContainer, (screen, p) => this.navigateTo(screen, p));
        break;
      case 'split':
        renderSplitView(activeContainer, (screen, p) => this.navigateTo(screen, p));
        break;
      case 'activity':
        renderActivityView(activeContainer, (screen, p) => this.navigateTo(screen, p));
        break;
      case 'profile':
        renderProfileView(activeContainer, (screen, p) => this.navigateTo(screen, p));
        break;
      default:
        renderHomeView(activeContainer, (screen, p) => this.navigateTo(screen, p));
    }
  }

  _bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.target;
        if (target) {
          this.navigateTo(target);
        }
      });
    });
  }

  _bindDesktopControls() {
    const toggleBtn = document.getElementById('btn-toggle-viewport-mode');
    const wrapper = document.getElementById('desktop-wrapper');
    if (toggleBtn && wrapper) {
      toggleBtn.addEventListener('click', () => {
        wrapper.classList.toggle('expanded');
        toggleBtn.textContent = wrapper.classList.contains('expanded') 
          ? 'Switch to Mobile Frame' 
          : 'Toggle Frame View';
        sound.playTap();
      });
    }
  }

  _startClock() {
    const clockEl = document.getElementById('status-clock');
    if (!clockEl) return;

    function update() {
      const d = new Date();
      let hours = d.getHours();
      let minutes = d.getMinutes();
      minutes = minutes < 10 ? '0' + minutes : minutes;
      clockEl.textContent = `${hours}:${minutes}`;
    }

    update();
    setInterval(update, 30000);
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PocketPeApp();
  app.init();
  window.PocketPe = app;
});
