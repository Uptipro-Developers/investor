import { create } from "zustand";
import { User, Property, Investment, Dividend, Transaction, Notification, Wallet, Referral, InstitutionalProfile } from "@/types";
import { currentUser, wallet as initialWallet, investments, dividends, transactions, notifications, referral } from "@/data/mockData";
import { api, authAPI, authStorage, propertiesAPI } from "@/lib/api";

interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;

  // Data
  properties: Property[];
  propertiesLoading: boolean;
  propertiesError: string | null;
  investments: Investment[];
  dividends: Dividend[];
  transactions: Transaction[];
  notifications: Notification[];
  wallet: Wallet;
  referral: Referral;

  // Institutional onboarding
  institutionalProfile: InstitutionalProfile | null;

  // UI State
  isSidebarOpen: boolean;
  theme: "light" | "dark";

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addTransaction: (transaction: Transaction) => void;
  addInvestment: (investment: Investment) => void;
  updateWallet: (balance: number) => void;
  setKycStatus: (status: User["kycStatus"], remediationItems?: string[]) => void;
  saveInstitutionalProfile: (profile: InstitutionalProfile) => void;
  loadProperties: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial State
  user: null,
  isAuthenticated: false,
  
  properties: [],
  propertiesLoading: false,
  propertiesError: null,
  investments,
  dividends,
  transactions,
  notifications,
  wallet: initialWallet,
  referral,
  
  isSidebarOpen: true,
  theme: "light",

  institutionalProfile: null,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  login: async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (email && password) {
      set({ user: currentUser, isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  logout: () => {
    void authAPI.logout();
    authStorage.clear();
    api.clearAuthToken();
    set({ user: null, isAuthenticated: false });
    if (typeof window !== "undefined") window.location.assign("/auth/login");
  },
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
  
  markNotificationAsRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  
  markAllNotificationsAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  
  addTransaction: (transaction: Transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
  
  addInvestment: (investment: Investment) =>
    set((state) => ({
      investments: [...state.investments, investment],
    })),
  
  updateWallet: (balance: number) =>
    set((state) => ({
      wallet: { ...state.wallet, balance },
    })),

  setKycStatus: (status, remediationItems) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            kycStatus: status,
            kycSubmittedAt: status !== "pending" ? state.user.kycSubmittedAt ?? new Date() : state.user.kycSubmittedAt,
            kycVerifiedAt: status === "verified" ? new Date() : state.user.kycVerifiedAt,
            kycRemediationItems: remediationItems ?? state.user.kycRemediationItems,
          }
        : state.user,
    })),

  saveInstitutionalProfile: (profile) => set({ institutionalProfile: profile }),

  loadProperties: async () => {
    set({ propertiesLoading: true, propertiesError: null });
    const response = await propertiesAPI.list({ limit: "100" });
    if (!response.success || !response.data) {
      set({ properties: [], propertiesLoading: false, propertiesError: response.error || "Unable to load marketplace assets." });
      return;
    }
    set({ properties: response.data.data, propertiesLoading: false, propertiesError: null });
  },
}));
