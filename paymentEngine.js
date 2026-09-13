/* ==========================================================================
   PocketPe - Smart Payment & Payment Protection Engine
   "Your Food wallet doesn't have enough money. Let's solve it."
   ========================================================================== */

import { state } from './state.js';
import { categorizationEngine } from './categorizationEngine.js';
import { sound } from './sound.js';

class PaymentEngine {
  /**
   * Evaluates a payment against a merchant and recommends the best wallet
   */
  evaluatePayment(merchantName, amount) {
    amount = Number(amount);
    const catInfo = categorizationEngine.categorizeMerchant(merchantName);

    // Look for matching wallet by category
    const wallets = state.wallets;
    let recommendedWallet = wallets.find(w => w.category === catInfo.category);

    // If no direct category match, see if there is a wallet whose name contains the category or fallback to first or Free Money
    if (!recommendedWallet) {
      recommendedWallet = wallets.find(w => 
        w.name.toLowerCase().includes(catInfo.category.toLowerCase())
      ) || null;
    }

    // Default to Free Money if still no specific wallet found
    const targetWalletId = recommendedWallet ? recommendedWallet.id : 'w-free';
    const targetWalletName = recommendedWallet ? recommendedWallet.name : 'Free Money';
    const targetWalletIcon = recommendedWallet ? recommendedWallet.icon : '🪙';
    const availableBalance = recommendedWallet ? recommendedWallet.balance : state.freeMoneyBalance;

    const hasSufficientBalance = availableBalance >= amount;
    const shortfall = hasSufficientBalance ? 0 : amount - availableBalance;

    // Can Free Money cover the shortfall?
    const freeMoneyCoversShortfall = state.freeMoneyBalance >= shortfall;

    return {
      merchantName,
      amount,
      categoryInfo: catInfo,
      recommendedWalletId: targetWalletId,
      recommendedWalletName: targetWalletName,
      recommendedWalletIcon: targetWalletIcon,
      availableBalance,
      hasSufficientBalance,
      shortfall,
      freeMoneyCoversShortfall,
      freeMoneyBalance: state.freeMoneyBalance,
      remainingAfterPayment: Math.max(0, availableBalance - amount)
    };
  }

  /**
   * Executes a payment.
   * If coverFromFreeMoney is true, pulls shortfall from Free Money before paying.
   */
  processPayment({ merchantName, amount, categoryId, walletId, coverFromFreeMoney = false }) {
    amount = Math.round(Number(amount));
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Please enter a valid payment amount.');
    }

    let walletName = '';
    let availableBalance = 0;

    if (walletId === 'w-free') {
      walletName = 'Free Money';
      availableBalance = state.freeMoneyBalance;
      if (availableBalance < amount) {
        throw new Error(`Your Free Money balance only has ₹${availableBalance.toLocaleString('en-IN')}.`);
      }
      state.setFreeMoneyBalance(state.freeMoneyBalance - amount);
    } else {
      const target = state.wallets.find(w => w.id === walletId);
      if (!target) throw new Error('Selected wallet not found.');
      walletName = target.name;
      availableBalance = target.balance;

      if (availableBalance < amount) {
        const shortfall = amount - availableBalance;
        if (coverFromFreeMoney) {
          if (state.freeMoneyBalance < shortfall) {
            throw new Error(`Free Money only has ₹${state.freeMoneyBalance.toLocaleString('en-IN')}, which isn't enough to cover ₹${shortfall.toLocaleString('en-IN')}.`);
          }
          // Drain wallet and pull remaining shortfall from Free Money
          state.updateWallet(walletId, { balance: 0 });
          state.setFreeMoneyBalance(state.freeMoneyBalance - shortfall);
        } else {
          throw new Error(`Your ${walletName} wallet has ₹${availableBalance.toLocaleString('en-IN')}. You need ₹${shortfall.toLocaleString('en-IN')} more.`);
        }
      } else {
        state.updateWallet(walletId, { balance: availableBalance - amount });
      }
    }

    // Record completed transaction
    const newTx = state.addTransaction({
      merchantName,
      amount,
      category: categoryId,
      walletId,
      walletName,
      type: 'debit',
      notes: coverFromFreeMoney 
        ? `Protected payment: covered ₹${amount - availableBalance} from Free Money`
        : `Paid from ${walletName}`
    });

    sound.playSuccessChime();

    return {
      success: true,
      transaction: newTx,
      walletName,
      amount
    };
  }
}

export const paymentEngine = new PaymentEngine();
