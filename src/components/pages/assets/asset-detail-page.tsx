"use client";

import { useEffect, useState } from "react";
import {
  MapPin, Building2, Bath, Maximize, CheckCircle, Play, Calculator,
  Share2, Info, FileText, ShieldCheck, CalendarClock, Receipt,
  SplitSquareHorizontal, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatPercentage, calculateDividend, calculateROI } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/stores/appStore";
import { authStorage, propertiesAPI } from "@/lib/api";
import type { Property } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function AssetDetailPage() {
  const params = useParams<{ slug: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void propertiesAPI.detail(params.slug).then((response) => {
      if (!active) return;
      if (!response.success || !response.data) {
        setError(response.error || "This asset is unavailable for your investment track.");
        setIsLoading(false);
        return;
      }
      setProperty(response.data);
      setError(null);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.slug]);

  if (isLoading) {
    return <div className="h-[32rem] animate-pulse rounded-2xl bg-slate-100" aria-label="Loading asset details" />;
  }

  if (!property || error) {
    return (
      <Card className="mx-auto max-w-xl border-slate-200">
        <CardContent className="p-10 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Asset unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">{error || "The asset could not be found."}</p>
          <Link href="/marketplace"><Button className="mt-6">Back to Marketplace</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return <AssetDetailContent property={property} />;
}

function AssetDetailContent({ property }: { property: Property }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAppStore();
  const authenticatedUser = user || authStorage.getUser();
  
  const [selectedFractions, setSelectedFractions] = useState(1);
  const [investmentAmount, setInvestmentAmount] = useState(property.costPerFraction);
  const [holdingPeriod, setHoldingPeriod] = useState(3);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [downloadingDocument, setDownloadingDocument] = useState<string | null>(null);

  const fractionsRemaining = Math.max(0, property.totalFractions - property.fractionsSold);
  const investmentValue = selectedFractions * property.costPerFraction;
  const quarterlyDividend = calculateDividend(investmentValue, property.rentalYield, "quarterly");
  const annualDividend = quarterlyDividend * 4;
  const totalROI = calculateROI(investmentValue, property.projectedROI, holdingPeriod);

  const handleInvest = () => {
    if (!authenticatedUser) {
      router.push("/auth/login");
      return;
    }
    if (authenticatedUser.kycStatus !== "verified") {
      router.push("/profile/kyc");
      return;
    }
    if (property.status === "closed" || fractionsRemaining < 1 || property.costPerFraction <= 0) return;
    router.push(`/checkout/${property.id}?fractions=${selectedFractions}`);
  };

  const handleFractionChange = (fractions: number) => {
    const nextFractions = Math.min(fractionsRemaining, Math.max(1, Math.floor(Number.isFinite(fractions) ? fractions : 1)));
    setSelectedFractions(nextFractions);
    setInvestmentAmount(nextFractions * property.costPerFraction);
  };

  const handleAmountChange = (amount: number) => {
    if (property.costPerFraction <= 0) return;
    const nextFractions = Math.min(fractionsRemaining, Math.max(1, Math.floor(amount / property.costPerFraction)));
    setInvestmentAmount(nextFractions * property.costPerFraction);
    setSelectedFractions(nextFractions);
  };

  const handleDocumentDownload = async (document: Property["documents"][number]) => {
    setDownloadingDocument(document.id);
    const response = await propertiesAPI.downloadDocument(property.slug, document.id);
    setDownloadingDocument(null);
    if (!response.success || !response.data) {
      toast.error("Download failed", response.error || "Please try again.");
      return;
    }
    const objectUrl = URL.createObjectURL(response.data);
    const link = window.document.createElement("a");
    link.href = objectUrl;
    link.download = document.name;
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  const handleShare = async () => {
    const shareData = { title: property.name, text: property.description, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied", "The asset link is ready to share.");
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <Link href="/marketplace" className="hover:text-emerald-600">Marketplace</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{property.name}</span>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Content */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Image Gallery */}
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-muted sm:aspect-[16/9]">
              {property.images[activeImageIndex] ? (
                <img
                  src={property.images[activeImageIndex]}
                  alt={`${property.name} — image ${activeImageIndex + 1} of ${property.images.length}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-100"><Building2 className="h-16 w-16 text-slate-300" /></div>
              )}

              {/* Video tour */}
              {property.videoUrl && (
                <Dialog open={showVideo} onOpenChange={setShowVideo}>
                  <DialogTrigger asChild>
                    <Button
                      variant="premium"
                      size="icon"
                      className="absolute right-4 top-4 rounded-full shadow-lifted"
                      aria-label="Play video tour"
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-line bg-surface-sunken">
                      <div className="text-center">
                        <Play className="mx-auto h-10 w-10 text-brand-600" />
                        <p className="mt-3 text-sm font-medium text-slate-600">Video tour for {property.name}</p>
                        <a
                          href={property.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Open Video Tour
                        </a>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Status badge */}
              <div className="absolute left-4 top-4">
                <Badge variant={property.status === "open" ? "success" : "warning"} className="px-3 py-1.5 text-xs font-semibold">
                  {property.status === "open" ? "Open for investment" : property.status === "closed" ? "Allocation closed" : "Funding in progress"}
                </Badge>
              </div>

              {/* Share */}
              <div className="absolute bottom-4 right-4">
                <Button variant="secondary" size="icon" className="rounded-full shadow-lifted" aria-label="Share asset" onClick={() => void handleShare()}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Thumbnails */}
            {property.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto p-4">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-current={activeImageIndex === index}
                    className={`h-14 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:h-16 sm:w-24 ${
                      activeImageIndex === index
                        ? "border-brand-600 opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Property Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">{property.name}</CardTitle>
                  <div className="flex items-center text-slate-500">
                    <MapPin className="h-5 w-5 mr-2" />
                    {property.fullAddress}
                  </div>
                </div>
                <Badge variant="premium" className="text-sm px-4 py-2">
                  {formatPercentage(property.projectedROI)} Total ROI
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 leading-relaxed mb-6">{property.description}</p>

              {/* Property Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{property.rooms}</div>
                    <div className="text-sm text-slate-500">Rooms</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                  <Bath className="h-6 w-6 text-emerald-600" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{property.bathrooms}</div>
                    <div className="text-sm text-slate-500">Bathrooms</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                  <Maximize className="h-6 w-6 text-emerald-600" />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{property.squareMeters.toLocaleString()}</div>
                    <div className="text-sm text-slate-500 whitespace-nowrap">Sq m</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <div>
                    <div className="text-lg font-bold text-slate-900 capitalize">{property.furnishingStatus}</div>
                    <div className="text-sm text-slate-500">Furnishing</div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="px-3 py-1.5">
                      <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" />
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Construction Status */}
              {property.constructionStatus !== "completed" && (
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center space-x-2 text-amber-800 mb-2">
                    <Info className="h-5 w-5" />
                    <span className="font-semibold">Construction Status: {property.constructionStatus}</span>
                  </div>
                  <p className="text-sm text-amber-700">Expected completion: {property.constructionTimeline}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-500 mb-1">Property Value</div>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(property.propertyValue)}</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-sm text-emerald-600 mb-1">Investment Available</div>
                  <div className="text-2xl font-bold text-emerald-700">{formatCurrency(property.investmentAvailable)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-500 mb-1">Cost Per Fraction</div>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(property.costPerFraction)}</div>
                </div>
              </div>

              {/* Funding Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Funding Progress</span>
                  <span className="font-semibold text-slate-900">{formatPercentage(property.fundingProgress)}</span>
                </div>
                <Progress value={property.fundingProgress} className="h-3" />
                <div className="flex justify-between text-sm text-slate-500 mt-2">
                  <span>{formatCurrency(property.fractionsSold * property.costPerFraction)} raised</span>
                  <span>{fractionsRemaining} fractions remaining</span>
                </div>
              </div>

              {/* Investor Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{property.fractionsSold}</div>
                  <div className="text-sm text-slate-500">Fractions Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{fractionsRemaining}</div>
                  <div className="text-sm text-slate-500">Fractions Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{property.investorsCount}</div>
                  <div className="text-sm text-slate-500">Total Investors</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset Identity & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Identity &amp; Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Reference Code</div>
                  <div className="font-bold text-slate-900">{property.referenceCode}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Developer / Partner</div>
                  <div className="font-bold text-slate-900">{property.developerCompany}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Project Status</div>
                  <div className="font-bold text-slate-900 capitalize">{property.projectStatus.replace("-", " ")}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Investment Program</div>
                  <div className="font-bold text-slate-900 capitalize">{property.investmentProgram}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={
                    property.targetTrack === "foundry"
                      ? "bg-amber-400 text-black font-bold"
                      : property.targetTrack === "harbor"
                      ? "bg-cyan-400 text-black font-bold"
                      : "bg-slate-200 text-black font-bold"
                  }
                >
                  {property.targetTrack === "foundry" ? "Institutional track" : property.targetTrack === "harbor" ? "Fractional track" : "Both tracks"}
                </Badge>
                {property.facilityManagement && (
                  <Badge variant="secondary" className="px-3 py-1.5">
                    <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" />
                    Facility Management
                  </Badge>
                )}
                <Badge variant="secondary" className="px-3 py-1.5 capitalize">
                  {property.developmentStage.replace("-", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Investment Program & Buying Paths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SplitSquareHorizontal className="h-5 w-5 text-emerald-600" />
                Investment Program &amp; Buying Paths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {property.buyingPaths.map((bp, i) =>
                bp.type === "investment" ? (
                  <div key={i} className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-indigo-600 text-white font-bold">Investment Path</Badge>
                      <Badge variant="secondary" className="capitalize border border-indigo-300 text-indigo-700">
                        {bp.interestStructure === "fractional" ? "Fractional Interest" : "Single-Ticket"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Instrument</div>
                        <div className="font-semibold text-slate-900">{bp.instrument}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Min Investment</div>
                        <div className="font-semibold text-slate-900">{formatCurrency(bp.minimumInvestment || 0)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Total Funding Required</div>
                        <div className="font-semibold text-slate-900">{formatCurrency(bp.totalFundingRequired || 0)}</div>
                      </div>
                      {bp.investmentWindow && (
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Investment Window</div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />
                            {new Date(bp.investmentWindow.open).toLocaleDateString("en-US", { month: "short", year: "numeric" })} –{" "}
                            {new Date(bp.investmentWindow.close).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">Investor Rights: </span>
                        <span className="text-slate-800">{bp.investorRights}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Exit / Redemption: </span>
                        <span className="text-slate-800">{bp.exitRedemptionTerms}</span>
                      </div>
                    </div>
                    {bp.fractionBreakdown && bp.fractionBreakdown.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-600 mb-2">Fraction Tiers</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-slate-500 border-b border-slate-200">
                                <th className="py-2 pr-4 font-medium">Tier</th>
                                <th className="py-2 pr-4 font-medium">Fractions</th>
                                <th className="py-2 pr-4 font-medium">Price / Fraction</th>
                                <th className="py-2 font-medium">Benefits</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bp.fractionBreakdown.map((tier) => (
                                <tr key={tier.id} className="border-b border-slate-100">
                                  <td className="py-2 pr-4 font-medium text-slate-900">{tier.name}</td>
                                  <td className="py-2 pr-4 text-slate-700">{tier.totalFractions}</td>
                                  <td className="py-2 pr-4 text-slate-700">{formatCurrency(tier.pricePerFraction)}</td>
                                  <td className="py-2 text-slate-600">
                                    {tier.benefits?.map((b) => (
                                      <span key={b} className="inline-block mr-2 text-xs bg-slate-100 rounded px-2 py-0.5">{b}</span>
                                    ))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {bp.settlementFlow && bp.settlementFlow.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-600 mb-2">Settlement Flow (Terms → Payment → Custody → Reconciliation → Release)</div>
                        <div className="flex flex-wrap items-center gap-2">
                          {bp.settlementFlow.map((s, si) => (
                            <div key={s.key} className="flex items-center gap-2">
                              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${s.status === "completed" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                                <span className={`h-2 w-2 rounded-full ${s.status === "completed" ? "bg-emerald-500" : "bg-slate-300"}`} />
                                {s.label}
                              </div>
                              {si < bp.settlementFlow!.length - 1 && <span className="text-slate-300">→</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : bp.type === "ownership" ? (
                  <div key={i} className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-teal-600 text-white font-bold">Ownership Path</Badge>
                      <Badge variant="secondary" className="capitalize border border-teal-300 text-teal-700">
                        {bp.releaseBasis === "milestone" ? "Milestone Release" : "Scheduled Release"}
                      </Badge>
                    </div>
                    {bp.releaseBasis === "milestone" && bp.milestones && (
                      <div className="space-y-3 mb-4">
                        {bp.milestones.map((m) => (
                          <div key={m.id} className="flex items-start gap-3">
                            <div
                              className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                                m.status === "completed" ? "bg-teal-600" : m.status === "in_progress" ? "bg-amber-500" : "bg-slate-300"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-900">{m.name}</span>
                                <span className="text-xs font-bold text-teal-700">{m.releasePct}% release</span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {m.targetDate ? new Date(m.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Date to be announced"}
                                {m.description ? ` · ${m.description}` : ""}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {bp.titleTerms && (
                      <div className="text-sm">
                        <span className="text-slate-500">Title Terms: </span>
                        <span className="text-slate-800">{bp.titleTerms}</span>
                      </div>
                    )}
                    {bp.settlementFlow && bp.settlementFlow.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-600 mb-2">Settlement Flow (Terms → Payment → Custody → Reconciliation → Release)</div>
                        <div className="flex flex-wrap items-center gap-2">
                          {bp.settlementFlow.map((s, si) => (
                            <div key={s.key} className="flex items-center gap-2">
                              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${s.status === "completed" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                                <span className={`h-2 w-2 rounded-full ${s.status === "completed" ? "bg-emerald-500" : "bg-slate-300"}`} />
                                {s.label}
                              </div>
                              {si < bp.settlementFlow!.length - 1 && <span className="text-slate-300">→</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null
              )}
            </CardContent>
          </Card>

          {/* Pricing & Payment Logic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                Pricing &amp; Payment Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-xs text-emerald-600 mb-1">Asset Price</div>
                  <div className="text-lg font-bold text-emerald-700">{formatCurrency(property.pricing.finalSellingPrice)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Minimum Allocation</div>
                  <div className="text-lg font-bold text-slate-900">{formatCurrency(property.minimumInvestment || property.costPerFraction)}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Payment Options</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {property.pricing.paymentOptions.map((po, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900">{po.label}</span>
                        {po.downPaymentPct != null && (
                          <Badge variant="secondary" className="text-xs">{po.downPaymentPct}% deposit</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{po.description}</p>
                      {po.trancheCount != null && (
                        <p className="text-xs text-slate-600 mt-1">{po.trancheCount} tranches · {po.tranchePeriodMonths}-month intervals</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Stage Discounts</h4>
                <div className="flex flex-wrap gap-2">
                  {property.pricing.discounts.map((d, i) => (
                    <Badge key={i} variant="secondary" className="capitalize border border-emerald-300 text-emerald-700">
                      {d.stage.replace("-", " ")} · -{d.discountPct}% · {d.description}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Returns Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Return Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="rental">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="rental">Rental Income</TabsTrigger>
                  <TabsTrigger value="appreciation">Capital Appreciation</TabsTrigger>
                  <TabsTrigger value="projections">Projections</TabsTrigger>
                </TabsList>
                <TabsContent value="rental" className="mt-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <div className="text-sm text-emerald-600 mb-1">Rent Per Quarter</div>
                      <div className="text-2xl font-bold text-emerald-700">{formatCurrency(property.rentPerQuarter)}</div>
                      <div className="text-xs text-emerald-600 mt-1">Per fraction</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <div className="text-sm text-emerald-600 mb-1">Annual Rental Yield</div>
                      <div className="text-2xl font-bold text-emerald-700">{formatPercentage(property.rentalYield)}</div>
                      <div className="text-xs text-emerald-600 mt-1">Guaranteed income</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <div className="text-sm text-emerald-600 mb-1">First Dividend</div>
                      <div className="text-lg font-bold text-emerald-700">{property.firstDividendDate ? new Date(property.firstDividendDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "To be announced"}</div>
                      <div className="text-xs text-emerald-600 mt-1">Payment date</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="appreciation" className="mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-teal-50 rounded-xl">
                      <div className="text-sm text-teal-600 mb-1">Annual Appreciation</div>
                      <div className="text-2xl font-bold text-teal-700">{formatPercentage(property.capitalAppreciation)}</div>
                      <div className="text-xs text-teal-600 mt-1">Projected growth</div>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-xl">
                      <div className="text-sm text-teal-600 mb-1">Total Projected ROI</div>
                      <div className="text-2xl font-bold text-teal-700">{formatPercentage(property.projectedROI)}</div>
                      <div className="text-xs text-teal-600 mt-1">Rental + Appreciation</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="projections" className="mt-4">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="text-sm text-slate-500 mb-1">Projected Rental Income</div>
                      <div className="text-2xl font-bold text-slate-900">{formatCurrency(property.returns.projectedRentalIncome)}</div>
                      <div className="text-xs text-slate-500 mt-1 capitalize">{property.returns.frequency} distribution</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="text-sm text-slate-500 mb-1">Operating Costs</div>
                      <div className="text-2xl font-bold text-slate-900">{formatCurrency(property.returns.operatingCosts)}</div>
                      <div className="text-xs text-slate-500 mt-1">Annual estimate</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <div className="text-sm text-emerald-600 mb-1">First Payout</div>
                      <div className="text-lg font-bold text-emerald-700">
                        {property.returns.firstPayoutDate ? new Date(property.returns.firstPayoutDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "To be announced"}
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-teal-50 rounded-xl">
                      <div className="text-sm text-teal-600 mb-1">Yield Range</div>
                      <div className="text-xl font-bold text-teal-700">
                        {property.returns.yieldRange[0]}% – {property.returns.yieldRange[1]}%
                      </div>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-xl">
                      <div className="text-sm text-teal-600 mb-1">Appreciation Range</div>
                      <div className="text-xl font-bold text-teal-700">
                        +{property.returns.appreciationRange[0]}% – +{property.returns.appreciationRange[1]}%
                      </div>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-xl">
                      <div className="text-sm text-teal-600 mb-1">Total Return Range</div>
                      <div className="text-xl font-bold text-teal-700">
                        {property.returns.totalReturnRange[0]}% – {property.returns.totalReturnRange[1]}%
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Risk & Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Risk &amp; Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Construction Progress</div>
                  <div className="font-bold text-slate-900">{formatPercentage(property.risk.constructionProgress)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Risk Level</div>
                  <Badge
                    className={
                      property.risk.riskLevel === "low"
                        ? "bg-emerald-600 text-white"
                        : property.risk.riskLevel === "medium"
                        ? "bg-amber-500 text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {property.risk.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Management Mode</div>
                  <div className="font-semibold text-slate-900">{property.risk.managementMode}</div>
                </div>
              </div>

              <Progress value={property.risk.constructionProgress} className="h-2" />

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Risk Factors</h4>
                <div className="flex flex-wrap gap-2">
                  {property.risk.riskFactors.map((rf, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1.5">
                      <ShieldCheck className="h-3 w-3 mr-1 text-slate-500" />
                      {rf}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Off-Plan Security</div>
                  <p className="text-sm text-slate-700">{property.risk.offPlanSecurity}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Exit &amp; Liquidity</div>
                  <p className="text-sm text-slate-700">{property.risk.exitLiquidity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents & Virtual Tours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Documents &amp; Virtual Tours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {property.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{doc.name}</div>
                      <div className="text-xs text-slate-500 capitalize">{doc.type} document</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleDocumentDownload(doc)}
                      disabled={downloadingDocument === doc.id}
                      aria-label={`Download ${doc.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {property.virtualTours.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {property.virtualTours.map((vt) => (
                    <a key={vt.id} href={vt.url} target="_blank" rel="noreferrer" className="w-40">
                      <img src={vt.thumbnail} alt={vt.title} className="w-full h-24 object-cover rounded-lg" />
                      <div className="text-xs text-slate-600 mt-1 truncate">{vt.title}</div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ROI Calculator */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <CardTitle>ROI Calculator</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Investment Amount */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Fractions</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFractionChange(Math.max(1, selectedFractions - 1))}
                        aria-label="Decrease fractions"
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={selectedFractions}
                        onChange={(e) => handleFractionChange(Number(e.target.value))}
                        className="text-center"
                        min={1}
                        max={fractionsRemaining}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFractionChange(Math.min(fractionsRemaining, selectedFractions + 1))}
                        aria-label="Increase fractions"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Investment Amount (₦)</Label>
                    <Input
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => handleAmountChange(Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Holding Period */}
                <div>
                  <Label>Holding Period (Years)</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[1, 3, 5, 10].map((years) => (
                      <Button
                        key={years}
                        variant={holdingPeriod === years ? "premium" : "outline"}
                        onClick={() => setHoldingPeriod(years)}
                        className="w-full px-1 text-xs sm:text-sm"
                      >
                        {years === 1 ? "1 yr" : `${years} yrs`}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Returns Summary */}
                <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500 mb-1">Quarterly Dividend</div>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(quarterlyDividend)}</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500 mb-1">Annual Dividend</div>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(annualDividend)}</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                    <div className="text-sm text-white/80 mb-1">Total Returns ({holdingPeriod} years)</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(totalROI)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Investment CTA */}
        <div className="min-w-0 lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Invest in This Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Price per fraction</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(property.costPerFraction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Available fractions</span>
                  <span className="font-semibold text-emerald-600">{fractionsRemaining}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Min. investment</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(property.costPerFraction)}</span>
                </div>
              </div>

              {/* Fraction Selector */}
              <div>
                <Label>Number of Fractions</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFractionChange(Math.max(1, selectedFractions - 1))}
                    aria-label="Decrease fractions"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={selectedFractions}
                    onChange={(e) => handleFractionChange(Number(e.target.value))}
                    className="text-center font-semibold"
                    min={1}
                    max={fractionsRemaining}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFractionChange(Math.min(fractionsRemaining, selectedFractions + 1))}
                    aria-label="Increase fractions"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Investment Summary */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Investment</span>
                  <span className="font-bold text-slate-900">{formatCurrency(investmentValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Est. Quarterly Return</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(quarterlyDividend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Est. Annual Return</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(annualDividend)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Projected ROI</span>
                    <span className="font-bold text-emerald-600">{formatPercentage(property.projectedROI)}</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <Button
                variant="premium"
                className="h-14 w-full text-base sm:text-lg"
                onClick={handleInvest}
                disabled={property.status === "closed" || fractionsRemaining < 1 || property.costPerFraction <= 0}
              >
                {property.status === "closed" || fractionsRemaining < 1
                  ? "Allocation Closed"
                  : authenticatedUser && authenticatedUser.kycStatus !== "verified"
                  ? "Complete KYC to Invest"
                  : "Invest Now"}
              </Button>
              {/* Trust Indicators */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Verified Property</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Legal Documentation Complete</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Secure Investment</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
