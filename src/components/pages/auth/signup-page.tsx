"use client";

import { useState, Suspense } from "react";
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Crown, Anchor, Building2, Briefcase, Users, ShieldCheck, Check, Landmark, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI, InvestorRegistrationRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Track = "foundry" | "harbor";
type Entity = "individual" | "family-office" | "institution";
type SignupFormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  country: string;
  dateOfBirth: string;
  nationality: string;
  idType: string;
  sourceOfFunds: string;
  employmentStatus: string;
  entityName: string;
  aumRange: string;
  registrationNumber: string;
  officeCountry: string;
  institutionType: string;
  institutionName: string;
  cacNumber: string;
  taxId: string;
  regulatorName: string;
  ticketSize: string;
  targetAssets: string;
  horizon: string;
  structure: string;
};

const TRACKS = [
  {
    key: "foundry" as const,
    name: "Urbco Foundry",
    icon: Crown,
    blurb: "High-value institutional investing",
    detail: "Allocations from ₦200M into completed and near-completion assets.",
    accent: "border-accent-500 bg-accent-50",
    iconClass: "bg-accent-100 text-accent-700",
  },
  {
    key: "harbor" as const,
    name: "Urbco Harbour",
    icon: Anchor,
    blurb: "Fractional investing for individuals",
    detail: "Entry from ₦100K with quarterly wallet dividends.",
    accent: "border-brand-500 bg-brand-50",
    iconClass: "bg-brand-100 text-brand-700",
  },
];

const ENTITY_OPTIONS: Record<Track, { key: Entity; label: string; icon: typeof Users; blurb: string }[]> = {
  foundry: [
    { key: "individual", label: "High-net-worth individual", icon: User, blurb: "Personal account, large capital" },
    { key: "family-office", label: "Family office", icon: Briefcase, blurb: "Office with trustees and advisors" },
    { key: "institution", label: "Institution", icon: Building2, blurb: "Pension, bank, fund or corporate" },
  ],
  harbor: [
    { key: "individual", label: "Individual", icon: Users, blurb: "Personal account, invest from ₦100K" },
  ],
};

const COUNTRIES = [
  { v: "NG", l: "Nigeria" }, { v: "GH", l: "Ghana" }, { v: "KE", l: "Kenya" },
  { v: "ZA", l: "South Africa" }, { v: "UK", l: "United Kingdom" }, { v: "US", l: "United States" }, { v: "AE", l: "United Arab Emirates" },
];

const INSTITUTION_TYPES = [
  "Pension fund", "Asset manager", "Insurance company", "Bank", "Private equity",
  "Corporate treasury", "Endowment", "Sovereign wealth fund", "Other",
];

const STRUCTURES = ["Equity", "Debt / note", "Revenue share", "Joint venture"];

const TICKET_RANGES: Record<string, { minimum: number; maximum?: number }> = {
  "₦200M – ₦500M": { minimum: 200_000_000, maximum: 500_000_000 },
  "₦500M – ₦1B": { minimum: 500_000_000, maximum: 1_000_000_000 },
  "₦1B – ₦5B": { minimum: 1_000_000_000, maximum: 5_000_000_000 },
  "₦5B+": { minimum: 5_000_000_000 },
};

const HORIZON_RANGES: Record<string, { minimum: number; maximum?: number }> = {
  "1 – 3 years": { minimum: 12, maximum: 36 },
  "3 – 5 years": { minimum: 36, maximum: 60 },
  "5 – 10 years": { minimum: 60, maximum: 120 },
  "10+ years": { minimum: 120 },
};

const AUM_RANGES: Record<string, { minimum: number; maximum?: number }> = {
  "$1M – $10M": { minimum: 1_000_000, maximum: 10_000_000 },
  "$10M – $50M": { minimum: 10_000_000, maximum: 50_000_000 },
  "$50M – $200M": { minimum: 50_000_000, maximum: 200_000_000 },
  "$200M+": { minimum: 200_000_000 },
};

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">
        <span className="text-brand-600">{step}.</span> {title}
      </legend>
      {children}
    </fieldset>
  );
}

function InvestmentProfileSection({
  step,
  form,
  set,
}: {
  step: number;
  form: SignupFormState;
  set: (patch: Partial<SignupFormState>) => void;
}) {
  return (
    <Section step={step} title="Your investment profile">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ticket" className="text-slate-700">Typical allocation</Label>
          <Select value={form.ticketSize} onValueChange={(v) => set({ ticketSize: v })}>
            <SelectTrigger id="ticket" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(TICKET_RANGES).map((range) => <SelectItem key={range} value={range}>{range}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="target" className="text-slate-700">Preferred assets</Label>
          <Select value={form.targetAssets} onValueChange={(v) => set({ targetAssets: v })}>
            <SelectTrigger id="target" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Income-producing">Income-producing</SelectItem>
              <SelectItem value="Development">Development</SelectItem>
              <SelectItem value="Completed / stabilised">Completed / stabilised</SelectItem>
              <SelectItem value="Mixed portfolio">Mixed portfolio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="horizon" className="text-slate-700">Investment horizon</Label>
          <Select value={form.horizon} onValueChange={(v) => set({ horizon: v })}>
            <SelectTrigger id="horizon" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(HORIZON_RANGES).map((range) => <SelectItem key={range} value={range}>{range}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="structure" className="text-slate-700">Preferred structure</Label>
          <Select value={form.structure} onValueChange={(v) => set({ structure: v })}>
            <SelectTrigger id="structure" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STRUCTURES.map((structure) => <SelectItem key={structure} value={structure}>{structure}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Section>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-sunken" />}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const initialTrack: Track = searchParams?.get("track") === "foundry" ? "foundry" : "harbor";

  const [track, setTrack] = useState<Track>(initialTrack);
  const [entity, setEntity] = useState<Entity>("individual");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState<SignupFormState>({
    // shared account
    fullName: "", email: "", phone: "", password: "", confirmPassword: "", country: "NG",
    // individual
    dateOfBirth: "", nationality: "Nigerian", idType: "Passport",
    sourceOfFunds: "Employment income", employmentStatus: "Employed",
    // family office
    entityName: "", aumRange: "$10M – $50M", registrationNumber: "", officeCountry: "NG",
    // institution
    institutionType: INSTITUTION_TYPES[0], institutionName: "", cacNumber: "", taxId: "", regulatorName: "",
    // foundry sizing
    ticketSize: "₦200M – ₦500M", targetAssets: "Income-producing", horizon: "3 – 5 years", structure: STRUCTURES[0],
  });

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const isHarbour = track === "harbor";
  const isInstitution = entity === "institution";
  const isFamilyOffice = entity === "family-office";

  const passwordsMatch = form.confirmPassword.length === 0 || form.password === form.confirmPassword;

  // Switch track: reset entity to a valid option for the new track
  const chooseTrack = (next: Track) => {
    if (next === track) return;
    setTrack(next);
    if (next === "harbor") setEntity("individual");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !passwordsMatch) return;
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) {
      toast.error("Choose a stronger password", "Use at least 8 characters with uppercase, lowercase, a number, and a special character.");
      return;
    }

    const countryCode = isFamilyOffice ? form.officeCountry : form.country;
    const compactPhone = form.phone.replace(/[\s()-]/g, "");
    const phone = countryCode === "NG" && compactPhone.startsWith("0")
      ? `+234${compactPhone.slice(1)}`
      : compactPhone;
    const ticket = TICKET_RANGES[form.ticketSize];
    const horizon = HORIZON_RANGES[form.horizon];
    const aum = AUM_RANGES[form.aumRange];
    const entityType: InvestorRegistrationRequest["entityType"] =
      entity === "family-office" ? "FAMILY_OFFICE" : entity.toUpperCase() as InvestorRegistrationRequest["entityType"];

    const payload: InvestorRegistrationRequest = {
      track: track.toUpperCase() as InvestorRegistrationRequest["track"],
      entityType,
      account: {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone,
        password: form.password,
        countryCode,
      },
      individual: entity === "individual" ? {
        dateOfBirth: form.dateOfBirth,
        nationality: form.nationality,
        primaryIdType: form.idType,
        sourceOfFunds: form.sourceOfFunds,
        employmentStatus: form.employmentStatus,
      } : undefined,
      entity: entity !== "individual" ? {
        legalName: isFamilyOffice ? form.entityName.trim() : form.institutionName.trim(),
        registrationNumber: (isFamilyOffice ? form.registrationNumber : form.cacNumber).trim() || undefined,
        countryCode,
        institutionType: isInstitution ? form.institutionType : "Family office",
        taxId: isInstitution ? form.taxId.trim() : undefined,
        regulatorName: isInstitution ? form.regulatorName.trim() || undefined : undefined,
        representativeDateOfBirth: isFamilyOffice ? form.dateOfBirth : undefined,
        aumMin: isFamilyOffice ? aum?.minimum : undefined,
        aumMax: isFamilyOffice ? aum?.maximum : undefined,
        aumCurrency: isFamilyOffice ? "USD" : undefined,
      } : undefined,
      investmentPreference: track === "foundry" ? {
        currency: "NGN",
        minimumTicket: ticket.minimum,
        maximumTicket: ticket.maximum,
        preferredAsset: form.targetAssets.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
        horizonMinMonths: horizon.minimum,
        horizonMaxMonths: horizon.maximum,
        preferredStructure: form.structure.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
      } : undefined,
      consent: {
        termsVersion: "2026-10-01",
        privacyVersion: "2026-10-01",
      },
    };

    setIsLoading(true);
    const response = await authAPI.registerInvestor(payload);
    setIsLoading(false);
    if (!response.success) {
      toast.error("Could not create account", response.error || "Please review your details and try again.");
      return;
    }

    sessionStorage.setItem("urbco_pending_email", payload.account.email);
    toast.success("Account created", "Enter the verification code sent to your email.");
    router.push(`/auth/otp-verify?email=${encodeURIComponent(payload.account.email)}`);
  };

  return (
    <div className="min-h-screen bg-surface-sunken px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="mb-8 flex justify-center">
          <img src="/urbco-logo.svg" alt="Urbco" className="h-9 w-auto" />
        </Link>

        <Card className="border-line shadow-card">
          <CardHeader className="px-6 pb-2 text-center sm:px-8">
            <CardTitle className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Create your account
            </CardTitle>
            <CardDescription className="mt-1 text-slate-600">
              Choose a track and tell us about you — the questions you see next depend on both.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pt-6 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* 1 — Track */}
              <Section step={1} title="Choose your investment track">
                <div className="grid gap-3 sm:grid-cols-2">
                  {TRACKS.map((t) => {
                    const selected = track === t.key;
                    return (
                      <button
                        type="button" key={t.key}
                        onClick={() => chooseTrack(t.key)}
                        aria-pressed={selected}
                        className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                          selected ? t.accent : "border-line bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${t.iconClass}`}>
                            <t.icon className="h-4 w-4" />
                          </span>
                          {selected && <Check className="h-4 w-4 text-brand-700" />}
                        </div>
                        <div className="mt-3 text-sm font-bold text-slate-900">{t.name}</div>
                        <div className="mt-0.5 text-xs font-medium text-slate-600">{t.blurb}</div>
                        <div className="mt-1.5 text-xs text-slate-500">{t.detail}</div>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* 2 — Investor category (track-dependent) */}
              <Section step={2} title={isHarbour ? "You are investing as" : "Who is investing?"}>
                <div className={`grid gap-2.5 ${isHarbour ? "grid-cols-1" : "sm:grid-cols-3"}`}>
                  {ENTITY_OPTIONS[track].map((o) => {
                    const selected = entity === o.key;
                    return (
                      <button
                        type="button" key={o.key}
                        onClick={() => setEntity(o.key)}
                        aria-pressed={selected}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                          selected
                            ? "border-brand-500 bg-brand-50 text-brand-800"
                            : "border-line bg-white text-slate-600 hover:border-brand-200"
                        }`}
                      >
                        <o.icon className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="block text-sm font-semibold">{o.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{o.blurb}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {isHarbour && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-surface-sunken p-3 text-xs text-slate-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    Urbco Harbour is for individual investors. Family offices and institutions join
                    through Urbco Foundry.
                  </p>
                )}
              </Section>

              {/* 3 — Account details (all tracks) */}
              <Section step={3} title="Account details">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-slate-700">
                        {isInstitution ? "Signatory full name" : isFamilyOffice ? "Your full name" : "Full name"}
                      </Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="fullName" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })}
                          className="pl-9" required autoComplete="name" placeholder="e.g. Ada Okonkwo" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-slate-700">
                        {isInstitution ? "Official company email" : "Email address"}
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })}
                          className="pl-9" required autoComplete="email" placeholder="you@example.com" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-slate-700">Phone number</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="phone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })}
                          className="pl-9" required autoComplete="tel" placeholder="+234 801 234 5678" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country" className="text-slate-700">
                        {isFamilyOffice ? "Office country" : isInstitution ? "Country of registration" : "Country of residence"}
                      </Label>
                      <Select
                        value={isFamilyOffice ? form.officeCountry : form.country}
                        onValueChange={(v) => set(isFamilyOffice ? { officeCountry: v } : { country: v })}
                      >
                        <SelectTrigger id="country" className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-slate-700">Password</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="password" type={showPassword ? "text" : "password"} value={form.password}
                          onChange={(e) => set({ password: e.target.value })}
                          className="pl-9 pr-10" required minLength={8} autoComplete="new-password" placeholder="Min. 8 characters" />
                        <button type="button" onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-700">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-slate-700">Confirm password</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={form.confirmPassword}
                          onChange={(e) => set({ confirmPassword: e.target.value })}
                          className={`pl-9 ${!passwordsMatch ? "border-red-400" : ""}`} required autoComplete="new-password" />
                      </div>
                      {!passwordsMatch && <p className="text-xs text-red-600">Passwords do not match.</p>}
                    </div>
                  </div>
                </div>
              </Section>

              {/* 4 — Track & category specific questions */}
              {entity === "individual" ? (
                <>
                  <Section step={4} title="About you">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="dob" className="text-slate-700">Date of birth</Label>
                        <Input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="idType" className="text-slate-700">Primary ID</Label>
                        <Select value={form.idType} onValueChange={(v) => set({ idType: v })}>
                          <SelectTrigger id="idType" className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Passport">Passport</SelectItem>
                            <SelectItem value="National ID">National ID</SelectItem>
                            <SelectItem value="Driver's licence">Driver&apos;s licence</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="nationality" className="text-slate-700">Nationality</Label>
                        <Input id="nationality" value={form.nationality} onChange={(e) => set({ nationality: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="sof" className="text-slate-700">Source of funds</Label>
                        <Select value={form.sourceOfFunds} onValueChange={(v) => set({ sourceOfFunds: v })}>
                          <SelectTrigger id="sof" className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Employment income">Employment income</SelectItem>
                            <SelectItem value="Business income">Business income</SelectItem>
                            <SelectItem value="Investment income">Investment income</SelectItem>
                            <SelectItem value="Inheritance">Inheritance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="employment" className="text-slate-700">Employment status</Label>
                        <Select value={form.employmentStatus} onValueChange={(v) => set({ employmentStatus: v })}>
                          <SelectTrigger id="employment" className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Employed">Employed</SelectItem>
                            <SelectItem value="Self-employed">Self-employed</SelectItem>
                            <SelectItem value="Business owner">Business owner</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                            <SelectItem value="Not currently employed">Not currently employed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  </Section>
                  {!isHarbour && <InvestmentProfileSection step={5} form={form} set={set} />}
                </>
              ) : (
                <>
                  {isFamilyOffice && (
                    <Section step={4} title="About your family office">
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="entityName" className="text-slate-700">Office / entity name</Label>
                            <Input id="entityName" value={form.entityName} onChange={(e) => set({ entityName: e.target.value })}
                              required placeholder="e.g. Okonkwo Family Office" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="regNo" className="text-slate-700">Registration number</Label>
                            <Input id="regNo" value={form.registrationNumber} onChange={(e) => set({ registrationNumber: e.target.value })}
                              placeholder="If registered" />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="aum" className="text-slate-700">Approximate AUM</Label>
                            <Select value={form.aumRange} onValueChange={(v) => set({ aumRange: v })}>
                              <SelectTrigger id="aum" className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="$1M – $10M">$1M – $10M</SelectItem>
                                <SelectItem value="$10M – $50M">$10M – $50M</SelectItem>
                                <SelectItem value="$50M – $200M">$50M – $200M</SelectItem>
                                <SelectItem value="$200M+">$200M+</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="dof" className="text-slate-700">Representative date of birth</Label>
                            <Input id="dof" type="date" value={form.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} required />
                          </div>
                        </div>
                      </div>
                    </Section>
                  )}

                  {isInstitution && (
                    <Section step={4} title="About your institution">
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="instType" className="text-slate-700">Institution type</Label>
                            <Select value={form.institutionType} onValueChange={(v) => set({ institutionType: v })}>
                              <SelectTrigger id="instType" className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {INSTITUTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="instName" className="text-slate-700">Registered name</Label>
                            <Input id="instName" value={form.institutionName} onChange={(e) => set({ institutionName: e.target.value })}
                              required placeholder="e.g. Meridian Pension Fund" />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="cac" className="text-slate-700">CAC registration number</Label>
                            <div className="relative">
                              <Landmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input id="cac" value={form.cacNumber} onChange={(e) => set({ cacNumber: e.target.value })}
                                className="pl-9" required placeholder="RC 1234567" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="taxId" className="text-slate-700">Tax identification number</Label>
                            <div className="relative">
                              <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input id="taxId" value={form.taxId} onChange={(e) => set({ taxId: e.target.value })}
                                className="pl-9" required placeholder="TIN / LEI" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="regulator" className="text-slate-700">Regulator (if applicable)</Label>
                          <Input id="regulator" value={form.regulatorName} onChange={(e) => set({ regulatorName: e.target.value })}
                            placeholder="e.g. SEC, NAICOM, CBN" />
                        </div>
                        <p className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs text-brand-800">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                          After email verification you will complete institutional KYB: CAC verification,
                          UBO identification and sanctions/PEP screening.
                        </p>
                      </div>
                    </Section>
                  )}

                  <InvestmentProfileSection step={5} form={form} set={set} />
                </>
              )}

              <label className="flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" />
                <span className="text-xs leading-relaxed text-slate-600">
                  I agree to the <span className="font-semibold text-brand-700">Terms of Service</span> and{" "}
                  <span className="font-semibold text-brand-700">Privacy Policy</span>, and I consent to identity
                  verification against submitted documents.
                </span>
              </label>

              <Button type="submit" size="lg" isLoading={isLoading} disabled={!agreed || !passwordsMatch}
                className="w-full shadow-lg shadow-brand-600/20">
                Create account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-brand-700 transition-colors hover:text-brand-800">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
