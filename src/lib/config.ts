// Application Configuration

export const APP_CONFIG = {
  name: "Urbco",
  tagline: "Own a Fraction of Premium Real Estate",
  version: "1.0.0",
  
  // Investment Settings
  minInvestment: 500000, // ₦500,000
  defaultCurrency: "₦",
  maxFractionsPerProperty: 1000,
  
  // Payment Schedules
  paymentSchedules: [
    { value: "full", label: "Full Payment", discount: 0.02, installments: 1 },
    { value: "3-months", label: "3 Months Plan", discount: 0, installments: 3 },
    { value: "6-months", label: "6 Months Plan", discount: 0, installments: 6 },
    { value: "12-months", label: "12 Months Plan", discount: 0, installments: 12 },
  ],
  
  // KYC Settings
  kycRequired: true,
  kycDocuments: [
    "Government-issued ID",
    "Selfie with ID",
    "Proof of Address",
  ],
  
  // Referral Settings
  referralReward: 100000, // ₦100,000 per successful referral
  referralBonusPercentage: 0.01, // 1% of referee's first investment
  
  // Dividend Settings
  dividendFrequency: "quarterly",
  dividendPaymentDay: 15, // Day of month for dividend payments
  
  // Contact Information
  supportEmail: "support@urbcoinvest.com",
  supportPhone: "+234 800 URB CO 00",
  headquarters: "Lagos, Nigeria",
  
  // Social Media
  socialLinks: {
    twitter: "https://twitter.com/urbcoinvest",
    linkedin: "https://linkedin.com/company/urbco-invest",
    instagram: "https://instagram.com/urbcoinvest",
    facebook: "https://facebook.com/urbcoinvest",
  },
};

// Navigation Items
export const NAVIGATION = {
  main: [
    { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { name: "Own-a-Fraction", href: "/marketplace", icon: "Building2" },
    { name: "Portfolio", href: "/portfolio", icon: "PieChart" },
    { name: "Dividends", href: "/dividends", icon: "TrendingUp" },
    { name: "Wallet", href: "/wallet", icon: "Wallet" },
  ],
  secondary: [
    { name: "Notifications", href: "/notifications", icon: "Bell" },
    { name: "Referrals", href: "/referrals", icon: "Gift" },
    { name: "Profile", href: "/profile", icon: "Users" },
    { name: "Settings", href: "/settings", icon: "Settings" },
  ],
};

// Feature Flags
export const FEATURES = {
  enableReferrals: true,
  enableWallet: true,
  enableKYC: true,
  enableNotifications: true,
  enableDarkMode: true,
  enableMultiCurrency: false, // Future feature
  enableSecondaryMarket: false, // Future feature
};

// API Endpoints (for future backend integration)
export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    signup: "/api/auth/signup",
    logout: "/api/auth/logout",
    verifyOTP: "/api/auth/verify-otp",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
  },
  properties: {
    list: "/api/properties",
    detail: "/api/properties/[id]",
    search: "/api/properties/search",
  },
  investments: {
    list: "/investments/me",
    create: "/investments",
    detail: "/investments/[id]",
  },
  dividends: {
    list: "/api/dividends",
    history: "/api/dividends/history",
  },
  wallet: {
    balance: "/api/wallet/balance",
    deposit: "/api/wallet/deposit",
    withdraw: "/api/wallet/withdraw",
    transactions: "/api/wallet/transactions",
  },
  user: {
    profile: "/api/user/profile",
    kyc: "/api/user/kyc",
    referrals: "/api/user/referrals",
  },
};

// Export default config
export default APP_CONFIG;
