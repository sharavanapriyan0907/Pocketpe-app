/* ==========================================================================
   PocketPe - Wallet Engine & Money Allocation Math
   "Make money understandable before making it powerful."
   ========================================================================== */

import { state } from './state.js';
import { sound } from './sound.js';

class WalletEngine {
  /**
   * Move money from one wallet to another (Rebalance)
   * Supports 'w-free' as the Free Money pool identifier.
   */
  moveMoney(fromId, toId, amount) {
    amount = Math.round(Number(amount));
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Please enter a valid amount greater than zero.');
    }

    if (fromId === toId) {
      throw new Error('Source and destination wallets must be different.');
    }

    // 1. Check source balance
    let fromBalance = 0;
    let fromName = '';
    if (fromId === 'w-free') {
      fromBalance = state.freeMoneyBalance;
      fromName = 'Free Money';
    } else {
      const sourceWallet = state.wallets.find(w => w.id === fromId);
      if (!sourceWallet) throw new Error('Source wallet not found.');
      fromBalance = sourceWallet.balance;
      fromName = sourceWallet.name;
    }

    if (fromBalance < amount) {
      throw new Error(`Your ${fromName} wallet only has ₹${fromBalance.toLocaleString('en-IN')}.`);
    }

    // 2. Check destination
    let toName = '';
    if (toId === 'w-free') {
      toName = 'Free Money';
    } else {
      const destWallet = state.wallets.find(w => w.id === toId);
      if (!destWallet) throw new Error('Destination wallet not found.');
      toName = destWallet.name;
    }

    // 3. Atomically perform transfer
    if (fromId === 'w-free') {
      state.setFreeMoneyBalance(state.freeMoneyBalance - amount);
    } else {
      const w = state.wallets.find(w => w.id === fromId);
      state.updateWallet(fromId, { balance: w.balance - amount });
    }

    if (toId === 'w-free') {
      state.setFreeMoneyBalance(state.freeMoneyBalance + amount);
    } else {
      const w = state.wallets.find(w => w.id === toId);
      state.updateWallet(toId, { balance: w.balance + amount });
    }

    // 4. Record rebalance activity
    state.addTransaction({
      merchantName: `Moved to ${toName}`,
      amount: amount,
      category: 'general',
      walletId: fromId,
      walletName: fromName,
      type: 'transfer',
      notes: `Rebalanced ₹${amount} from ${fromName} to ${toName}`
    });

    sound.playTap();
    return { success: true, fromName, toName, amount };
  }

  /**
   * Distributes incoming simulated deposit across wallets & Free Money
   * based on user's configured allocation percentages.
   */
  receiveMoney(amount) {
    amount = Math.round(Number(amount));
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Please enter a valid deposit amount.');
    }

    const wallets = state.wallets;
    const freeMoneyPercent = state.data.freeMoneySplitPercent || 0;

    let distributedTotal = 0;
    const distribution = [];

    // Calculate each wallet's share
    wallets.forEach(wallet => {
      const percent = Number(wallet.splitPercent) || 0;
      const allocatedShare = Math.floor(amount * (percent / 100));
      distributedTotal += allocatedShare;

      state.updateWallet(wallet.id, {
        balance: wallet.balance + allocatedShare
      });

      distribution.push({
        id: wallet.id,
        name: wallet.name,
        icon: wallet.icon,
        percentage: percent,
        amount: allocatedShare
      });
    });

    // Remainder (including free money percentage and rounding remainder)
    const remainder = amount - distributedTotal;
    state.setFreeMoneyBalance(state.freeMoneyBalance + remainder);

    distribution.push({
      id: 'w-free',
      name: 'Free Money',
      icon: '🪙',
      percentage: freeMoneyPercent,
      amount: remainder
    });

    // Record credit transaction
    state.addTransaction({
      merchantName: 'Money Received',
      amount: amount,
      category: 'free',
      walletId: 'w-free',
      walletName: 'All Wallets',
      type: 'credit',
      notes: `Automatically allocated across ${wallets.length} wallets`
    });

    sound.playMoneyCascade();
    return {
      totalAmount: amount,
      distribution
    };
  }

  /**
   * Validates and updates the split rules
   */
  saveSplitPercentages(ruleMap, freeMoneyPercent) {
    let totalPercent = Number(freeMoneyPercent) || 0;

    for (const walletId in ruleMap) {
      totalPercent += Number(ruleMap[walletId]) || 0;
    }

    if (totalPercent !== 100) {
      return {
        valid: false,
        totalPercent,
        difference: 100 - totalPercent,
        message: totalPercent < 100 
          ? `Your split is ${totalPercent}%. Add ${100 - totalPercent}% to reach 100%.`
          : `Your split is ${totalPercent}%. Reduce by ${totalPercent - 100}% to reach 100%.`
      };
    }

    // Apply updates
    for (const walletId in ruleMap) {
      state.updateWallet(walletId, { splitPercent: Number(ruleMap[walletId]) });
    }
    state.setFreeMoneySplitPercent(Number(freeMoneyPercent));

    return { valid: true, totalPercent: 100 };
  }

  /**
   * Generates intuitive, human-friendly 1-sentence spending insights
   */
  generateInsights() {
    const insights = [];
    const wallets = state.wallets;
    const foodWallet = wallets.find(w => w.category === 'food');
    const savingsWallet = wallets.find(w => w.category === 'savings');

    // Insight 1: Food spending or usage
    if (foodWallet) {
      if (foodWallet.targetAmount && foodWallet.targetAmount > 0) {
        const percentUsed = Math.min(100, Math.round(((foodWallet.targetAmount - foodWallet.balance) / foodWallet.targetAmount) * 100));
        if (percentUsed > 0) {
          insights.push({
            icon: '🍔',
            label: 'Spending Pace',
            text: `Your Food wallet is ${percentUsed}% used for this month.`
          });
        } else {
          insights.push({
            icon: '🍔',
            label: 'Food Budget',
            text: `You have ₹${foodWallet.balance.toLocaleString('en-IN')} available for Food.`
          });
        }
      }
    }

    // Insight 2: Savings reserve
    if (savingsWallet) {
      insights.push({
        icon: '💰',
        label: 'Savings Goal',
        text: `You have ₹${savingsWallet.balance.toLocaleString('en-IN')} safely reserved for your future.`
      });
    }

    // Insight 3: Free money safety
    if (state.freeMoneyBalance > 0) {
      insights.push({
        icon: '🪙',
        label: 'Safe to Spend',
        text: `You have ₹${state.freeMoneyBalance.toLocaleString('en-IN')} in Free Money to spend on anything.`
      });
    }

    return insights;
  }
}

export const walletEngine = new WalletEngine();
