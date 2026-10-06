"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle, Home, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const [reference, setReference] = useState<string | null>(null);
  useEffect(() => {
    setReference(new URLSearchParams(window.location.search).get("reference"));
  }, []);
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </motion.div>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">Investment Successful!</h1>
            <p className="text-slate-600 mb-8">
              Congratulations! Your investment has been completed successfully.
            </p>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Transaction Reference</p>
                <p className="font-mono font-semibold text-slate-900">{reference || "Verified payment"}</p>
              </div>
              <p className="text-sm text-slate-600">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/portfolio" className="block">
                <Button variant="premium" className="w-full">
                  View Portfolio <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
              </Link>
              <Button variant="ghost" className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
