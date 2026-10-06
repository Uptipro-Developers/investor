export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  country: string;
  investmentExperience: "beginner" | "intermediate" | "advanced";
  riskAppetite: "low" | "medium" | "high";
  kycStatus: "pending" | "under_review" | "verified" | "failed" | "remediation_required";
  kycSubmittedAt?: Date;
  kycVerifiedAt?: Date;
  kycRemediationItems?: string[];
  investorTrack?: "foundry" | "harbor";
  entityType?: "individual" | "family-office" | "institution";
  avatar?: string;
  createdAt: Date;
}

export interface UnitType {
  id: string;
  name: string;
  type: "studio" | "1-bed" | "2-bed" | "3-bed" | "4-bed" | "penthouse" | "office" | "retail" | "custom";
  count: number;
  sizeSqm: number;
  bedrooms?: number;
  bathrooms?: number;
  basePrice?: number;
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: Date;
  releasePct: number;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "verified";
}

export interface FractionTier {
  id: string;
  name: string;
  totalFractions: number;
  pricePerFraction: number;
  minInvestment: number;
  maxInvestment?: number;
  benefits?: string[];
}

export interface SettlementStage {
  key: "terms" | "payment" | "custody" | "reconciliation" | "release";
  label: string;
  description?: string;
  status: "pending" | "completed";
}

export interface BuyingPath {
  type: "investment" | "ownership" | "both";
  // Investment path
  interestStructure?: "single-ticket" | "fractional";
  instrument?: string;
  minimumInvestment?: number;
  totalFundingRequired?: number;
  investmentWindow?: { open: Date; close: Date };
  investorRights?: string;
  exitRedemptionTerms?: string;
  fractionBreakdown?: FractionTier[];
  // Ownership path
  releaseBasis?: "milestone" | "scheduled";
  milestones?: Milestone[];
  titleTerms?: string;
  // Per-path settlement flow (Step 3): Terms -> Payment -> Trustee custody -> Reconciliation -> Release
  settlementFlow?: SettlementStage[];
}

export interface PaymentOption {
  type: "one-time" | "investment-window" | "scheduled-tranche" | "milestone-based";
  label: string;
  description: string;
  downPaymentPct?: number;
  trancheCount?: number;
  tranchePeriodMonths?: number;
  windowOpen?: Date;
  windowClose?: Date;
}

export interface StageDiscount {
  stage: "pre-development" | "post-development";
  discountPct: number;
  description: string;
}

export interface ReturnsProjection {
  projectedRentalIncome: number;
  frequency: "monthly" | "quarterly" | "annually";
  operatingCosts: number;
  capitalAppreciation: number;
  firstPayoutDate: Date;
  yieldRange: [number, number];
  appreciationRange: [number, number];
  totalReturnRange: [number, number];
}

export interface RiskAssessment {
  constructionProgress: number;
  riskLevel: "low" | "medium" | "high";
  riskFactors: string[];
  offPlanSecurity: string;
  exitLiquidity: string;
  managementMode: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: "legal" | "financial" | "technical" | "marketing" | "other";
  url: string;
  uploadedAt: Date;
  size: number;
}

export interface VirtualTour {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
}

export interface CommissionStructure {
  leadPct: number;
  closerPct: number;
  totalPct: number;
  calculatedAmount: number;
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  location: string;
  fullAddress: string;
  propertyType: "residential" | "commercial" | "mixed-use" | "land";
  description: string;
  images: string[];
  videoUrl?: string;
  rooms: number;
  bathrooms: number;
  squareMeters: number;
  amenities: string[];
  furnishingStatus: "furnished" | "unfurnished" | "partially-furnished";
  constructionStatus: "completed" | "ongoing" | "planned";
  constructionTimeline?: string;
  developmentStage: "pre-development" | "post-development";
  targetTrack: "foundry" | "harbor" | "both";
  minimumInvestment?: number;

  // Step 1 — Identity & Status
  referenceCode: string;
  developerCompany: string;
  projectStatus: "planning" | "approved" | "under-construction" | "completed" | "operational";

  // Step 2 — Physical & Functional
  landSizeSqm: number;
  builtSizeSqm: number;
  constructionStartDate: Date;
  constructionEndDate: Date;
  totalUnits: number;
  availableUnits: number;
  unitConfiguration: UnitType[];
  facilityManagement: boolean;

  // Step 3 — Investment Program & Buying Paths
  investmentProgram: "foundry" | "harbor";
  buyingPaths: BuyingPath[];

  // Step 4 — Pricing & Payment Logic
  pricing: {
    basePrice: number;
    markupPct: number;
    finalSellingPrice: number;
    paymentOptions: PaymentOption[];
    discounts: StageDiscount[];
  };

  // Step 5 — Returns & Projections
  returns: ReturnsProjection;

  // Step 6 — Risk & Management Assessment
  risk: RiskAssessment;

  // Step 7 — Media & Documentation
  documents: DocumentFile[];
  virtualTours: VirtualTour[];

  // Step 8 — Commission Setup
  commission: CommissionStructure;

  // Financial (existing)
  propertyValue: number;
  investmentAvailable: number;
  costPerFraction: number;
  totalFractions: number;
  fractionsSold: number;
  investorsCount: number;

  rentalYield: number;
  rentPerQuarter: number;
  capitalAppreciation: number;
  firstDividendDate: string;
  projectedROI: number;

  status: "draft" | "active" | "archived" | "open" | "funding" | "closed" | "completed";
  fundingProgress: number;
  featured: boolean;
  createdAt: Date;
}

export interface Investment {
  id: string;
  userId: string;
  propertyId: string;
  property: Property;
  fractionsOwned: number;
  amountInvested: number;
  currentValuation: number;
  roi: number;
  paymentSchedule: PaymentSchedule;
  buyingPath: "investment" | "ownership";
  status: "active" | "completed" | "pending";
  purchaseDate: Date;
  nextDividendDate: string;
  milestonesCompleted?: string[];
}

export interface PaymentSchedule {
  type: "full" | "3-months" | "6-months" | "12-months" | "custom" | "investment-window" | "milestone-based" | "scheduled-tranche";
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installments: Installment[];
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: "paid" | "pending" | "overdue";
  paidDate?: string;
  milestoneId?: string;
}

export interface Dividend {
  id: string;
  investmentId: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  period: string;
  status: "paid" | "pending" | "upcoming";
  paymentDate: string;
}

export interface Transaction {
  id: string;
  type: "investment" | "dividend" | "deposit" | "withdrawal" | "refund" | "payment";
  amount: number;
  status: "completed" | "pending" | "failed";
  description: string;
  date: string;
  reference?: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

export interface Notification {
  id: string;
  type: "dividend" | "payment" | "asset" | "opportunity" | "alert" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Referral {
  id: string;
  userId: string;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  referrals: ReferralUser[];
}

export interface ReferralUser {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  status: "pending" | "active" | "invested";
  reward: number;
}

export interface DashboardMetrics {
  totalInvested: number;
  portfolioValue: number;
  projectedAnnualReturns: number;
  totalDividendsEarned: number;
  activeInvestments: number;
  portfolioGrowth: { month: string; value: number }[];
  assetAllocation: { name: string; value: number }[];
}

export interface FilterOptions {
  location?: string;
  propertyType?: string;
  roiRange?: [number, number];
  fundingStatus?: string;
  rentalYield?: [number, number];
  minInvestment?: number;
  constructionStatus?: string;
  developmentStage?: string;
  targetTrack?: string;
  buyingPath?: string;
}

export interface InstitutionalProfile {
  id: string;
  userId: string;
  companyName: string;
  tradingName?: string;
  cacNumber: string;
  companyType: "Ltd" | "PLC" | "LLP" | "Other";
  incorporationDate: Date;
  industry: string;
  natureOfBusiness: string;
  countryOfRegistration: string;
  registeredAddress: Address;
  operatingAddress: Address;
  officialEmail: string;
  officialPhone: string;
  website?: string;
  institutionType: "pension-fund" | "asset-manager" | "insurance" | "bank" | "private-equity" | "family-office" | "corporate" | "dfi" | "government" | "reit" | "other";
  ownershipType: "private" | "public" | "government" | "joint-venture";
  authorisedRep: AuthorisedRep;
  investmentProfile: InvestmentProfile;
  onboardingDocuments: string[];
  status: "onboarding_submitted" | "kyc_kb_pending" | "kyc_remediation" | "kyc_verified" | "kyc_failed";
  kycData?: InstitutionalKYC;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  address: string;
  city: string;
  lga?: string;
  state: string;
  country: string;
}

export interface AuthorisedRep {
  fullName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
}

export interface InvestmentProfile {
  investmentObjective: string;
  preferredSectors: string[];
  preferredProjectTypes: string[];
  geographicPreference: string[];
  minimumInvestment: number;
  maximumInvestment: number;
  typicalTicketSize: number;
  investmentHorizon: string;
  preferredStructure: ("equity" | "debt" | "revenue-share" | "jv")[];
  preferredCurrency: string;
}

export interface InstitutionalKYC {
  corporateDocuments: {
    cacCertificate: DocumentFile;
    cacExtract: DocumentFile;
    memorandumArticles: DocumentFile;
    taxId: DocumentFile;
    addressProof: DocumentFile;
    regulatoryLicense?: DocumentFile;
  };
  directors: Director[];
  shareholders: Shareholder[];
  ubos: UBO[];
  authorisedRepVerification: DocumentFile;
  authorisedSignatoryVerification: DocumentFile;
  screenings: {
    sanctions: ScreeningResult;
    pep: ScreeningResult;
    adverseMedia: ScreeningResult;
    amlRisk: ScreeningResult;
  };
}

export interface Director {
  fullName: string;
  position: string;
  nationality: string;
  idDocument: DocumentFile;
  isUBO: boolean;
}

export interface Shareholder {
  name: string;
  percentage: number;
  type: "individual" | "corporate";
  idDocument?: DocumentFile;
}

export interface UBO {
  fullName: string;
  nationality: string;
  percentage: number;
  idDocument: DocumentFile;
  sourceOfWealth: string;
}

export interface ScreeningResult {
  status: "clear" | "match" | "pending";
  details?: string;
  checkedAt: Date;
}

export interface KYCProgress {
  step: number;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  documents?: DocumentFile[];
}
