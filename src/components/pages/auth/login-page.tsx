"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/appStore";
import { api, authAPI, authStorage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await authAPI.loginInvestor(email, password, rememberMe);
    setIsLoading(false);
    if (!response.success || !response.data) {
      toast.error("Sign in failed", response.error || "Check your email and password and try again.");
      return;
    }

    if ("verificationRequired" in response.data) {
      sessionStorage.setItem("urbco_pending_email", response.data.email);
      toast.info("Email verification required", "Enter the verification code sent when you created your account.");
      router.push(`/auth/otp-verify?email=${encodeURIComponent(response.data.email)}`);
      return;
    }

    const authenticatedUser = {
      id: response.data.user.id,
      email: response.data.user.email,
      fullName: response.data.user.name,
      phone: response.data.user.phone || "",
      country: "",
      investmentExperience: "beginner" as const,
      riskAppetite: "medium" as const,
      kycStatus: "pending" as const,
      investorTrack: response.data.investor.track === "FOUNDRY" ? "foundry" as const : "harbor" as const,
      entityType: response.data.investor.entityType === "FAMILY_OFFICE"
        ? "family-office" as const
        : response.data.investor.entityType === "INSTITUTION"
        ? "institution" as const
        : "individual" as const,
      createdAt: new Date(),
    };
    authStorage.setToken(response.data.access_token);
    authStorage.setUser(authenticatedUser);
    api.setAuthToken(response.data.access_token);
    setUser(authenticatedUser);
    toast.success("Welcome back", "You are now signed in to your investor account.");
    router.push(response.data.nextStep === "ENTITY_ONBOARDING" ? "/profile/kyc" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-white flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <img src="/urbco-logo.svg" alt="Urbco" className="h-10" />
        </Link>

        <Card className="border border-slate-200/80 shadow-[0_4px_8px_-2px_rgb(15_23_42/0.08),0_12px_24px_-6px_rgb(15_23_42/0.08)]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your investment account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-emerald-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="premium" className="w-full" isLoading={isLoading}>
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-emerald-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
