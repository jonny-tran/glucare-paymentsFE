"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sendPaymentWebhook, type PackageCode } from "@/services/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const PACKAGE_INFO: Record<PackageCode, { label: string; amount: number; duration: string }> = {
  M: { label: "Goi Thang", amount: 50000, duration: "30 ngay" },
  Y: { label: "Goi Nam", amount: 450000, duration: "365 ngay" },
  L: { label: "Goi Tron doi", amount: 1000000, duration: "Vinh vien" },
};

type Step = "BANK_INPUT" | "SUCCESS";

function parsePackageCode(value: string | null): PackageCode | null {
  if (value === "M" || value === "Y" || value === "L") return value;
  return null;
}

export default function PaymentPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageCode | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("BANK_INPUT");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const webhookApiKey = process.env.NEXT_PUBLIC_SEPAY_WEBHOOK_API_KEY ?? "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get("userId"));
    setSelectedPackage(parsePackageCode(params.get("package")));
    setTransactionId(params.get("transactionId"));
  }, []);

  const missingQueryError = useMemo(() => {
    if (!userId || !selectedPackage || !transactionId) {
      return "Thong tin thanh toan khong hop le.";
    }
    return "";
  }, [selectedPackage, transactionId, userId]);

  const handleConfirmPayment = async () => {
    if (!userId) return setErrorText("Khong tim thay userId.");
    if (!selectedPackage || !transactionId) return setErrorText("Thong tin thanh toan khong hop le.");
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      return setErrorText("Vui long nhap day du thong tin ngan hang.");
    }
    if (!webhookApiKey) {
      return setErrorText("Missing NEXT_PUBLIC_SEPAY_WEBHOOK_API_KEY de gui x-api-key.");
    }

    setLoading(true);
    setErrorText("");

    try {
      const amount = PACKAGE_INFO[selectedPackage].amount;
      const webhookResult = await sendPaymentWebhook({
        id: transactionId,
        gateway: "Vietcombank",
        transactionDate: "2026-04-06 10:00:00",
        accountNumber: "0123456789",
        content: `GLUCARE ${userId} ${selectedPackage}`,
        transferType: "in",
        transferAmount: amount,
        accumulated: 0,
        referenceCode: `MOCK_REF_${Date.now()}`,
      }, { apiKey: webhookApiKey });

      if (webhookResult.status < 200 || webhookResult.status >= 300) {
        throw new Error(`Webhook failed (HTTP ${webhookResult.status})`);
      }

      setStep("SUCCESS");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Thanh toan that bai.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToApp = () => {
    console.log("Navigating back to app...");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-100 px-4 py-6 sm:py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative rounded-2xl border border-white/60 bg-white/80 px-4 py-4 shadow-xl shadow-sky-200/30 backdrop-blur-md"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Thanh toan goi GlucoDia
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Payment terminal: chi goi /v1/payments/webhook</p>
        </motion.header>

        {missingQueryError ? (
          <Card>
            <CardHeader>
              <CardTitle>Loi du lieu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {missingQueryError}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <AnimatePresence mode="wait">
          {step === "BANK_INPUT" ? (
            <motion.div
              key="bank-input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mx-auto w-full max-w-2xl rounded-2xl border-white/60 bg-white/90 shadow-xl shadow-sky-200/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Nhap thong tin ngan hang</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-3 py-2 text-sm">
                    <p className="font-medium">Goi da chon: {selectedPackage}</p>
                    <p className="text-muted-foreground">
                      So tien:{" "}
                      {selectedPackage ? PACKAGE_INFO[selectedPackage].amount.toLocaleString("vi-VN") : 0} VND
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bank-name">Ten ngan hang</Label>
                    <Input
                      id="bank-name"
                      value={bankName}
                      placeholder="VD: Vietcombank"
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-number">So tai khoan</Label>
                    <Input
                      id="acc-number"
                      value={accountNumber}
                      placeholder="VD: 0123456789"
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-holder">Ten chu tai khoan</Label>
                    <Input
                      id="acc-holder"
                      value={accountHolder}
                      placeholder="VD: Nguyen Van A"
                      onChange={(e) => setAccountHolder(e.target.value)}
                    />
                  </div>
                  {errorText ? (
                    <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {errorText}
                    </p>
                  ) : null}
                  <Button
                    className="w-full bg-gradient-to-r from-sky-600 to-indigo-600"
                    size="lg"
                    disabled={loading || Boolean(missingQueryError)}
                    onClick={handleConfirmPayment}
                  >
                    {loading ? (
                      <>
                        <Spinner className="mr-2" />
                        Dang xu ly...
                      </>
                    ) : (
                      "Xac nhan thanh toan"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {step === "SUCCESS" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Card className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border-emerald-100 bg-white/90 shadow-xl shadow-emerald-200/25 backdrop-blur-md">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-cyan-50">
                  <CardTitle className="text-emerald-800">Thanh toan thanh cong</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="rounded-lg bg-muted px-3 py-3 text-sm">
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm">{transactionId ?? "-"}</p>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
                    size="lg"
                    onClick={handleReturnToApp}
                  >
                    Quay tro lai App
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
