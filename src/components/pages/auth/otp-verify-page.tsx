"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, authAPI, authStorage } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import { useToast } from "@/hooks/use-toast";

export default function OTPVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-sunken" />}>
      <OTPVerifyContent />
    </Suspense>
  );
}

function OTPVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const setUser = useAppStore((state) => state.setUser);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email] = useState(searchParams.get("email") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next input
    if (element.value && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = e.currentTarget.previousSibling as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (!email || code.length !== 6) {
      toast.error("Enter the complete code", "A six-digit verification code is required.");
      return;
    }
    setIsLoading(true);
    const response = await authAPI.verifyInvestorEmail(email, code);
    setIsLoading(false);
    if (!response.success || !response.data) {
      toast.error("Verification failed", response.error || "Check the code and try again.");
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
    sessionStorage.removeItem("urbco_pending_email");
    toast.success("Email verified", "Your Urbco investor account is ready.");
    router.push(response.data.nextStep === "ENTITY_ONBOARDING" ? "/profile/kyc" : "/dashboard");
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email unavailable", "Return to signup and submit your account details again.");
      return;
    }
    setIsResending(true);
    const response = await authAPI.resendInvestorVerification(email);
    setIsResending(false);
    if (!response.success) {
      toast.error("Could not resend code", response.error || "Please try again shortly.");
      return;
    }
    toast.success("New code sent", "Check your email for the latest verification code.");
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
            <div className="w-16 h-16 rounded-full bg-emerald-50 ring-1 ring-inset ring-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="font-display text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a 6-digit code to {email || "your email address"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-14 text-center text-2xl font-bold"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <Button type="submit" variant="premium" className="w-full" isLoading={isLoading}>
                Verify Email <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Didn&apos;t receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-emerald-600 font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : "Resend"}
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
