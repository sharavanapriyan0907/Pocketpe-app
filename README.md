# PocketPe — Intent-Based Money Management App
> *«Every rupee has a purpose.»*

PocketPe is a mobile-first personal money-management prototype whose core philosophy is that **every rupee should have a defined purpose**. Instead of leaving money as an ambiguous single balance where users easily lose track of commitments, PocketPe converts mental money allocation into visible, interactive virtual wallets over a single underlying simulated account.

---

## 🌟 Core Features & Highlights

### 1. Virtual Purpose-Based Wallets
- **Mental Separation Made Visible**: Wallets for Food & Dining, Transport, Savings, College, Friends, Rent, and Free Money.
- **Underlying vs. Allocated Money**:
  $$\text{Total Balance} = \sum (\text{Allocated Wallets}) + \text{Free Money}$$
  Guarantees mathematically consistent conservation of money across all deposits, transfers, and payments.
- **Target Tracking & Status Indicators**: Visual progress meters, remaining amount calculations, and friendly health badges.

### 2. Automatic Money Splitting
- **"How should we split your money?"**: Allocate percentages across wallets and Free Money.
- **100% Validation**: Real-time validation with visual warnings if $< 100\%$ or $> 100\%$, and an **Auto-fill Free Money** button to balance with one tap.
- **Live Rupee Preview**: Dynamically previews exact rupees per purpose for an incoming sample deposit (e.g. ₹10,000).

### 3. Simulated Money Inflow & Animated Cascade
- **"Receive Money"**: Deposit simulated salary or allowance (₹2,000, ₹5,000, ₹10,000, or custom).
- **Cascade Stream Animation**: Watch money physically stream into each wallet card according to its split rule, accompanied by celebratory confetti and harmonic sound effects.

### 4. Smart Payment Experience & QR Scanner
- **Simulated QR Viewfinder**: Animated camera reticle with sweeping laser scan line.
- **One-Tap Demo Scenarios**: Test real-world scenarios immediately:
  - `ABC Restaurant (₹350)` $\rightarrow$ Recommends Food & Dining wallet.
  - `City Pharmacy (₹180)` $\rightarrow$ Recommends Free Money / Health.
  - `Shell Fuel Station (₹650)` $\rightarrow$ Recommends Transport & Fuel wallet.
  - `College Canteen (₹120)` $\rightarrow$ Recommends Food & Dining wallet.
  - `Big Food Feast (₹2,500)` $\rightarrow$ Triggers **Payment Protection**!
  - `Custom Merchant & Amount` $\rightarrow$ Enter any custom scenario.

### 5. Smart Categorization & User Learning
- Automatically categorizes payments using merchant names and MCC patterns.
- **Learning Capability**: If the app recommends Food for a merchant and the user changes it to Shopping, tapping **"Remember this choice"** saves the override locally so all future payments to that merchant automatically recommend Shopping.

### 6. Payment Protection (Zero Panic)
- If a wallet doesn't have enough funds (e.g. paying ₹500 from a wallet that only has ₹100):
- **Never frightens with harsh errors**:
  - Displays a calm, friendly prompt: *"Your Food wallet has ₹100. You need ₹400 more."*
  - **Option 1**: *"Move ₹400 from Free Money & Pay"* (Instant 1-tap resolution!)
  - **Option 2**: *"Choose another wallet"*
  - **Option 3**: *"Cancel"*

### 7. Rebalance Money ("Move Money")
- Move any amount from Wallet A to Wallet B or Free Money with immediate balance updates and activity logging.

### 8. Adaptive Theme Engine
- **Modes**: Light, Dark, and System (auto-matches OS dark mode).
- **6 Accent Colors**:
  - Emerald Fintech (`#10B981`)
  - Indigo Royal (`#6366F1`)
  - Violet Luxe (`#8B5CF6`)
  - Amber Warm (`#F59E0B`)
  - Teal Ocean (`#06B6D4`)
  - Rose Coral (`#F43F5E`)
- Instant CSS Custom Property switching without page reloads.

### 9. Synthesized Web Audio Sound Effects
- Pure Web Audio API synthesized audio (haptic clicks, cascade trickle, payment chime, gentle alert) with zero external asset dependencies.
- Can be toggled on/off in Profile.

### 10. Mobile-First Presentation Shell
- Designed for mobile touch interaction (44px+ touch targets).
- On desktop, renders inside an elegant phone frame with status notch, clock, and battery, plus a toggle to expand to full screen.

---

## 🚀 How to Run the App

### Option A: Using the Launcher (Windows)
Double-click `run_app.bat` or run in terminal:
```bash
python serve.py
```
This automatically starts a local server on port 8080 and opens the app in your default browser at:
`http://localhost:8080`

### Option B: Using Python built-in server
```bash
python -m http.server 8080
```
Then open `http://localhost:8080` in Chrome, Edge, Safari, or your mobile browser.

---

## 🏗️ Architecture & File Structure

```
Pocket pe app/
├── index.html                   # Mobile-first shell, status bar, navigation, modals
├── serve.py                     # Local python HTTP server with auto browser launch
├── run_app.bat                  # One-click Windows launcher
├── README.md                    # Documentation & user guide
├── css/
│   ├── tokens.css               # Centralized design tokens (themes, accents, radii)
│   └── app.css                  # Component styling, animations, phone shell
└── js/
    ├── app.js                   # Application coordinator, router, clock, event bus
    ├── core/
    │   ├── state.js             # Observable reactive state store with LocalStorage
    │   ├── sound.js             # Web Audio API sound synthesis
    │   ├── walletEngine.js      # Allocation math, rebalancing, insights generator
    │   ├── categorizationEngine.js # Merchant MCC classifier & user learning engine
    │   └── paymentEngine.js     # Smart wallet recommendation & payment protection
    ├── components/
    │   └── modals.js            # Modals for Receive, Move, Create Wallet, Onboarding
    └── views/
        ├── homeView.js          # Overview, balance cards, quick actions, wallet cards
        ├── walletsView.js       # Wallets list, search, details drawer, create CTA
        ├── payView.js           # QR scanner simulation, payment confirmation, receipts
        ├── splitView.js         # 100% money split configuration rules & sliders
        ├── activityView.js      # Grouped timeline, category filters, payment details
        └── profileView.js       # Theme switcher, accent colors, sound/privacy toggles
```

---

## 🛡️ Prototype & Fintech Notice
This application is an educational prototype and conceptual MVP. All financial accounts, balances, QR codes, and transactions are strictly simulated mock data. No real banking credentials or real UPI payment networks are connected.
