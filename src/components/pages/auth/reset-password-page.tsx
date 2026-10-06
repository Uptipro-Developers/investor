"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI, authStorage } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import { useToast } from "@/hooks/use-toast";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-sunken" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const setUser = useAppStore((state) => state.setUser);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error("Invalid reset link", "Request a new password reset email and try again.");
      return;
    }
    if (!strongPassword.test(password)) {
      toast.error("Choose a stronger password", "Use at least 8 characters with uppercase, lowercase, a number, and a special character.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match", "Enter the same password in both fields.");
      return;
    }

    setIsLoading(true);
    const response = await authAPI.resetPassword(token, password);
    setIsLoading(false);
    if (!response.success) {
      toast.error("Password reset failed", response.error || "The reset link may have expired.");
      return;
    }

    authStorage.clear();
    setUser(null);
    setIsComplete(true);
    toast.success("Password updated", "Sign in with your new password.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-white flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8">
          <img src="/urbco-logo.svg" alt="Urbco" className="h-10" />
        </Link>
        <Card className="border border-slate-200/80 shadow-[0_4px_8px_-2px_rgb(15_23_42/0.08),0_12px_24px_-6px_rgb(15_23_42/0.08)]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl font-bold">
              {isComplete ? "Password Updated" : "Create New Password"}
            </CardTitle>
            <CardDescription>
              {isComplete ? "Your new password is ready to use" : "Choose a strong password for your investor account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isComplete ? (
              <div className="space-y-6 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                <Button variant="premium" className="w-full" onClick={() => router.push("/auth/login")}>
                  Continue to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">At least 8 characters with uppercase, lowercase, number, and symbol.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" variant="premium" className="w-full" isLoading={isLoading}>
                  Update Password
                </Button>
                <Link href="/auth/login" className="flex items-center justify-center text-sm text-emerald-600 hover:underline">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
