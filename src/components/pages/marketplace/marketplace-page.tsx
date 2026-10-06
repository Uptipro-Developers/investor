"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Search, Crown, Anchor, Grid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/stores/appStore";
import { formatCurrency, formatPercentage, formatCompactNumber } from "@/lib/utils";
import Link from "next/link";

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | "pre-development" | "post-development">("all");
  const [filters, setFilters] = useState({
    location: "all",
    propertyType: "all",
    status: "all",
  });

  const { properties, propertiesLoading, propertiesError, loadProperties, user } = useAppStore();

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  const activeTrack = user?.investorTrack || properties[0]?.targetTrack;

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage =
      stageFilter === "all" || property.developmentStage === stageFilter;

    const matchesLocation =
      !filters.location || filters.location === "all" || property.location.includes(filters.location);
    const matchesType =
      !filters.propertyType || filters.propertyType === "all" || property.propertyType === filters.propertyType;
    const matchesStatus =
      !filters.status || filters.status === "all" || property.status === filters.status;

    return matchesSearch && matchesStage && matchesLocation && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">Own-a-Fraction</h1>
          <p className="mt-1 text-sm text-slate-500">Browse trustee-secured Nigerian real estate allocations</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-sunken px-4 py-2 text-sm font-semibold text-slate-700">
          {activeTrack === "foundry" ? <Crown className="h-4 w-4 text-accent-700" /> : <Anchor className="h-4 w-4 text-brand-700" />}
          Your track: {activeTrack === "foundry" ? "Urbco Foundry" : activeTrack === "harbor" ? "Urbco Harbour" : "Loading"}
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by property name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Development Stage Filter */}
              <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as typeof stageFilter)}>
                <SelectTrigger className="w-44 bg-slate-50">
                  <SelectValue placeholder="Development Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Development Stages</SelectItem>
                  <SelectItem value="pre-development">Pre-Development</SelectItem>
                  <SelectItem value="post-development">Post-Development</SelectItem>
                </SelectContent>
              </Select>

              {/* Location Filter */}
              <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Lagos">Lagos</SelectItem>
                  <SelectItem value="Abuja">Abuja</SelectItem>
                  <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
                  <SelectItem value="Ibadan">Ibadan</SelectItem>
                </SelectContent>
              </Select>

              {/* Property Type Filter */}
              <Select value={filters.propertyType} onValueChange={(value) => setFilters({ ...filters, propertyType: value })}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed-use">Mixed Use</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className="rounded-none h-10 w-10"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className="rounded-none h-10 w-10"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count & Track Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-slate-600">
        <p>
          Showing <span className="font-bold text-slate-900">{filteredProperties.length}</span> properties
          {stageFilter !== "all" && (
            <span> (<strong className="text-brand-700">{stageFilter.replace("-", " ")}</strong> stage)</span>
          )}
        </p>

        {activeTrack === "foundry" && (
          <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-800">
            Urbco Foundry — mega assets from ₦200M
          </span>
        )}
        {activeTrack === "harbor" && (
          <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Urbco Harbour — entry from ₦100K
          </span>
        )}
      </div>

      {propertiesLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading marketplace assets">
          {[1, 2, 3].map((item) => <div key={item} className="h-[28rem] animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      )}

      {propertiesError && !propertiesLoading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h3 className="font-semibold text-red-900">Marketplace unavailable</h3>
          <p className="mt-1 text-sm text-red-700">{propertiesError}</p>
          <Button variant="outline" className="mt-4" onClick={() => void loadProperties()}>Try Again</Button>
        </div>
      )}

      {/* Properties Grid View */}
      {!propertiesLoading && !propertiesError && (viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/assets/${property.slug}`}>
                <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 h-full border border-slate-200">
                  <div className="relative h-56 overflow-hidden">
                    {property.images[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-100"><Building2 className="h-12 w-12 text-slate-300" /></div>
                    )}

                    {/* Stage badge only — keep the image clean */}
                    <div className="absolute left-3 top-3">
                      <Badge
                        className={
                          property.developmentStage === "pre-development"
                            ? "bg-brand-600 text-white"
                            : "bg-emerald-600 text-white"
                        }
                      >
                        {property.developmentStage === "pre-development" ? "Pre-dev" : "Post-dev"}
                      </Badge>
                    </div>

                    {/* ROI badge */}
                    <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 shadow-soft backdrop-blur">
                      <span className="text-xs font-bold text-emerald-700">
                        {formatPercentage(property.projectedROI)} ROI
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    {/* Track + buying paths, outside the image */}
                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      <Badge
                        className={
                          property.targetTrack === "foundry"
                            ? "bg-accent-100 text-accent-800"
                            : property.targetTrack === "harbor"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {property.targetTrack === "foundry"
                          ? "Urbco Foundry"
                          : property.targetTrack === "harbor"
                          ? "Urbco Harbour"
                          : "Both tracks"}
                      </Badge>
                      {property.buyingPaths.some((p) => p.type === "investment") && (
                        <Badge variant="secondary" className="font-normal">Investment</Badge>
                      )}
                      {property.buyingPaths.some((p) => p.type === "ownership") && (
                        <Badge variant="secondary" className="font-normal">Ownership</Badge>
                      )}
                    </div>

                    <h3 className="font-display text-base font-bold leading-snug text-slate-900 group-hover:text-brand-700 transition-colors">
                      {property.name}
                    </h3>
                    <p className="mt-1 flex items-center text-xs text-slate-500">
                      <MapPin className="mr-1 h-3 w-3" />{property.location}
                    </p>
                    {/* Funding Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-600">Funding Progress</span>
                        <span className="font-semibold text-slate-900">
                          {formatPercentage(property.fundingProgress)}
                        </span>
                      </div>
                      <Progress value={property.fundingProgress} className="h-2" />
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                        <span>{formatCompactNumber(property.propertyValue)} valuation</span>
                        <span>{property.investorsCount} {property.investorsCount === 1 ? "investor" : "investors"}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-t border-slate-100 text-xs">
                      <div>
                        <div className="text-slate-500 mb-0.5">Min Entry Ticket</div>
                        <p className="font-bold text-slate-900">
                          {formatCurrency(property.minimumInvestment || property.costPerFraction)}
                        </p>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-0.5">Rental Yield</div>
                        <p className="font-bold text-emerald-600">
                          {formatPercentage(property.rentalYield)}
                        </p>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-0.5">Capital Growth</div>
                        <p className="font-bold text-purple-600">+{property.capitalAppreciation}%</p>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-0.5">Property Type</div>
                        <p className="font-semibold text-slate-800 capitalize">{property.propertyType}</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button variant="premium" className="w-full mt-3 font-semibold">
                      View Asset Details
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/assets/${property.slug}`}>
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-200">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-80 h-48 md:h-auto overflow-hidden">
                        {property.images[0] ? (
                          <img
                            src={property.images[0]}
                            alt={property.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-100"><Building2 className="h-12 w-12 text-slate-300" /></div>
                        )}
                        <div className="absolute left-3 top-3 flex gap-1.5">
                          <Badge className={property.developmentStage === "pre-development" ? "bg-brand-600 text-white" : "bg-emerald-600 text-white"}>
                            {property.developmentStage === "pre-development" ? "Pre-dev" : "Post-dev"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex-1 p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-1.5">
                          <Badge className={property.targetTrack === "foundry" ? "bg-accent-100 text-accent-800" : property.targetTrack === "harbor" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-700"}>
                            {property.targetTrack === "foundry" ? "Urbco Foundry" : property.targetTrack === "harbor" ? "Urbco Harbour" : "Both tracks"}
                          </Badge>
                          {property.buyingPaths.some((p) => p.type === "investment") && (
                            <Badge variant="secondary" className="font-normal">Investment</Badge>
                          )}
                          {property.buyingPaths.some((p) => p.type === "ownership") && (
                            <Badge variant="secondary" className="font-normal">Ownership</Badge>
                          )}
                        </div>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                              {property.name}
                            </h3>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                              {property.location}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-2xl font-extrabold text-brand-700">
                              {formatPercentage(property.projectedROI)}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">Projected ROI</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-xs">
                          <div>
                            <div className="text-slate-500">Min Ticket</div>
                            <div className="font-bold text-slate-900">
                              {formatCurrency(property.minimumInvestment || property.costPerFraction)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Rental Yield</div>
                            <div className="font-bold text-emerald-600">
                              {formatPercentage(property.rentalYield)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Funding</div>
                            <div className="font-bold text-slate-900">
                              {formatPercentage(property.fundingProgress)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Valuation</div>
                            <div className="font-bold text-slate-900">
                              {formatCompactNumber(property.propertyValue)}
                            </div>
                          </div>
                        </div>

                        <Progress value={property.fundingProgress} className="mb-4 h-2" />

                        <Button variant="premium" className="w-full md:w-auto">
                          View Investment Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ))}

      {/* Empty State */}
      {!propertiesLoading && !propertiesError && filteredProperties.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties matched your search</h3>
          <p className="text-slate-500 text-sm">Try clearing your filters or switching tracks</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setStageFilter("all");
              setSearchQuery("");
            }}
          >
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
