"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Calendar, Edit2, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/stores/appStore";
import { authAPI, authStorage } from "@/lib/api";
import { investorProfileToUser } from "@/lib/investor-user";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "UK", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "AE", name: "United Arab Emirates" },
];

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

export default function ProfilePage() {
  const { user, authInitialized, setUser } = useAppStore();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", countryCode: "NG" });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName,
      phone: user.phone,
      countryCode: user.countryCode || "NG",
    });
  }, [user]);

  const cancelEditing = () => {
    if (user) {
      setForm({
        fullName: user.fullName,
        phone: user.phone,
        countryCode: user.countryCode || "NG",
      });
    }
    setIsEditing(false);
  };

  const saveProfile = async () => {
    const fullName = form.fullName.trim();
    const phone = form.phone.replace(/[\s()-]/g, "");
    if (!NAME_PATTERN.test(fullName)) {
      toast.error("Enter a valid full name", "Use letters, spaces, apostrophes, hyphens, and periods only.");
      return;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      toast.error("Enter a valid phone number", "Use an international number such as +2348012345678.");
      return;
    }

    setIsSaving(true);
    const response = await authAPI.updateInvestorProfile({
      fullName,
      phone,
      countryCode: form.countryCode,
    });
    setIsSaving(false);
    if (!response.success || !response.data) {
      toast.error("Unable to save profile", response.error || "Please try again.");
      return;
    }

    const updatedUser = investorProfileToUser(response.data, user);
    authStorage.setUser(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
    toast.success("Profile updated", "Your changes have been saved.");
  };

  if (!authInitialized) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>;
  }

  if (!user) {
    return <div className="rounded-xl border border-line bg-white p-6 text-sm text-slate-600">Unable to load your profile. Please sign in again.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="text-slate-500">Manage your personal information</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="relative inline-block">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-emerald-100" />
                ) : (
                  <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 text-4xl font-bold text-emerald-700">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{user.fullName}</h2>
              <p className="text-slate-500 mb-4">{user.email}</p>
              
              <Badge variant={user?.kycStatus === "verified" ? "success" : "warning"} className="mb-6">
                {user?.kycStatus === "verified" ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> KYC Verified</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> KYC Pending</>
                )}
              </Badge>

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{user.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{user.country || "Not provided"}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            <Button variant="outline" size="sm" onClick={() => isEditing ? cancelEditing() : setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" /> {isEditing ? "Cancel" : "Edit"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  value={user.email}
                  disabled
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value.replace(/[^\d+()\s-]/g, "") }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Country</Label>
                <Select value={form.countryCode} onValueChange={(countryCode) => setForm((current) => ({ ...current, countryCode }))} disabled={!isEditing}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isEditing && (
              <Button variant="premium" className="mt-4" onClick={() => void saveProfile()} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-slate-500">Investment Experience</Label>
              <div className="mt-2 p-4 bg-slate-50 rounded-xl">
                <p className="font-semibold text-slate-900 capitalize">{user.investmentExperience}</p>
                <p className="text-sm text-slate-500">
                  {user?.investmentExperience === "beginner" ? "0-2 years of experience" :
                   user?.investmentExperience === "intermediate" ? "2-5 years of experience" :
                   "5+ years of experience"}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-slate-500">Risk Appetite</Label>
              <div className="mt-2 p-4 bg-slate-50 rounded-xl">
                <p className="font-semibold text-slate-900 capitalize">{user.riskAppetite}</p>
                <p className="text-sm text-slate-500">
                  {user?.riskAppetite === "low" ? "Capital preservation focused" :
                   user?.riskAppetite === "medium" ? "Balanced growth approach" :
                   "Maximum returns focused"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Upload className="h-4 w-4 mr-2" /> Upload Documents
            </Button>
            <Button variant="outline" className="justify-start">
              <User className="h-4 w-4 mr-2" /> Change Password
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertCircle className="h-4 w-4 mr-2" /> Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
