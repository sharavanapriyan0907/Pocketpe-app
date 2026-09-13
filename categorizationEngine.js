/* ==========================================================================
   PocketPe - Smart Merchant Categorization Engine & User Learning
   ========================================================================== */

import { state } from './state.js';

// Pre-configured Merchant Directory with MCC (Merchant Category Codes) & Keywords
export const KNOWN_MERCHANTS = [
  {
    pattern: /restaurant|canteen|cafe|coffee|starbucks|pizza|burger|food|bistro|diner|mcdonald|subway|swiggy|zomato/i,
    category: 'food',
    categoryLabel: 'Food & Dining',
    mockMcc: '5812',
    icon: '🍔'
  },
  {
    pattern: /fuel|petrol|diesel|shell|hp|indianoil|bpcl|transit|bus|metro|uber|ola|cab|auto|toll/i,
    category: 'transport',
    categoryLabel: 'Transport & Fuel',
    mockMcc: '5541',
    icon: '🚗'
  },
  {
    pattern: /pharmacy|hospital|clinic|apollo|medplus|doctor|health|dental|optician/i,
    category: 'health',
    categoryLabel: 'Health & Medical',
    mockMcc: '5912',
    icon: '💊'
  },
  {
    pattern: /college|books|stationery|tuition|exam|course|udemy|coursera|university|school/i,
    category: 'college',
    categoryLabel: 'College & Education',
    mockMcc: '8299',
    icon: '🎓'
  },
  {
    pattern: /barber|salon|spa|grooming|beauty|fitness|gym/i,
    category: 'personal',
    categoryLabel: 'Personal Care',
    mockMcc: '7230',
    icon: '✂️'
  },
  {
    pattern: /netflix|spotify|cinema|pvr|inox|movie|gaming|steam|playstation/i,
    category: 'entertainment',
    categoryLabel: 'Entertainment',
    mockMcc: '7832',
    icon: '🎬'
  },
  {
    pattern: /friend|rahul|priya|amit|split|party|dinner\sout/i,
    category: 'friends',
    categoryLabel: 'Friends & Social',
    mockMcc: '4829',
    icon: '🤝'
  },
  {
    pattern: /rent|flat|landlord|maintenance|housing|society/i,
    category: 'rent',
    categoryLabel: 'Rent & Housing',
    mockMcc: '6513',
    icon: '🏠'
  },
  {
    pattern: /emi|loan|credit\scard|insurance|hdfc|sbi|icici|axis/i,
    category: 'emi',
    categoryLabel: 'EMI & Loans',
    mockMcc: '6012',
    icon: '💳'
  }
];

export const CATEGORY_DEFINITIONS = [
  { id: 'food', label: 'Food & Dining', icon: '🍔' },
  { id: 'transport', label: 'Transport & Fuel', icon: '🚗' },
  { id: 'savings', label: 'Savings & Investments', icon: '💰' },
  { id: 'college', label: 'College & Education', icon: '🎓' },
  { id: 'friends', label: 'Friends & Social', icon: '🤝' },
  { id: 'health', label: 'Health & Wellness', icon: '💊' },
  { id: 'rent', label: 'Rent & Housing', icon: '🏠' },
  { id: 'emi', label: 'EMI & Debt', icon: '💳' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'personal', label: 'Personal Care', icon: '✂️' },
  { id: 'shopping', label: 'Shopping & Retail', icon: '🛍️' },
  { id: 'free', label: 'Free Money', icon: '🪙' },
  { id: 'general', label: 'General / Other', icon: '💼' }
];

class CategorizationEngine {
  /**
   * Identifies category for a given merchant name.
   * Priority:
   * 1. User learned override from previous corrections
   * 2. Pattern & keyword matching from KNOWN_MERCHANTS
   * 3. Fallback to 'general'
   */
  categorizeMerchant(merchantName) {
    if (!merchantName) {
      return {
        category: 'general',
        categoryLabel: 'General Expense',
        icon: '💼',
        isUserLearned: false,
        mockMcc: '0000'
      };
    }

    const cleanName = merchantName.trim().toLowerCase();

    // 1. Check user learned memory
    const userOverrides = state.merchantOverrides;
    if (userOverrides && userOverrides[cleanName]) {
      const catId = userOverrides[cleanName];
      const def = CATEGORY_DEFINITIONS.find(c => c.id === catId) || {
        id: catId,
        label: catId.charAt(0).toUpperCase() + catId.slice(1),
        icon: '🏷️'
      };
      return {
        category: def.id,
        categoryLabel: def.label,
        icon: def.icon,
        isUserLearned: true,
        mockMcc: 'USER_RULE'
      };
    }

    // 2. Exact or regex match
    for (const rule of KNOWN_MERCHANTS) {
      if (rule.pattern.test(merchantName)) {
        return {
          category: rule.category,
          categoryLabel: rule.categoryLabel,
          icon: rule.icon,
          isUserLearned: false,
          mockMcc: rule.mockMcc
        };
      }
    }

    // 3. Fallback
    return {
      category: 'general',
      categoryLabel: 'General Expense',
      icon: '💼',
      isUserLearned: false,
      mockMcc: '5399'
    };
  }

  /**
   * Teach the engine a new categorization for a merchant
   */
  teachCategory(merchantName, newCategoryId) {
    state.setMerchantCategoryOverride(merchantName, newCategoryId);
  }

  getCategoryInfo(categoryId) {
    return CATEGORY_DEFINITIONS.find(c => c.id === categoryId) || {
      id: categoryId,
      label: categoryId,
      icon: '💼'
    };
  }
}

export const categorizationEngine = new CategorizationEngine();
