"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, CreditCard, Wallet, Calendar, DollarSign, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/stores/appStore";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { authStorage, investmentsAPI, paymentsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    PaystackPop?: { setup: (options: { key: string; email: string; amount: number; currency: string; ref: string; callback: (response: { reference: string }) => void; onClose: () => void }) => { openIframe: () => void } };
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { properties } = useAppStore();
  const property = properties.find((p) => p.id === params.id) || properties[0];
  const fractions = Number(searchParams.get("fractions")) || 1;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [paymentSchedule, setPaymentSchedule] = useState("full");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paystackReady, setPaystackReady] = useState(false);

  useEffect(() => {
    if (window.PaystackPop) { setPaystackReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => setPaystackReady(true);
    script.onerror = () => setPaystackReady(false);
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  const totalAmount = fractions * property.costPerFraction;
  const discount = paymentSchedule === "full" ? totalAmount * 0.02 : 0; // 2% discount for full payment
  const finalAmount = totalAmount - discount;

  const scheduleOptions = [
    {
      value: "full",
      label: "Full Payment",
      description: "Pay the entire amount upfront",
      installments: 1,
      discount: "2% discount",
    },
    {
      value: "3-months",
      label: "3 Months Plan",
      description: "Split into 3 monthly payments",
      installments: 3,
      discount: null,
    },
    {
      value: "6-months",
      label: "6 Months Plan",
      description: "Split into 6 monthly payments",
      installments: 6,
      discount: null,
    },
    {
      value: "12-months",
      label: "12 Months Plan",
      description: "Split into 12 monthly payments",
      installments: 12,
      discount: null,
    },
  ];

  const handleCompletePurchase = async () => {
    if (!property?.id) { toast.error("Payment unavailable", "The selected asset could not be found."); return; }
    if (paymentMethod !== "card") { toast.info("Paystack checkout", "Please select Debit/Credit Card to continue with Paystack."); return; }
    const email = useAppStore.getState().user?.email || authStorage.getUser()?.email;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!email || !publicKey) { toast.error("Payment unavailable", "Your investor session or Paystack configuration is missing."); return; }
    if (!paystackReady || !window.PaystackPop) { toast.error("Payment unavailable", "Paystack is still loading. Please try again."); return; }
    setIsProcessing(true);
    try {
      const initialized = await paymentsAPI.initialize({
        provider: "paystack",
        email,
        amount: finalAmount,
        currency: "NGN",
        title: property.name,
        metadata: { assetId: property.id, fractions, paymentSchedule },
      });
      if (!initialized.success || !initialized.data?.reference) throw new Error(initialized.error || "Could not initialize Paystack payment.");
      const reference = initialized.data.reference;
      window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: Math.round(finalAmount * 100),
        currency: "NGN",
        ref: reference,
        callback: async (response) => {
          try {
            const verified = await paymentsAPI.verify("paystack", response.reference);
            if (!verified.success || String(verified.data?.status).toLowerCase() !== "success") throw new Error("Paystack could not verify this payment.");
            sessionStorage.setItem("urbco_pending_payment", JSON.stringify({ reference: response.reference, provider: "paystack", amount: finalAmount, assetId: property.id }));
            const investment = await investmentsAPI.create({ amount: finalAmount, assetId: property.id, provider: "paystack", reference: response.reference, note: `${fractions} fraction(s) · ${paymentSchedule}` });
            if (!investment.success) throw new Error(investment.error || "Payment was received but the investment could not be recorded.");
            sessionStorage.removeItem("urbco_pending_payment");
            router.push(`/checkout/success?reference=${encodeURIComponent(response.reference)}`);
          } catch (error) {
            toast.error("Investment could not be completed", `${error instanceof Error ? error.message : "Please contact support"} Your payment reference is saved for recovery.`);
            setIsProcessing(false);
          }
        },
        onClose: () => setIsProcessing(false),
      }).openIframe();
    } catch (error) {
      setIsProcessing(false);
      toast.error("Payment could not start", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const steps = [
    { number: 1, title: "Payment Method" },
    { number: 2, title: "Payment Schedule" },
    { number: 3, title: "Review & Confirm" },
    { number: 4, title: "Processing" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="mb-4 flex items-center">
            {steps.map((step, index) => (
              <div key={step.number} className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}>
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all sm:h-10 sm:w-10 ${
                  currentStep >= step.number
                    ? "bg-brand-600 text-white"
                    : "bg-surface-muted text-slate-500"
                }`}>
                  {currentStep > step.number ? <CheckCircle className="h-5 w-5" /> : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-2 h-1 min-w-0 flex-1 rounded sm:mx-3 ${
                    currentStep > step.number ? "bg-brand-600" : "bg-slate-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {steps.map((step) => (
              <span
                key={step.number}
                className={`hidden md:block ${currentStep >= step.number ? "text-brand-700 font-medium" : "text-slate-500"}`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && "Select Payment Method"}
                  {currentStep === 2 && "Choose Payment Schedule"}
                  {currentStep === 3 && "Review Your Investment"}
                  {currentStep === 4 && "Processing Payment"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {/* Step 1: Payment Method */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <div className="grid gap-4">
                          <label className="relative cursor-pointer">
                            <RadioGroupItem value="wallet" className="peer sr-only" />
                            <div className="flex items-center justify-between p-4 border-2 rounded-xl transition-all peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50">
                              <div className="flex items-center space-x-4">
                                <Wallet className="h-8 w-8 text-emerald-600" />
                                <div>
                                  <div className="font-semibold text-slate-900">Wallet Balance</div>
                                  <div className="text-sm text-slate-500">Pay from your Urbco wallet</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-slate-500">Available</div>
                                <div className="font-semibold text-emerald-600">₦3,542,813</div>
                              </div>
                            </div>
                          </label>

                          <label className="relative cursor-pointer">
                            <RadioGroupItem value="card" className="peer sr-only" />
                            <div className="flex items-center justify-between p-4 border-2 rounded-xl transition-all peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50">
                              <div className="flex items-center space-x-4">
                                <CreditCard className="h-8 w-8 text-blue-600" />
                                <div>
                                  <div className="font-semibold text-slate-900">Debit/Credit Card</div>
                                  <div className="text-sm text-slate-500">Pay with your bank card</div>
                                </div>
                              </div>
                            </div>
                          </label>

                          <label className="relative cursor-pointer">
                            <RadioGroupItem value="transfer" className="peer sr-only" />
                            <div className="flex items-center justify-between p-4 border-2 rounded-xl transition-all peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50">
                              <div className="flex items-center space-x-4">
                                <DollarSign className="h-8 w-8 text-purple-600" />
                                <div>
                                  <div className="font-semibold text-slate-900">Bank Transfer</div>
                                  <div className="text-sm text-slate-500">Direct bank transfer</div>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </RadioGroup>

                      <Button
                        variant="premium"
                        className="w-full mt-6"
                        onClick={() => setCurrentStep(2)}
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}

                  {/* Step 2: Payment Schedule */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <RadioGroup value={paymentSchedule} onValueChange={setPaymentSchedule}>
                        <div className="grid gap-4">
                          {scheduleOptions.map((option) => (
                            <label key={option.value} className="relative cursor-pointer">
                              <RadioGroupItem value={option.value} className="peer sr-only" />
                              <div className="flex items-center justify-between p-4 border-2 rounded-xl transition-all peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50">
                                <div className="flex items-center space-x-4">
                                  <Calendar className="h-8 w-8 text-emerald-600" />
                                  <div>
                                    <div className="font-semibold text-slate-900">{option.label}</div>
                                    <div className="text-sm text-slate-500">{option.description}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-slate-500">Per payment</div>
                                  <div className="font-semibold text-slate-900">
                                    {formatCurrency(finalAmount / option.installments)}
                                  </div>
                                  {option.discount && (
                                    <Badge variant="success" className="mt-1">{option.discount}</Badge>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </RadioGroup>

                      <div className="flex space-x-4 mt-6">
                        <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button variant="premium" onClick={() => setCurrentStep(3)} className="flex-1">
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Investment Summary */}
                      <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Property</span>
                          <span className="font-semibold text-slate-900">{property.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Fractions</span>
                          <span className="font-semibold text-slate-900">{fractions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Price per fraction</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(property.costPerFraction)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Full Payment Discount (2%)</span>
                            <span>-{formatCurrency(discount)}</span>
                          </div>
                        )}
                        <div className="pt-3 border-t border-slate-200 flex justify-between text-lg">
                          <span className="font-semibold">Total</span>
                          <span className="font-bold text-emerald-600">{formatCurrency(finalAmount)}</span>
                        </div>
                      </div>

                      {/* Payment Schedule Summary */}
                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <div className="flex items-center space-x-2 mb-3">
                          <Calendar className="h-5 w-5 text-emerald-600" />
                          <span className="font-semibold text-emerald-900">Payment Schedule</span>
                        </div>
                        <div className="space-y-2">
                          {scheduleOptions
                            .find((o) => o.value === paymentSchedule)
                            ?.installments &&
                            Array.from({ length: scheduleOptions.find((o) => o.value === paymentSchedule)!.installments }).map((_, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-emerald-700">Payment {i + 1}</span>
                                <span className="font-medium text-emerald-900">
                                  {formatCurrency(finalAmount / scheduleOptions.find((o) => o.value === paymentSchedule)!.installments)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Security Notice */}
                      <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl">
                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">Secure Investment</p>
                          <p>Your investment is protected with institutional-grade security and legal documentation.</p>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                          variant="premium"
                          onClick={handleCompletePurchase}
                          isLoading={isProcessing}
                          className="flex-1"
                        >
                          {isProcessing ? "Processing..." : "Complete Investment"}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Processing */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Processing Your Investment</h3>
                      <p className="text-slate-500">Please wait while we complete your transaction...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={property.images[0]}
                  alt={property.name}
                  className="w-full h-40 object-cover rounded-xl"
                />
                <div>
                  <h4 className="font-semibold text-slate-900">{property.name}</h4>
                  <p className="text-sm text-slate-500">{property.location}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Fractions</span>
                    <span className="font-medium">{fractions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Price per fraction</span>
                    <span className="font-medium">{formatCurrency(property.costPerFraction)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Payment Method</span>
                    <span className="font-medium capitalize">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Schedule</span>
                    <span className="font-medium">
                      {scheduleOptions.find((o) => o.value === paymentSchedule)?.label}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
