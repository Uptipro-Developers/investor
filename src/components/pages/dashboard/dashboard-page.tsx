"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Calendar, CheckCircle, Clock, DollarSign, PieChart, RefreshCw, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { investmentsAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import Link from "next/link";

type InvestmentRecord = { id: string; totalAmount: number | string; status?: string; date?: string; asset?: { id: string; name: string; type?: string | null; location?: string | null; images?: Array<string | { url?: string | null }> } | null };
const amountOf = (record: InvestmentRecord) => Number(record.totalAmount) || 0;
const imageOf = (record: InvestmentRecord) => { const image = record.asset?.images?.[0]; return typeof image === "string" ? image : image?.url || undefined; };

export default function DashboardPage() {
  const user = useAppStore((state) => state.user);
  const [records, setRecords] = useState<InvestmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    const response = await investmentsAPI.list();
    setLoading(false);
    if (!response.success || !response.data) { setError(response.error || "Unable to load your dashboard."); return; }
    setRecords(Array.isArray(response.data) ? response.data : []);
  };
  useEffect(() => { void load(); }, []);
  const totalInvested = useMemo(() => records.reduce((sum, record) => sum + amountOf(record), 0), [records]);
  const completed = records.filter((record) => record.status === "COMPLETED");
  const allocation = useMemo(() => {
    const totals = new Map<string, number>();
    completed.forEach((record) => { const key = record.asset?.type || "Other"; totals.set(key, (totals.get(key) || 0) + amountOf(record)); });
    return [...totals.entries()].map(([name, value]) => ({ name, value, percent: totalInvested ? Math.round((value / totalInvested) * 100) : 0 }));
  }, [completed, totalInvested]);

  if (loading) return <Card><CardContent className="flex items-center justify-center gap-3 p-12 text-slate-600"><Clock className="h-5 w-5 animate-pulse" /> Loading your dashboard…</CardContent></Card>;
  if (error) return <Card className="border-red-200"><CardContent className="p-10 text-center"><p className="font-semibold text-red-700">{error}</p><Button className="mt-4" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button></CardContent></Card>;

  return <div className="space-y-8">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Your verified investment activity and account status</p></div><div className="flex gap-2"><Link href="/marketplace"><Button variant="outline"><Building2 className="mr-2 h-4 w-4" />Browse assets</Button></Link><Link href="/profile/kyc"><Button><Shield className="mr-2 h-4 w-4" />KYC profile</Button></Link></div></div>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      <Metric title="Total Invested" value={formatCurrency(totalInvested)} note={`${completed.length} completed transaction${completed.length === 1 ? "" : "s"}`} icon={<DollarSign className="h-5 w-5 text-emerald-600" />} />
      <Metric title="Portfolio Transactions" value={String(records.length)} note="Recorded investment transactions" icon={<PieChart className="h-5 w-5 text-blue-600" />} />
      <Metric title="Portfolio Value" value="Pending valuation" note="Valuation data is not available yet" icon={<TrendingUp className="h-5 w-5 text-teal-600" />} />
      <Metric title="Dividends" value="No data yet" note="Dividend records are not connected yet" icon={<Calendar className="h-5 w-5 text-amber-600" />} />
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Recent investments</CardTitle></CardHeader><CardContent>{records.length === 0 ? <EmptyState /> : <div className="space-y-3">{records.slice(0, 5).map((record) => <Link key={record.id} href={record.asset?.id ? `/assets/${record.asset.id}` : "/portfolio"} className="block"><div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3 hover:bg-slate-100"><div className="flex h-14 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200">{imageOf(record) ? <img src={imageOf(record)} alt={record.asset?.name || "Investment"} className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-slate-400" />}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{record.asset?.name || "Investment"}</p><p className="text-sm text-slate-500">{record.asset?.location || "Urbco asset"}</p><p className="mt-1 text-xs text-slate-500">{record.date ? new Date(record.date).toLocaleDateString() : "—"}</p></div><div className="text-right"><Badge variant={record.status === "COMPLETED" ? "success" : "secondary"}>{record.status || "Pending"}</Badge><p className="mt-1 font-semibold text-slate-900">{formatCurrency(amountOf(record))}</p></div></div></Link>)}</div>}{records.length > 5 && <Link href="/portfolio" className="mt-4 inline-block text-sm font-semibold text-emerald-700">View all investments →</Link>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Account status</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">KYC verification</p><div className="mt-2 flex items-center gap-2"><Badge variant={user?.kycStatus === "verified" ? "success" : "secondary"}>{user?.kycStatus === "verified" ? "Verified" : user?.kycStatus === "under_review" ? "Under review" : "Action required"}</Badge>{user?.kycStatus === "verified" && <CheckCircle className="h-4 w-4 text-emerald-600" />}</div></div><Link href="/profile/kyc"><Button variant="outline" className="w-full">View KYC status</Button></Link><p className="text-xs leading-relaxed text-slate-500">Investments are recorded only after payment verification and require completed KYC.</p></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Asset allocation</CardTitle></CardHeader><CardContent>{allocation.length === 0 ? <p className="py-6 text-sm text-slate-500">Allocation will appear after you have a completed investment.</p> : <div className="grid gap-3 sm:grid-cols-2">{allocation.map((item) => <div key={item.name} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between"><span className="font-medium text-slate-700">{item.name}</span><span className="font-semibold text-slate-900">{item.percent}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${item.percent}%` }} /></div><p className="mt-2 text-xs text-slate-500">{formatCurrency(item.value)}</p></div>)}</div>}</CardContent></Card>
  </div>;
}

function Metric({ title, value, note, icon }: { title: string; value: string; note: string; icon: React.ReactNode }) { return <Card className="relative overflow-hidden"><div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" /><CardContent className="pt-6"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-slate-600">{title}</span><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">{icon}</div></div><div className="font-display text-2xl font-bold tracking-tight text-slate-900">{value}</div><p className="mt-2 text-xs text-slate-500">{note}</p></CardContent></Card>; }
function EmptyState() { return <div className="py-10 text-center text-slate-500"><Building2 className="mx-auto mb-3 h-8 w-8" /><p>No investment transactions recorded yet.</p><Link href="/marketplace" className="mt-3 inline-block text-sm font-semibold text-emerald-700">Explore the marketplace</Link></div>; }
