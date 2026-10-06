"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await authAPI.forgotPassword(email);
    setIsLoading(false);
    if (!response.success) {
      toast.error("Could not send reset email", response.error || "Please try again shortly.");
      return;
    }
    setIsSubmitted(true);
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
            <CardTitle className="font-display text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              {isSubmitted
                ? "Check your email for reset instructions"
                : "Enter your email to receive reset instructions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-slate-600">
                    We&apos;ve sent password reset instructions to{" "}
                    <span className="font-medium text-slate-900">{email}</span>
                  </p>
                </div>
                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <Button type="submit" variant="premium" className="w-full" isLoading={isLoading}>
                  Send Reset Link
                </Button>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-emerald-600 hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
