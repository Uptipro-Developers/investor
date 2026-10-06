// API Helper Utilities for Backend Integration

import { APP_CONFIG, API_ENDPOINTS } from "./config";
import type { Property } from "@/types";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retry?: number;
  skipAuthRefresh?: boolean;
}

// Base API client
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseURL: string = "", timeout: number = 30000) {
    this.baseURL = baseURL.replace(/\/+$/, "");
    this.timeout = timeout;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Clear authentication token
  clearAuthToken() {
    delete this.defaultHeaders["Authorization"];
  }

  // Build URL
  private buildURL(endpoint: string): string {
    if (endpoint.startsWith("http")) return endpoint;
    const path = endpoint.replace(/^\/+/, "");
    return this.baseURL ? `${this.baseURL}/${path}` : `/${path}`;
  }

  // Create timeout promise
  private createTimeout(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), timeout);
    });
  }

  private storedToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("auth_token");
  }

  private async refreshAuthToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(this.buildURL("auth/refresh"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: "{}",
        });
        if (!response.ok) throw new Error("Refresh failed");
        const data = await response.json();
        if (!data?.access_token) throw new Error("Refresh response did not include an access token");
        window.localStorage.setItem("auth_token", data.access_token);
        this.setAuthToken(data.access_token);
        return data.access_token as string;
      } catch {
        window.localStorage.removeItem("auth_token");
        this.clearAuthToken();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Generic request method
  async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = this.timeout, retry = 1, headers = {}, skipAuthRefresh = false, ...restConfig } = config;

    const url = this.buildURL(endpoint);
    const requestHeaders = new Headers(this.defaultHeaders);
    const storedToken = this.storedToken();
    if (storedToken) {
      requestHeaders.set("Authorization", `Bearer ${storedToken}`);
      this.setAuthToken(storedToken);
    }
    new Headers(headers).forEach((value, key) => requestHeaders.set(key, value));
    if (typeof FormData !== "undefined" && restConfig.body instanceof FormData) {
      requestHeaders.delete("Content-Type");
    }
    const requestConfig: RequestInit = {
      ...restConfig,
      credentials: restConfig.credentials ?? "include",
      headers: requestHeaders,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retry; attempt++) {
      try {
        let response = await Promise.race([
          fetch(url, requestConfig),
          this.createTimeout(timeout),
        ]);

        if (response.status === 401 && !skipAuthRefresh && endpoint !== "auth/refresh") {
          const refreshedToken = await this.refreshAuthToken();
          if (refreshedToken) {
            requestHeaders.set("Authorization", `Bearer ${refreshedToken}`);
            response = await Promise.race([
              fetch(url, { ...requestConfig, headers: requestHeaders }),
              this.createTimeout(timeout),
            ]);
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = response.status === 401
            ? "Your session has expired. Please sign in again."
            : errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(message);
        }

        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        lastError = error as Error;
        if (attempt < retry - 1) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || "Unknown error occurred",
    };
  }

  // HTTP methods
  async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async postForm<T>(endpoint: string, data: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  async download(endpoint: string): Promise<ApiResponse<Blob>> {
    try {
      const response = await fetch(this.buildURL(endpoint), {
        method: "GET",
        credentials: "include",
        headers: { ...this.defaultHeaders },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || `Download failed (${response.status})` };
      }
      return { success: true, data: await response.blob() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Download failed" };
    }
  }
}

// Create API instance. ApiClient normalize trailing/leading slashes.

let currentUrl, defaultApiUrl;
if (typeof window !== "undefined") {
  currentUrl = window.location.href;
  defaultApiUrl = currentUrl.includes('investor-git-development-uptipros-projects.vercel.app') ? 'https://buyops-backend-development.up.railway.app' : currentUrl.includes('localhost') ? 'http://localhost:1000' : process.env.NEXT_PUBLIC_API_URL

}
// const defaultApiUrl = process.env.NODE_ENV === "development" ? "http://localhost:1000" : "";
export const api = new ApiClient(defaultApiUrl);

// Auth API
export const authAPI = {
  loginInvestor: (email: string, password: string, rememberMe: boolean) =>
    api.post<InvestorLoginResponse>("auth/investor/login", { email, password, rememberMe }),

  signup: (data: any) =>
    api.post<{ token: string; user: any }>(API_ENDPOINTS.auth.signup, data),

  logout: () => api.post("auth/logout"),

  verifyOTP: (email: string, otp: string) =>
    api.post(API_ENDPOINTS.auth.verifyOTP, { email, otp }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("auth/investor/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("auth/investor/reset-password", { token, password }),

  registerInvestor: (data: InvestorRegistrationRequest) =>
    api.post<InvestorRegistrationResponse>("auth/investor/register", data),

  verifyInvestorEmail: (email: string, code: string) =>
    api.post<InvestorVerificationResponse>("auth/investor/verify-email", { email, code }),

  resendInvestorVerification: (email: string) =>
    api.post<{ message: string }>("auth/investor/resend-verification", { email }),

  investorProfile: () =>
    api.get<InvestorProfileResponse>("auth/investor/me"),
};

export interface InvestorAuthContext {
  track: "FOUNDRY" | "HARBOR";
  entityType: "INDIVIDUAL" | "FAMILY_OFFICE" | "INSTITUTION";
  onboardingStatus: "EMAIL_PENDING" | "PROFILE_PENDING" | "KYC_PENDING" | "UNDER_REVIEW" | "REMEDIATION_REQUIRED" | "VERIFIED" | "REJECTED";
}

export interface InvestorRegistrationRequest {
  track: "FOUNDRY" | "HARBOR";
  entityType: "INDIVIDUAL" | "FAMILY_OFFICE" | "INSTITUTION";
  account: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    countryCode: string;
  };
  individual?: {
    dateOfBirth: string;
    nationality?: string;
    primaryIdType: string;
    sourceOfFunds: string;
    employmentStatus: string;
  };
  entity?: {
    legalName: string;
    registrationNumber?: string;
    countryCode: string;
    institutionType?: string;
    taxId?: string;
    regulatorName?: string;
    representativeDateOfBirth?: string;
    aumMin?: number;
    aumMax?: number;
    aumCurrency?: string;
  };
  investmentPreference?: {
    currency: string;
    minimumTicket: number;
    maximumTicket?: number;
    preferredAsset?: string;
    horizonMinMonths?: number;
    horizonMaxMonths?: number;
    preferredStructure?: string;
  };
  consent: {
    termsVersion: string;
    privacyVersion: string;
  };
}

export interface InvestorRegistrationResponse {
  registrationId: string;
  email: string;
  verificationRequired: true;
  nextStep: "VERIFY_EMAIL";
}

export interface InvestorVerificationResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    role: string;
  };
  investor: InvestorAuthContext;
  nextStep: "DASHBOARD" | "ENTITY_ONBOARDING";
}

export type InvestorLoginResponse =
  | {
    verificationRequired: true;
    email: string;
    nextStep: "VERIFY_EMAIL";
  }
  | {
    access_token: string;
    user: {
      id: string;
      email: string;
      name: string;
      phone?: string | null;
      role: string;
    };
    investor: InvestorAuthContext;
    nextStep: "DASHBOARD" | "ENTITY_ONBOARDING";
  };

export interface InvestorProfileResponse {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  investor: InvestorAuthContext;
}

export interface InvestorAssetListResponse {
  data: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  track: "FOUNDRY" | "HARBOR";
}

export type KycFieldRequirement = {
  code: string;
  label: string;
  type?: "text" | "email" | "textarea";
};

export type KycDocumentRequirement = {
  code: string;
  label: string;
  description: string;
  required: boolean;
};

export type InvestorKycResponse = {
  id: string;
  investor: InvestorProfileResponse["investor"] & {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  profile: Record<string, string | string[]>;
  declarations: Record<string, string | string[]>;
  requirements: {
    profileFields: KycFieldRequirement[];
    declarationFields: KycFieldRequirement[];
    documents: KycDocumentRequirement[];
  };
  documents: Array<{
    id: string;
    requirementCode: string;
    label: string;
    required: boolean;
    originalName: string;
    mimeType: string;
    size: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string | null;
    uploadedAt: string;
    downloadUrl: string;
  }>;
  remediationItems: Array<{
    id: string;
    requirementCode: string;
    category: "PROFILE" | "DOCUMENT" | "DECLARATION";
    label: string;
    reason: string;
  }>;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  submissionRevision: number;
  completion: {
    percent: number;
    profile: { done: number; total: number };
    declarations: { done: number; total: number };
    documents: { done: number; total: number };
  };
};

export const investorKycAPI = {
  get: () => api.get<InvestorKycResponse>("investor/kyc"),
  save: (profile: Record<string, unknown>, declarations: Record<string, unknown>) =>
    api.put<InvestorKycResponse>("investor/kyc", { profile, declarations }),
  uploadDocument: (requirementCode: string, file: File) => {
    const data = new FormData();
    data.append("requirementCode", requirementCode);
    data.append("file", file);
    return api.postForm<InvestorKycResponse["documents"][number]>("investor/kyc/documents", data);
  },
  deleteDocument: (documentId: string) =>
    api.delete<{ success: boolean }>(`/investor/kyc/documents/${encodeURIComponent(documentId)}`),
  submit: () => api.post<InvestorKycResponse>("investor/kyc/submit"),
  downloadDocument: (documentId: string) =>
    api.download(`/investor/kyc/documents/${encodeURIComponent(documentId)}`),
};

// Properties API
export const propertiesAPI = {
  list: (params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";
    return api.get<InvestorAssetListResponse>(`/investor/assets${queryString}`);
  },

  detail: (slug: string) =>
    api.get<Property>(`/investor/assets/${encodeURIComponent(slug)}`),

  downloadDocument: (slug: string, documentId: string) =>
    api.download(`/investor/assets/${encodeURIComponent(slug)}/documents/${encodeURIComponent(documentId)}/download`),

  search: (query: string) =>
    api.get<InvestorAssetListResponse>(`/investor/assets?search=${encodeURIComponent(query)}`),
};

// Investments API
export const investmentsAPI = {
  list: () => api.get<any[]>(API_ENDPOINTS.investments.list),

  create: (data: any) =>
    api.post<any>(API_ENDPOINTS.investments.create, data),

  detail: (id: string) =>
    api.get<any>(API_ENDPOINTS.investments.detail.replace("[id]", id)),
};

export const paymentsAPI = {
  initialize: (data: {
    provider: "paystack" | "flutterwave";
    email: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown>;
    title?: string;
  }) => api.post<{ provider: string; reference: string; authorizationUrl?: string }>('payments/initialize', data),
  verify: (provider: "paystack" | "flutterwave", reference: string) =>
    api.get<{ provider: string; reference: string; status: string; amount?: number; currency?: string; customerEmail?: string }>(`/payments/verify?provider=${provider}&reference=${encodeURIComponent(reference)}`),
};

// Dividends API
export const dividendsAPI = {
  list: () => api.get<any[]>(API_ENDPOINTS.dividends.list),

  history: () => api.get<any[]>(API_ENDPOINTS.dividends.history),
};

// Wallet API
export const walletAPI = {
  balance: () => api.get<{ balance: number }>(API_ENDPOINTS.wallet.balance),

  deposit: (amount: number, method: string) =>
    api.post<any>(API_ENDPOINTS.wallet.deposit, { amount, method }),

  withdraw: (amount: number, bankAccount: string) =>
    api.post<any>(API_ENDPOINTS.wallet.withdraw, { amount, bankAccount }),

  transactions: (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";
    return api.get<any[]>(`${API_ENDPOINTS.wallet.transactions}${queryString}`);
  },
};

// User API
export const userAPI = {
  profile: () => api.get<any>(API_ENDPOINTS.user.profile),

  updateProfile: (data: any) =>
    api.put<any>(API_ENDPOINTS.user.profile, data),

  kyc: () => api.get<any>(API_ENDPOINTS.user.kyc),

  submitKYC: (data: FormData) => api.postForm<any>(API_ENDPOINTS.user.kyc, data),

  referrals: () => api.get<any>(API_ENDPOINTS.user.referrals),
};

// Helper functions
export function handleApiError(error: any): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error?.message) return error.message;
  return "An unexpected error occurred";
}

export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { data: T } {
  return response.success && response.data !== undefined;
}

// Local storage utilities for auth
export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  },

  setToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("auth_token", token);
  },

  removeToken: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
  },

  getUser: (): any | null => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: any): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("user", JSON.stringify(user));
  },

  removeUser: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },
};

// Initialize API with stored token
if (typeof window !== "undefined") {
  const token = authStorage.getToken();
  if (token) {
    api.setAuthToken(token);
  }
}
