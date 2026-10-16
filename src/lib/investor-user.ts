import type { InvestorProfileResponse } from "@/lib/api";
import type { User } from "@/types";

const COUNTRY_NAMES: Record<string, string> = {
  NG: "Nigeria",
  GH: "Ghana",
  KE: "Kenya",
  ZA: "South Africa",
  UK: "United Kingdom",
  US: "United States",
  AE: "United Arab Emirates",
};

const kycStatus = (status: InvestorProfileResponse["investor"]["onboardingStatus"]): User["kycStatus"] => {
  switch (status) {
    case "VERIFIED":
      return "verified";
    case "UNDER_REVIEW":
      return "under_review";
    case "REMEDIATION_REQUIRED":
      return "remediation_required";
    case "REJECTED":
      return "failed";
    default:
      return "pending";
  }
};

export function investorProfileToUser(
  profile: InvestorProfileResponse,
  cached?: User | null,
): User {
  const countryCode = profile.countryCode || cached?.countryCode || "";

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.name,
    phone: profile.phone || "",
    countryCode,
    country: COUNTRY_NAMES[countryCode] || countryCode,
    investmentExperience: cached?.investmentExperience || "beginner",
    riskAppetite: cached?.riskAppetite || "medium",
    kycStatus: kycStatus(profile.investor.onboardingStatus),
    investorTrack: profile.investor.track === "FOUNDRY" ? "foundry" : "harbor",
    entityType: profile.investor.entityType === "FAMILY_OFFICE"
      ? "family-office"
      : profile.investor.entityType === "INSTITUTION"
        ? "institution"
        : "individual",
    avatar: cached?.avatar,
    createdAt: new Date(profile.createdAt),
  };
}
