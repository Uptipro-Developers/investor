"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Building2, CheckCircle, Download, FileText, Loader2, RefreshCw, Shield, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/stores/appStore";
import { authStorage, investorKycAPI, type InvestorKycResponse, type KycFieldRequirement } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { User as InvestorUser } from "@/types";

const STATUS_LABELS: Record<InvestorKycResponse["investor"]["onboardingStatus"], string> = {
  EMAIL_PENDING: "Email verification required", PROFILE_PENDING: "Not submitted", KYC_PENDING: "Not submitted",
  UNDER_REVIEW: "Under review", REMEDIATION_REQUIRED: "Action required", VERIFIED: "Verified", REJECTED: "Rejected",
};
const ENTITY_LABELS = { INDIVIDUAL: "Individual", FAMILY_OFFICE: "Family Office", INSTITUTION: "Institution" } as const;

function toStoreStatus(status: InvestorKycResponse["investor"]["onboardingStatus"]): InvestorUser["kycStatus"] {
  if (status === "VERIFIED") return "verified";
  if (status === "UNDER_REVIEW") return "under_review";
  if (status === "REMEDIATION_REQUIRED") return "remediation_required";
  if (status === "REJECTED") return "failed";
  return "pending";
}

const fieldValue = (value: string | string[] | undefined) => Array.isArray(value) ? value.join(", ") : value || "";

export default function KYCPage() {
  const toast = useToast();
  const { setUser } = useAppStore();
  const [data, setData] = useState<InvestorKycResponse | null>(null);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [declarations, setDeclarations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncUser = (response: InvestorKycResponse) => {
    const existing = useAppStore.getState().user;
    const updated: InvestorUser = {
      ...(existing || { id: response.investor.userId, email: response.investor.email, fullName: response.investor.name, phone: response.investor.phone || "", country: "", investmentExperience: "beginner", riskAppetite: "medium", createdAt: new Date() }),
      entityType: response.investor.entityType === "FAMILY_OFFICE" ? "family-office" : response.investor.entityType === "INSTITUTION" ? "institution" : "individual",
      investorTrack: response.investor.track === "HARBOR" ? "harbor" : "foundry",
      kycStatus: toStoreStatus(response.investor.onboardingStatus),
      kycRemediationItems: response.remediationItems.map((item) => `${item.label}: ${item.reason}`),
      kycSubmittedAt: response.submittedAt ? new Date(response.submittedAt) : existing?.kycSubmittedAt,
      kycVerifiedAt: response.investor.onboardingStatus === "VERIFIED" ? new Date(response.reviewedAt || Date.now()) : existing?.kycVerifiedAt,
    };
    setUser(updated);
    authStorage.setUser(updated);
  };

  const applyResponse = (response: InvestorKycResponse) => {
    setData(response);
    setProfile(Object.fromEntries(Object.entries(response.profile).map(([key, value]) => [key, fieldValue(value)])));
    setDeclarations(Object.fromEntries(Object.entries(response.declarations).map(([key, value]) => [key, fieldValue(value)])));
    syncUser(response);
  };

  const load = async () => {
    setLoading(true); setError(null);
    const response = await investorKycAPI.get();
    setLoading(false);
    if (!response.success || !response.data) { setError(response.error || "Unable to load your KYC profile."); return; }
    applyResponse(response.data);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const editable = !!data && ["KYC_PENDING", "PROFILE_PENDING", "REMEDIATION_REQUIRED", "REJECTED"].includes(data.investor.onboardingStatus);
  const approvedDocuments = data?.documents.filter((document) => document.status === "APPROVED").length || 0;

  const save = async (quiet = false) => {
    if (!data) return null;
    setSaving(true);
    const response = await investorKycAPI.save(profile, declarations);
    setSaving(false);
    if (!response.success || !response.data) { toast.error("Could not save KYC", response.error || "Please try again."); return null; }
    applyResponse(response.data);
    if (!quiet) toast.success("KYC details saved", "Your draft has been saved securely.");
    return response.data;
  };

  const uploadDocument = async (requirementCode: string, file?: File) => {
    if (!file) return;
    setUploading(requirementCode);
    const response = await investorKycAPI.uploadDocument(requirementCode, file);
    setUploading(null);
    if (!response.success) { toast.error("Upload failed", response.error || "Use a PDF, JPG, or PNG file up to 15MB."); return; }
    toast.success("Document uploaded", file.name); await load();
  };

  const removeDocument = async (documentId: string) => {
    setDeleting(documentId); const response = await investorKycAPI.deleteDocument(documentId); setDeleting(null);
    if (!response.success) { toast.error("Could not remove document", response.error || "Please try again."); return; }
    await load();
  };

  const downloadDocument = async (documentId: string, name: string) => {
    const response = await investorKycAPI.downloadDocument(documentId);
    if (!response.success || !response.data) { toast.error("Download failed", response.error || "Please try again."); return; }
    const url = URL.createObjectURL(response.data); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
  };

  const submit = async () => {
    setSubmitting(true); const saved = await save(true);
    if (!saved) { setSubmitting(false); return; }
    const response = await investorKycAPI.submit(); setSubmitting(false);
    if (!response.success || !response.data) { toast.error("KYC is not ready", response.error || "Complete every required field and document."); return; }
    applyResponse(response.data); toast.success("KYC submitted", "The compliance team will review your documents manually.");
  };

  if (loading) return <Card className="max-w-4xl"><CardContent className="flex items-center justify-center gap-3 p-12 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Loading your KYC requirements…</CardContent></Card>;
  if (error || !data) return <Card className="max-w-3xl border-red-200"><CardContent className="p-10 text-center"><AlertCircle className="mx-auto h-10 w-10 text-red-500" /><h2 className="mt-3 text-xl font-bold">Unable to load KYC</h2><p className="mt-2 text-sm text-slate-600">{error}</p><Button className="mt-5" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" /> Try again</Button></CardContent></Card>;

  const status = data.investor.onboardingStatus;
  const statusClasses = status === "VERIFIED" ? "border-emerald-200 bg-emerald-50" : status === "UNDER_REVIEW" ? "border-blue-200 bg-blue-50" : status === "REMEDIATION_REQUIRED" ? "border-orange-200 bg-orange-50" : status === "REJECTED" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50";

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Identity verification</h1><p className="mt-1 text-sm text-slate-500">Manual KYC / KYB review for your registered investor category.</p></div><div className="flex flex-wrap gap-2"><Badge className="bg-slate-900 px-3 py-1.5 text-white">{ENTITY_LABELS[data.investor.entityType]}</Badge><Badge variant="secondary" className="px-3 py-1.5">Urbco {data.investor.track === "HARBOR" ? "Harbor" : "Foundry"}</Badge></div></div>
    <Card className={statusClasses}><CardContent className="p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/80">{status === "VERIFIED" ? <CheckCircle className="h-7 w-7 text-emerald-600" /> : status === "UNDER_REVIEW" ? <Shield className="h-7 w-7 text-blue-600" /> : <AlertCircle className="h-7 w-7 text-amber-600" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold text-slate-900">{STATUS_LABELS[status]}</h2><Badge variant="secondary">Revision {data.submissionRevision}</Badge></div><p className="mt-1 text-sm text-slate-700">{status === "VERIFIED" ? "Your identity has been verified and you can invest in eligible assets." : status === "UNDER_REVIEW" ? "Your submission is locked while the compliance team reviews it manually." : status === "REMEDIATION_REQUIRED" ? "Correct the items listed below, then resubmit your KYC." : status === "REJECTED" ? "Review the compliance feedback, replace the required information, and resubmit." : "Complete every required field and upload the requested documents."}</p></div><div className="w-full sm:w-48"><div className="mb-1 flex justify-between text-xs font-medium"><span>Completion</span><span>{data.completion.percent}%</span></div><Progress value={data.completion.percent} className="h-2" /></div></div></CardContent></Card>
    {data.remediationItems.length > 0 && <Card className="border-orange-200 bg-orange-50"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-orange-900"><AlertCircle className="h-5 w-5" />Compliance feedback</CardTitle><CardDescription className="text-orange-800">Resolve every item before resubmitting.</CardDescription></CardHeader><CardContent><ul className="space-y-2">{data.remediationItems.map((item) => <li key={item.id} className="rounded-lg border border-orange-200 bg-white p-3 text-sm"><span className="font-semibold">{item.label}:</span> {item.reason}</li>)}</ul></CardContent></Card>}
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-amber-600" />Profile and declarations</CardTitle><CardDescription>Requirements are based on the category and investment track selected at registration.</CardDescription></CardHeader><CardContent className="space-y-6"><FieldGrid title="Profile" fields={data.requirements.profileFields} values={profile} disabled={!editable} onChange={(code, value) => setProfile((current) => ({ ...current, [code]: value }))} /><FieldGrid title="Declarations" fields={data.requirements.declarationFields} values={declarations} disabled={!editable} onChange={(code, value) => setDeclarations((current) => ({ ...current, [code]: value }))} />{editable && <div className="flex justify-end"><Button variant="outline" onClick={() => void save()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save draft</Button></div>}</CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-amber-600" />Required documents</CardTitle><CardDescription>{data.completion.documents.done}/{data.completion.documents.total} required documents uploaded · {approvedDocuments} approved</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">{data.requirements.documents.map((requirement) => {
      const uploaded = data.documents.find((item) => item.requirementCode === requirement.code); const remediation = data.remediationItems.find((item) => item.requirementCode === requirement.code);
      const canReplace = editable || uploaded?.status === "REJECTED";
      return <div key={requirement.code} className={`rounded-2xl border p-4 ${uploaded?.status === "REJECTED" || remediation ? "border-red-200 bg-red-50/50" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{requirement.label}{!requirement.required && <span className="ml-1 text-xs font-normal text-slate-500">(optional)</span>}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{requirement.description}</p></div>{uploaded && <DocumentStatus status={uploaded.status} />}</div>{uploaded ? <div className="mt-4 rounded-xl bg-white p-3"><p className="truncate text-sm font-medium">{uploaded.originalName}</p><p className="text-xs text-slate-500">{Math.max(1, Math.round(uploaded.size / 1024))} KB</p>{uploaded.rejectionReason && <p className="mt-2 text-xs font-medium text-red-600">{uploaded.rejectionReason}</p>}{uploaded.status === "REJECTED" && <p className="mt-2 text-xs font-semibold text-red-700">Please upload a replacement document.</p>}<div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void downloadDocument(uploaded.id, uploaded.originalName)}><Download className="mr-1 h-3.5 w-3.5" />Download</Button>{canReplace && <><Label htmlFor={`replace-${requirement.code}`} className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"><Upload className="mr-1 h-3.5 w-3.5" />{uploaded.status === "REJECTED" ? "Upload replacement" : "Replace"}</Label><Input id={`replace-${requirement.code}`} className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => void uploadDocument(requirement.code, event.target.files?.[0])} /><Button size="sm" variant="ghost" className="text-red-600" disabled={deleting === uploaded.id} onClick={() => void removeDocument(uploaded.id)}>{deleting === uploaded.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</Button></>}</div></div> : editable ? <div className="mt-4"><Label htmlFor={`upload-${requirement.code}`} className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center hover:border-amber-400"><Upload className="mb-2 h-7 w-7 text-slate-400" /><span className="text-sm font-semibold">{uploading === requirement.code ? "Uploading…" : "Select document"}</span><span className="mt-1 text-xs text-slate-500">PDF, JPG or PNG · maximum 15MB</span></Label><Input id={`upload-${requirement.code}`} className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={uploading === requirement.code} onChange={(event) => void uploadDocument(requirement.code, event.target.files?.[0])} /></div> : <p className="mt-4 text-sm text-slate-500">No document uploaded.</p>}</div>;
    })}</CardContent></Card>
    {editable && <div className="flex flex-col items-end gap-2 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:justify-between"><p className="text-sm text-slate-600">Submission locks editing until the compliance team makes a decision.</p><Button size="lg" onClick={() => void submit()} disabled={submitting || saving}>{submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Shield className="mr-2 h-5 w-5" />}{data.submissionRevision > 0 ? "Resubmit for review" : "Submit for review"}</Button></div>}
  </div>;
}

function FieldGrid({ title, fields, values, disabled, onChange }: { title: string; fields: KycFieldRequirement[]; values: Record<string, string>; disabled: boolean; onChange: (code: string, value: string) => void }) {
  if (!fields.length) return null;
  return <section><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3><div className="grid gap-4 md:grid-cols-2">{fields.map((field) => <div key={field.code} className={field.type === "textarea" ? "md:col-span-2" : ""}><Label htmlFor={field.code}>{field.label}</Label>{field.type === "textarea" ? <textarea id={field.code} value={values[field.code] || ""} disabled={disabled} onChange={(event) => onChange(field.code, event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50" /> : <Input id={field.code} type={field.type || "text"} value={values[field.code] || ""} disabled={disabled || field.code === "targetTrack"} onChange={(event) => onChange(field.code, event.target.value)} className="mt-1" />}</div>)}</div></section>;
}

function DocumentStatus({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  if (status === "APPROVED") return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
  if (status === "REJECTED") return <Badge className="bg-red-100 text-red-700"><AlertCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-700">Awaiting review</Badge>;
}
