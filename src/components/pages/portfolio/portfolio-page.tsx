"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Calendar, CheckCircle, Clock, DollarSign, PieChart as PieChartIcon, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { investmentsAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

type InvestmentRecord = { id: string; totalAmount: number | string; status?: string; date?: string; paymentReference?: string | null; asset?: { id: string; name: string; location?: string | null; images?: Array<string | { url?: string | null }> } | null };
const amountOf = (record: InvestmentRecord) => Number(record.totalAmount) || 0;
const imageOf = (record: InvestmentRecord) => {
  const image = record.asset?.images?.[0];
  return typeof image === "string" ? image : image?.url || undefined;
};

export default function PortfolioPage() {
  const [records, setRecords] = useState<InvestmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    const response = await investmentsAPI.list();
    setLoading(false);
    if (!response.success || !response.data) { setError(response.error || "Unable to load your portfolio."); return; }
    setRecords(Array.isArray(response.data) ? response.data : []);
  };
  useEffect(() => { void load(); }, []);
  const totalInvested = useMemo(() => records.reduce((sum, record) => sum + amountOf(record), 0), [records]);
  if (loading) return <Card><CardContent className="flex items-center justify-center gap-3 p-12 text-slate-600"><Clock className="h-5 w-5 animate-pulse" /> Loading your portfolio…</CardContent></Card>;
  if (error) return <Card className="border-red-200"><CardContent className="p-10 text-center"><p className="font-semibold text-red-700">{error}</p><Button className="mt-4" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button></CardContent></Card>;
  return <div className="space-y-8">
    <div><h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">My Portfolio</h1><p className="text-slate-500">Track your confirmed investment transactions</p></div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-600">Total Invested</CardTitle><DollarSign className="h-5 w-5 text-emerald-600" /></CardHeader><CardContent><div className="text-3xl font-bold text-slate-900">{formatCurrency(totalInvested)}</div><div className="mt-2 text-sm text-slate-500">Across {records.length} investment{records.length === 1 ? "" : "s"}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-600">Confirmed Investments</CardTitle><PieChartIcon className="h-5 w-5 text-blue-600" /></CardHeader><CardContent><div className="text-3xl font-bold text-slate-900">{records.filter((record) => record.status === "COMPLETED").length}</div><div className="mt-2 text-sm text-slate-500">Payment-verified transactions</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-600">Returns</CardTitle><TrendingUp className="h-5 w-5 text-amber-600" /></CardHeader><CardContent><div className="text-xl font-bold text-slate-700">Pending valuation</div><div className="mt-2 text-sm text-slate-500">Performance data will appear when available</div></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Investment transactions</CardTitle></CardHeader><CardContent>{records.length === 0 ? <div className="py-12 text-center text-slate-500"><Building2 className="mx-auto mb-3 h-8 w-8" /><p>You have no confirmed investments yet.</p><Link href="/marketplace" className="mt-4 inline-block text-sm font-semibold text-emerald-700">Explore the marketplace</Link></div> : <div className="space-y-4">{records.map((record) => <Link key={record.id} href={record.asset?.id ? `/assets/${record.asset.id}` : "/marketplace"} className="block"><div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 transition-colors hover:bg-slate-100 md:flex-row md:items-center"><div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-lg bg-slate-200">{imageOf(record) ? <img src={imageOf(record)} alt={record.asset?.name || "Investment asset"} className="h-full w-full object-cover" /> : <Building2 className="h-7 w-7 text-slate-400" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-slate-900">{record.asset?.name || "Investment"}</h4><Badge variant={record.status === "COMPLETED" ? "success" : "secondary"}>{record.status === "COMPLETED" ? <><CheckCircle className="mr-1 h-3 w-3" />Completed</> : record.status || "Pending"}</Badge></div><p className="text-sm text-slate-500">{record.asset?.location || "Urbco asset"}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Calendar className="h-3 w-3" />{record.date ? new Date(record.date).toLocaleDateString() : "—"}</p></div><div className="text-left md:text-right"><p className="text-xs text-slate-500">Amount invested</p><p className="font-semibold text-slate-900">{formatCurrency(amountOf(record))}</p>{record.paymentReference && <p className="mt-1 max-w-40 truncate font-mono text-[10px] text-slate-400">{record.paymentReference}</p>}</div></div></Link>)}</div>}</CardContent></Card>
  </div>;
}
