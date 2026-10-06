import { Property, Investment, Dividend, Transaction, Notification, Referral, DashboardMetrics, UnitType, BuyingPath, Milestone, FractionTier, PaymentOption, StageDiscount, ReturnsProjection, RiskAssessment, DocumentFile, VirtualTour, CommissionStructure, SettlementStage } from "@/types";

type AdminSeed = {
  targetTrack: "foundry" | "harbor" | "both";
  developmentStage: "pre-development" | "post-development";
  propertyValue: number;
  investmentAvailable: number;
  minimumInvestment?: number;
  fundingProgress: number;
  firstDividendDate: string;
  rentalYield: number;
  capitalAppreciation: number;
  squareMeters: number;
  rooms: number;
};

function deriveAdmin(p: AdminSeed) {
  const track = p.targetTrack;
  const investmentProgram: "foundry" | "harbor" = track === "harbor" ? "harbor" : "foundry";
  const isPre = p.developmentStage === "pre-development";
  const refPrefix = track === "harbor" ? "URB-H" : "URB-F";
  const totalUnits = Math.max(8, Math.round(p.rooms / 2) || 20);
  const availableUnits = Math.max(1, Math.round(totalUnits * (1 - p.fundingProgress / 100)));

  const unitConfiguration: UnitType[] = [
    { id: "uc-1", name: "Standard Unit", type: "custom", count: totalUnits, sizeSqm: Math.round(p.squareMeters / totalUnits), bedrooms: 2, bathrooms: 2, basePrice: p.propertyValue },
    { id: "uc-2", name: "Premium Unit", type: "custom", count: Math.round(totalUnits / 4), sizeSqm: Math.round(p.squareMeters / totalUnits) * 2, bedrooms: 3, bathrooms: 3, basePrice: Math.round(p.propertyValue * 1.4) },
  ];

  const settlementFlow: SettlementStage[] = [
    { key: "terms", label: "Terms Agreed", description: "Offering terms & investment agreement executed.", status: "completed" },
    { key: "payment", label: "Payment Instruction", description: "Investor payment instruction captured and confirmed.", status: "completed" },
    { key: "custody", label: "Trustee Custody", description: "Capital lodged with Urbco Trustee in escrow.", status: "completed" },
    { key: "reconciliation", label: "Reconciliation", description: "Independent reconciliation of funds against units.", status: "completed" },
    { key: "release", label: "Release", description: "Funds / title released per the agreed schedule.", status: "pending" },
  ];

  const investmentPath: BuyingPath = {
    type: "investment",
    interestStructure: "fractional",
    instrument: investmentProgram === "foundry" ? "Urbco Institutional Note" : "Urbco Fractional Certificate",
    minimumInvestment: p.minimumInvestment ?? 1000000,
    totalFundingRequired: p.investmentAvailable,
    investmentWindow: { open: new Date("2026-01-01"), close: new Date("2026-12-31") },
    investorRights: "Quarterly income distributions, proportional voting on asset-level decisions, priority redemption queue.",
    exitRedemptionTerms: investmentProgram === "foundry"
      ? "Early exit via secondary transfer window opening 12 months post-close; 5% liquidity fee."
      : "Title-linked exit on milestone completion; settlement via trustee within 30 days of request.",
    fractionBreakdown: [
      { id: "ft-1", name: "Tier 1 — Lead Allocation", totalFractions: 200, pricePerFraction: p.minimumInvestment ?? 1000000, minInvestment: 0, maxInvestment: 50000000, benefits: ["Priority allotment", "Founder investor badge"] },
      { id: "ft-2", name: "Tier 2 — General", totalFractions: 600, pricePerFraction: Math.round((p.minimumInvestment ?? 1000000) * 1.05), minInvestment: 50000000, benefits: ["Standard allocation"] },
    ] as FractionTier[],
    settlementFlow,
  };

  const ownershipPath: BuyingPath = {
    type: "ownership",
    releaseBasis: "milestone",
    milestones: [
      { id: "ms-1", name: "Foundation & Substructure", targetDate: new Date("2026-06-30"), releasePct: 25, description: "Groundworks and foundation complete, independently verified.", status: "pending" },
      { id: "ms-2", name: "Superstructure Topping Out", targetDate: new Date("2026-12-31"), releasePct: 35, description: "Structural frame complete to roof level.", status: "pending" },
      { id: "ms-3", name: "Fit-Out & Commissioning", targetDate: new Date("2027-06-30"), releasePct: 25, description: "Internal fit-out and services commissioned.", status: "pending" },
      { id: "ms-4", name: "Handover & Title Perfection", targetDate: new Date("2027-12-31"), releasePct: 15, description: "Final handover and registered title perfection.", status: "pending" },
    ] as Milestone[],
    titleTerms: "Legal title held by Urbco Trustee in escrow, perfected and assigned to investor pro-rata on final milestone clearance.",
    settlementFlow,
  };

  const buyingPaths: BuyingPath[] =
    track === "both" ? [investmentPath, ownershipPath]
    : track === "harbor" ? [ownershipPath]
    : [investmentPath];

  const paymentOptions: PaymentOption[] =
    track === "harbor"
      ? [
          { type: "milestone-based", label: "Milestone-Linked Tranches", description: "Capital released in line with verified construction milestones.", downPaymentPct: 25 },
          { type: "scheduled-tranche", label: "Scheduled Tranche", description: "Equal quarterly tranches across the build period.", downPaymentPct: 20, trancheCount: 4, tranchePeriodMonths: 3 },
        ]
      : [
          { type: "investment-window", label: "Investment Window", description: "Single allocation within the open funding window.", downPaymentPct: 100 },
          { type: "one-time", label: "One-Time Settlement", description: "Full settlement at point of subscription." },
        ];

  const discounts: StageDiscount[] = [
    { stage: "pre-development", discountPct: isPre ? 8 : 0, description: "Early-bird allocation discount for pre-development subscribers." },
    { stage: "post-development", discountPct: isPre ? 0 : 3, description: "Completed-asset volume discount." },
  ];

  const pricing = {
    basePrice: Math.round(p.propertyValue / 1.12),
    markupPct: 12,
    finalSellingPrice: p.propertyValue,
    paymentOptions,
    discounts,
  };

  const grossRental = Math.round((p.rentalYield / 100) * p.propertyValue);
  const returns: ReturnsProjection = {
    projectedRentalIncome: grossRental,
    frequency: "quarterly",
    operatingCosts: Math.round(grossRental * 0.25),
    capitalAppreciation: p.capitalAppreciation,
    firstPayoutDate: new Date(p.firstDividendDate),
    yieldRange: [Number((p.rentalYield - 1).toFixed(1)), Number((p.rentalYield + 1).toFixed(1))],
    appreciationRange: [p.capitalAppreciation - 2, p.capitalAppreciation + 3],
    totalReturnRange: [Number((p.rentalYield + p.capitalAppreciation - 3).toFixed(1)), Number((p.rentalYield + p.capitalAppreciation + 4).toFixed(1))],
  };

  const risk: RiskAssessment = {
    constructionProgress: p.fundingProgress,
    riskLevel: isPre ? "medium" : "low",
    riskFactors: isPre
      ? ["Off-plan delivery timing", "Macro liquidity", "Construction cost inflation"]
      : ["Tenant concentration", "Market rental softening", "FX exposure on operating costs"],
    offPlanSecurity: "All capital held in Urbco Trustee escrow; released only against verified milestone certificates.",
    exitLiquidity: investmentProgram === "foundry" ? "Secondary transfer window, 12-month lock." : "Milestone-gated title exit via trustee.",
    managementMode: "Program-Managed by Urbco Trustee & Asset Management",
  };

  const documents: DocumentFile[] = [
    { id: "doc-1", name: "Title Deed / Governor's Consent", type: "legal", url: "#", uploadedAt: new Date("2024-09-01"), size: 2400000 },
    { id: "doc-2", name: "Project Appraisal Report", type: "financial", url: "#", uploadedAt: new Date("2024-09-10"), size: 3100000 },
    { id: "doc-3", name: "Architectural Drawings", type: "technical", url: "#", uploadedAt: new Date("2024-09-15"), size: 8800000 },
  ];
  const virtualTours: VirtualTour[] = [
    { id: "vt-1", title: "Walkthrough Tour", url: "#", thumbnail: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80" },
  ];

  const commission: CommissionStructure = {
    leadPct: 3,
    closerPct: 2,
    totalPct: 5,
    calculatedAmount: Math.round((p.minimumInvestment ?? 1000000) * 0.05),
  };

  return {
    referenceCode: `${refPrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
    developerCompany: "Urbco Development Partners Ltd",
    projectStatus: (isPre ? "under-construction" : "operational") as Property["projectStatus"],
    landSizeSqm: Math.round(p.squareMeters * 2.2),
    builtSizeSqm: p.squareMeters,
    constructionStartDate: new Date(isPre ? "2026-01-01" : "2023-01-01"),
    constructionEndDate: new Date(isPre ? "2027-12-31" : "2025-06-30"),
    totalUnits,
    availableUnits,
    unitConfiguration,
    facilityManagement: true,
    investmentProgram,
    buyingPaths,
    pricing,
    returns,
    risk,
    documents,
    virtualTours,
    commission,
    publishStatus: "active" as const,
  };
}

const rawProperties: Omit<Property, "slug" | "referenceCode" | "developerCompany" | "projectStatus" | "landSizeSqm" | "builtSizeSqm" | "constructionStartDate" | "constructionEndDate" | "totalUnits" | "availableUnits" | "unitConfiguration" | "facilityManagement" | "investmentProgram" | "buyingPaths" | "pricing" | "returns" | "risk" | "documents" | "virtualTours" | "commission" | "publishStatus">[] = [
  {
    id: "prop-000-foundry-1",
    name: "Eko Atlantic Waterfront Towers",
    location: "Eko Atlantic City, Lagos",
    fullAddress: "Plot 1-5 Financial District, Eko Atlantic, Lagos State",
    propertyType: "mixed-use",
    description: "An ultra-luxury institutional mega-development situated in Eko Atlantic's Financial Center. Designed exclusively for high-net-worth investors, family offices, and institutional syndicates. Spanning twin 45-storey ultra-modern glass towers with private helipads, marina docks, and high-yield commercial/residential leases.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    ],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    rooms: 180,
    bathrooms: 210,
    squareMeters: 14500,
    amenities: ["Helipad", "Private Marina", "Institutional Security", "Sky Lounge", "Concierge", "High-Speed Fiber", "Full Backups", "Gold LEED Certified"],
    furnishingStatus: "furnished",
    constructionStatus: "planned",
    constructionTimeline: "Q4 2026",
    developmentStage: "pre-development",
    targetTrack: "foundry",
    minimumInvestment: 250000000, // ₦250 Million
    
    propertyValue: 320000000000, // ₦320 Billion (~$215M)
    investmentAvailable: 220000000000,
    costPerFraction: 250000000,
    totalFractions: 880,
    fractionsSold: 120,
    investorsCount: 4,
    
    rentalYield: 14.8,
    rentPerQuarter: 9250000,
    capitalAppreciation: 22,
    firstDividendDate: "2026-06-30",
    projectedROI: 36.8,
    
    status: "open",
    fundingProgress: 13.6,
    featured: true,
    createdAt: new Date("2024-09-01"),
  },
  {
    id: "prop-000-foundry-2",
    name: "Victoria Island Financial Hub",
    location: "Victoria Island, Lagos",
    fullAddress: "88 Ahmadu Bello Way, Victoria Island, Lagos State",
    propertyType: "commercial",
    description: "A completed Grade-A corporate tower fully tenanted by international financial firms, global tech hubs, and multinational headquarters. Dedicated to institutional investors seeking immediate high-volume quarterly rental cashflow and long-term capital preservation.",
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    ],
    rooms: 95,
    bathrooms: 120,
    squareMeters: 9800,
    amenities: ["Auditorium", "Executive Suites", "Helicopter Pad", "Level 4 Security", "Solar Grid Backup", "Underground Parking"],
    furnishingStatus: "furnished",
    constructionStatus: "completed",
    developmentStage: "post-development",
    targetTrack: "foundry",
    minimumInvestment: 200000000, // ₦200 Million
    
    propertyValue: 260000000000, // ₦260 Billion (~$175M)
    investmentAvailable: 180000000000,
    costPerFraction: 200000000,
    totalFractions: 900,
    fractionsSold: 540,
    investorsCount: 12,
    
    rentalYield: 12.5,
    rentPerQuarter: 6250000,
    capitalAppreciation: 16,
    firstDividendDate: "2025-03-31",
    projectedROI: 28.5,
    
    status: "funding",
    fundingProgress: 60.0,
    featured: true,
    createdAt: new Date("2024-08-15"),
  },
  {
    id: "prop-001",
    name: "Islet-Majaro",
    location: "Lekki Phase 1, Lagos",
    fullAddress: "Plot 45, Admiralty Way, Lekki Phase 1, Lagos State",
    propertyType: "residential",
    description: "A premium residential apartment complex featuring modern architecture and world-class amenities. Located in the heart of Lekki's most sought-after neighborhood, Islet-Majaro offers investors an exceptional opportunity to own a fraction of this high-yield property.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
    ],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    rooms: 44,
    bathrooms: 44,
    squareMeters: 1070,
    amenities: ["Gym", "Laundry", "Reception", "Furnished Spaces", "24/7 Security", "Power Backup", "Water Treatment", "Parking", "Elevator", "Swimming Pool"],
    furnishingStatus: "furnished",
    constructionStatus: "completed",
    developmentStage: "post-development",
    targetTrack: "harbor",
    minimumInvestment: 1375000,
    
    propertyValue: 561000000,
    investmentAvailable: 450000000,
    costPerFraction: 1375000,
    totalFractions: 440,
    fractionsSold: 90,
    investorsCount: 1,
    
    rentalYield: 8.45,
    rentPerQuarter: 290625,
    capitalAppreciation: 14,
    firstDividendDate: "2025-01-15",
    projectedROI: 22.45,
    
    status: "open",
    fundingProgress: 20.45,
    featured: true,
    createdAt: new Date("2024-06-15"),
  },
  {
    id: "prop-002",
    name: "Victoria Gardens Estate",
    location: "Victoria Island, Lagos",
    fullAddress: "12 Akin Adesola Street, Victoria Island, Lagos State",
    propertyType: "commercial",
    description: "Premium commercial office space in the heart of Victoria Island's business district. This Grade-A office building offers exceptional rental yields with blue-chip tenants.",
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80",
    ],
    rooms: 24,
    bathrooms: 30,
    squareMeters: 2500,
    amenities: ["Conference Rooms", "24/7 Security", "Backup Generator", "High-Speed Elevators", "Parking", "Cafeteria", "Gym"],
    furnishingStatus: "partially-furnished",
    constructionStatus: "completed",
    developmentStage: "post-development",
    targetTrack: "both",
    minimumInvestment: 2000000,
    
    propertyValue: 850000000,
    investmentAvailable: 600000000,
    costPerFraction: 2000000,
    totalFractions: 300,
    fractionsSold: 180,
    investorsCount: 45,
    
    rentalYield: 10.2,
    rentPerQuarter: 510000,
    capitalAppreciation: 12,
    firstDividendDate: "2025-02-01",
    projectedROI: 22.2,
    
    status: "funding",
    fundingProgress: 60,
    featured: true,
    createdAt: new Date("2024-08-20"),
  },
  {
    id: "prop-003",
    name: "Ikoyi Heights Luxury Towers",
    location: "Ikoyi, Lagos",
    fullAddress: "15 Kingsway Road, Ikoyi, Lagos State",
    propertyType: "residential",
    description: "Luxury residential towers offering panoramic views of Lagos lagoon. Featuring pre-development pricing for high-net-worth investors and family offices looking for high capital appreciation.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
    ],
    rooms: 60,
    bathrooms: 72,
    squareMeters: 1800,
    amenities: ["Infinity Pool", "Spa", "Gym", "Cinema Room", "Concierge", "Valet Parking", "Smart Home", "Wine Cellar"],
    furnishingStatus: "furnished",
    constructionStatus: "ongoing",
    constructionTimeline: "Q3 2025",
    developmentStage: "pre-development",
    targetTrack: "foundry",
    minimumInvestment: 50000000,
    
    propertyValue: 12000000000,
    investmentAvailable: 8000000000,
    costPerFraction: 50000000,
    totalFractions: 160,
    fractionsSold: 45,
    investorsCount: 28,
    
    rentalYield: 9.5,
    rentPerQuarter: 1187500,
    capitalAppreciation: 18,
    firstDividendDate: "2025-06-01",
    projectedROI: 27.5,
    
    status: "open",
    fundingProgress: 28.1,
    featured: true,
    createdAt: new Date("2024-10-01"),
  },
  {
    id: "prop-004",
    name: "Abuja Central Plaza",
    location: "Central Business District, Abuja",
    fullAddress: "Plot 1234, Herbert Macaulay Way, CBD, Abuja",
    propertyType: "mixed-use",
    description: "Strategic mixed-use pre-development project in Abuja's CBD combining retail, office, and residential spaces. Perfect for diversified institutional and retail allocation.",
    images: [
      "https://images.unsplash.com/photo-1582407972990-cd97287e6a09?w=1200&q=80",
      "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=1200&q=80",
    ],
    rooms: 80,
    bathrooms: 90,
    squareMeters: 3500,
    amenities: ["Shopping Mall", "Office Spaces", "Apartments", "Parking", "Security", "Food Court", "Rooftop Garden"],
    furnishingStatus: "unfurnished",
    constructionStatus: "planned",
    constructionTimeline: "Q1 2026",
    developmentStage: "pre-development",
    targetTrack: "both",
    minimumInvestment: 5000000,
    
    propertyValue: 2000000000,
    investmentAvailable: 1500000000,
    costPerFraction: 5000000,
    totalFractions: 300,
    fractionsSold: 12,
    investorsCount: 8,
    
    rentalYield: 11.0,
    rentPerQuarter: 1375000,
    capitalAppreciation: 20,
    firstDividendDate: "2026-04-01",
    projectedROI: 31.0,
    
    status: "open",
    fundingProgress: 4,
    featured: false,
    createdAt: new Date("2024-11-15"),
  },
  {
    id: "prop-005",
    name: "Port Harcourt Marina Waterfront",
    location: "GRA Phase 2, Port Harcourt",
    fullAddress: "18 Aba Road, GRA Phase 2, Port Harcourt, Rivers State",
    propertyType: "residential",
    description: "Waterfront post-development residential property with stunning marina views. Premium apartments designed for steady rental yields and retail investor accessibility.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
    ],
    rooms: 36,
    bathrooms: 42,
    squareMeters: 950,
    amenities: ["Marina Access", "Boat Dock", "Gym", "Pool", "Security", "Clubhouse", "Tennis Court"],
    furnishingStatus: "furnished",
    constructionStatus: "completed",
    developmentStage: "post-development",
    targetTrack: "harbor",
    minimumInvestment: 1000000,
    
    propertyValue: 420000000,
    investmentAvailable: 300000000,
    costPerFraction: 1000000,
    totalFractions: 300,
    fractionsSold: 210,
    investorsCount: 67,
    
    rentalYield: 8.8,
    rentPerQuarter: 220000,
    capitalAppreciation: 13,
    firstDividendDate: "2025-01-01",
    projectedROI: 21.8,
    
    status: "funding",
    fundingProgress: 70,
    featured: false,
    createdAt: new Date("2024-07-10"),
  },
  {
    id: "prop-006",
    name: "Ibadan Tech Hub & Commercial Center",
    location: "Bodija, Ibadan",
    fullAddress: "25 University Road, Bodija, Ibadan, Oyo State",
    propertyType: "commercial",
    description: "Modern tech hub and co-working space catering to the growing tech ecosystem in Ibadan. High occupancy rates with quality tenants, accessible via the fractional track.",
    images: [
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80",
    ],
    rooms: 40,
    bathrooms: 20,
    squareMeters: 1200,
    amenities: ["Co-working Spaces", "Meeting Rooms", "High-Speed Internet", "Cafeteria", "Parking", "Backup Power", "Event Space"],
    furnishingStatus: "furnished",
    constructionStatus: "completed",
    developmentStage: "post-development",
    targetTrack: "harbor",
    minimumInvestment: 500000,
    
    propertyValue: 280000000,
    investmentAvailable: 200000000,
    costPerFraction: 500000,
    totalFractions: 400,
    fractionsSold: 320,
    investorsCount: 156,
    
    rentalYield: 12.5,
    rentPerQuarter: 156250,
    capitalAppreciation: 15,
    firstDividendDate: "2024-12-15",
    projectedROI: 27.5,
    
    status: "funding",
    fundingProgress: 80,
    featured: false,
    createdAt: new Date("2024-05-20"),
  },
];

export const properties: Property[] = rawProperties.map((p) => ({
  ...p,
  slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
  ...deriveAdmin(p),
}));

export const investments: Investment[] = [
  {
    id: "inv-001",
    userId: "user-001",
    propertyId: "prop-001",
    property: properties[0],
    buyingPath: "investment",
    fractionsOwned: 5,
    amountInvested: 6875000,
    currentValuation: 7562500,
    roi: 10,
    paymentSchedule: {
      type: "3-months",
      totalAmount: 6875000,
      paidAmount: 4583333,
      remainingAmount: 2291667,
      installments: [
        { id: "inst-001", dueDate: "2024-10-15", amount: 2291667, paidAmount: 2291667, status: "paid", paidDate: "2024-10-14" },
        { id: "inst-002", dueDate: "2024-11-15", amount: 2291667, paidAmount: 2291667, status: "paid", paidDate: "2024-11-12" },
        { id: "inst-003", dueDate: "2024-12-15", amount: 2291666, paidAmount: 0, status: "pending" },
      ],
    },
    status: "active",
    purchaseDate: new Date("2024-10-01"),
    nextDividendDate: "2025-01-15",
  },
  {
    id: "inv-002",
    userId: "user-001",
    propertyId: "prop-002",
    property: properties[1],
    buyingPath: "investment",
    fractionsOwned: 3,
    amountInvested: 6000000,
    currentValuation: 6480000,
    roi: 8,
    paymentSchedule: {
      type: "full",
      totalAmount: 6000000,
      paidAmount: 6000000,
      remainingAmount: 0,
      installments: [
        { id: "inst-004", dueDate: "2024-09-01", amount: 6000000, paidAmount: 6000000, status: "paid", paidDate: "2024-09-01" },
      ],
    },
    status: "active",
    purchaseDate: new Date("2024-09-01"),
    nextDividendDate: "2025-02-01",
  },
  {
    id: "inv-003",
    userId: "user-001",
    propertyId: "prop-005",
    property: properties[4],
    buyingPath: "ownership",
    fractionsOwned: 10,
    amountInvested: 10000000,
    currentValuation: 10800000,
    roi: 8,
    paymentSchedule: {
      type: "6-months",
      totalAmount: 10000000,
      paidAmount: 5000000,
      remainingAmount: 5000000,
      installments: [
        { id: "inst-005", dueDate: "2024-10-01", amount: 1666667, paidAmount: 1666667, status: "paid", paidDate: "2024-09-28" },
        { id: "inst-006", dueDate: "2024-11-01", amount: 1666667, paidAmount: 1666667, status: "paid", paidDate: "2024-10-30" },
        { id: "inst-007", dueDate: "2024-12-01", amount: 1666666, paidAmount: 1666666, status: "paid", paidDate: "2024-11-28" },
        { id: "inst-008", dueDate: "2025-01-01", amount: 1666667, paidAmount: 0, status: "pending" },
        { id: "inst-009", dueDate: "2025-02-01", amount: 1666667, paidAmount: 0, status: "pending" },
        { id: "inst-010", dueDate: "2025-03-01", amount: 1666666, paidAmount: 0, status: "pending" },
      ],
    },
    status: "active",
    purchaseDate: new Date("2024-10-01"),
    nextDividendDate: "2025-01-01",
  },
];

export const dividends: Dividend[] = [
  {
    id: "div-001",
    investmentId: "inv-001",
    propertyId: "prop-001",
    propertyName: "Islet-Majaro",
    amount: 145312,
    period: "Q4 2024",
    status: "paid",
    paymentDate: "2024-10-15",
  },
  {
    id: "div-002",
    investmentId: "inv-002",
    propertyId: "prop-002",
    propertyName: "Victoria Gardens Estate",
    amount: 153000,
    period: "Q4 2024",
    status: "paid",
    paymentDate: "2024-11-01",
  },
  {
    id: "div-003",
    investmentId: "inv-003",
    propertyId: "prop-005",
    propertyName: "Port Harcourt Marina",
    amount: 220000,
    period: "Q4 2024",
    status: "paid",
    paymentDate: "2024-10-01",
  },
  {
    id: "div-004",
    investmentId: "inv-001",
    propertyId: "prop-001",
    propertyName: "Islet-Majaro",
    amount: 145312,
    period: "Q1 2025",
    status: "upcoming",
    paymentDate: "2025-01-15",
  },
  {
    id: "div-005",
    investmentId: "inv-002",
    propertyId: "prop-002",
    propertyName: "Victoria Gardens Estate",
    amount: 153000,
    period: "Q1 2025",
    status: "upcoming",
    paymentDate: "2025-02-01",
  },
  {
    id: "div-006",
    investmentId: "inv-003",
    propertyId: "prop-005",
    propertyName: "Port Harcourt Marina",
    amount: 220000,
    period: "Q1 2025",
    status: "pending",
    paymentDate: "2025-01-01",
  },
];

export const transactions: Transaction[] = [
  {
    id: "txn-001",
    type: "investment",
    amount: 2291667,
    status: "completed",
    description: "Investment in Islet-Majaro - Installment 1",
    date: "2024-10-14",
    reference: "INV-001-INST-001",
  },
  {
    id: "txn-002",
    type: "dividend",
    amount: 145312,
    status: "completed",
    description: "Dividend from Islet-Majaro - Q4 2024",
    date: "2024-10-15",
    reference: "DIV-001",
  },
  {
    id: "txn-003",
    type: "investment",
    amount: 6000000,
    status: "completed",
    description: "Investment in Victoria Gardens Estate",
    date: "2024-09-01",
    reference: "INV-002",
  },
  {
    id: "txn-004",
    type: "dividend",
    amount: 153000,
    status: "completed",
    description: "Dividend from Victoria Gardens Estate - Q4 2024",
    date: "2024-11-01",
    reference: "DIV-002",
  },
  {
    id: "txn-005",
    type: "deposit",
    amount: 5000000,
    status: "completed",
    description: "Wallet deposit via Bank Transfer",
    date: "2024-09-28",
    reference: "DEP-001",
  },
  {
    id: "txn-006",
    type: "investment",
    amount: 1666667,
    status: "completed",
    description: "Investment in Port Harcourt Marina - Installment 1",
    date: "2024-09-28",
    reference: "INV-003-INST-001",
  },
  {
    id: "txn-007",
    type: "dividend",
    amount: 220000,
    status: "completed",
    description: "Dividend from Port Harcourt Marina - Q4 2024",
    date: "2024-10-01",
    reference: "DIV-003",
  },
  {
    id: "txn-008",
    type: "investment",
    amount: 2291667,
    status: "completed",
    description: "Investment in Islet-Majaro - Installment 2",
    date: "2024-11-12",
    reference: "INV-001-INST-002",
  },
  {
    id: "txn-009",
    type: "investment",
    amount: 1666667,
    status: "completed",
    description: "Investment in Port Harcourt Marina - Installment 2",
    date: "2024-10-30",
    reference: "INV-003-INST-002",
  },
  {
    id: "txn-010",
    type: "investment",
    amount: 1666666,
    status: "completed",
    description: "Investment in Port Harcourt Marina - Installment 3",
    date: "2024-11-28",
    reference: "INV-003-INST-003",
  },
];

export const notifications: Notification[] = [
  {
    id: "notif-001",
    type: "dividend",
    title: "Dividend Received",
    message: "You received ₦145,312 from Islet-Majaro for Q4 2024",
    read: false,
    createdAt: "2024-10-15T10:30:00Z",
    actionUrl: "/dividends",
  },
  {
    id: "notif-002",
    type: "payment",
    title: "Payment Due Soon",
    message: "Your installment of ₦2,291,666 for Islet-Majaro is due on Dec 15, 2024",
    read: false,
    createdAt: "2024-12-01T09:00:00Z",
    actionUrl: "/wallet",
  },
  {
    id: "notif-003",
    type: "opportunity",
    title: "New Investment Opportunity",
    message: "Abuja Central Plaza is now open for investment with 31% projected ROI",
    read: false,
    createdAt: "2024-11-15T14:00:00Z",
    actionUrl: "/assets/prop-004",
  },
  {
    id: "notif-004",
    type: "asset",
    title: "Funding Milestone",
    message: "Victoria Gardens Estate has reached 60% funding goal",
    read: true,
    createdAt: "2024-11-10T11:00:00Z",
    actionUrl: "/assets/prop-002",
  },
  {
    id: "notif-005",
    type: "dividend",
    title: "Dividend Received",
    message: "You received ₦153,000 from Victoria Gardens Estate for Q4 2024",
    read: true,
    createdAt: "2024-11-01T10:00:00Z",
    actionUrl: "/dividends",
  },
  {
    id: "notif-006",
    type: "alert",
    title: "KYC Verification Required",
    message: "Please complete your KYC verification to unlock higher investment limits",
    read: true,
    createdAt: "2024-10-20T08:00:00Z",
    actionUrl: "/profile/kyc",
  },
];

export const referral: Referral = {
  id: "ref-001",
  userId: "user-001",
  referralCode: "URBCO-AJIBOLA2024",
  referralLink: "https://urbco.invest/ref/AJIBOLA2024",
  totalReferrals: 12,
  activeReferrals: 8,
  totalRewards: 480000,
  referrals: [
    {
      id: "ref-user-001",
      name: "Chinedu Okafor",
      email: "chinedu@example.com",
      joinedDate: "2024-10-15",
      status: "invested",
      reward: 100000,
    },
    {
      id: "ref-user-002",
      name: "Fatima Abdullahi",
      email: "fatima@example.com",
      joinedDate: "2024-10-20",
      status: "invested",
      reward: 100000,
    },
    {
      id: "ref-user-003",
      name: "Tunde Bakare",
      email: "tunde@example.com",
      joinedDate: "2024-11-01",
      status: "active",
      reward: 0,
    },
    {
      id: "ref-user-004",
      name: "Blessing Eze",
      email: "blessing@example.com",
      joinedDate: "2024-11-05",
      status: "invested",
      reward: 80000,
    },
    {
      id: "ref-user-005",
      name: "Ibrahim Musa",
      email: "ibrahim@example.com",
      joinedDate: "2024-11-10",
      status: "pending",
      reward: 0,
    },
  ],
};

export const dashboardMetrics: DashboardMetrics = {
  totalInvested: 22875000,
  portfolioValue: 24842500,
  projectedAnnualReturns: 5118750,
  totalDividendsEarned: 518312,
  activeInvestments: 3,
  portfolioGrowth: [
    { month: "Jun", value: 0 },
    { month: "Jul", value: 0 },
    { month: "Aug", value: 0 },
    { month: "Sep", value: 6000000 },
    { month: "Oct", value: 16875000 },
    { month: "Nov", value: 22875000 },
    { month: "Dec", value: 24842500 },
  ],
  assetAllocation: [
    { name: "Residential", value: 68.75 },
    { name: "Commercial", value: 26.14 },
    { name: "Mixed-Use", value: 0 },
    { name: "Land", value: 0 },
  ],
};

export const currentUser = {
  id: "user-001",
  email: "ajibola@urbcoinvest.com",
  fullName: "Ajibola Williams",
  phone: "+234 801 234 5678",
  country: "Nigeria",
  investmentExperience: "intermediate" as const,
  riskAppetite: "medium" as const,
  kycStatus: "verified" as const,
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  createdAt: new Date("2024-06-01"),
};

export const wallet = {
  userId: "user-001",
  balance: 3542813,
  pendingDeposits: 0,
  pendingWithdrawals: 0,
};
