"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  initiatePayment,
  sendPaymentWebhook,
  type PackageCode,
} from "@/services/payments";
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

type Step = "SELECT_PACKAGE" | "BANK_INPUT" | "SUCCESS";

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function PaymentPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageCode | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("SELECT_PACKAGE");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get("userId"));
  }, []);

  useEffect(() => {
    const token =
      window.localStorage.getItem("accessToken") ??
      window.localStorage.getItem("token") ??
      window.sessionStorage.getItem("accessToken") ??
      window.sessionStorage.getItem("token");
    setAuthToken(token);
  }, []);

  const missingQueryError = useMemo(() => {
    if (!userId) return "Thieu query param userId.";
    return "";
  }, [userId]);

  const handleConfirmPayment = async () => {
    if (!userId) return setErrorText("Khong tim thay userId.");
    if (!selectedPackage) return setErrorText("Vui long chon goi dich vu.");
    if (!authToken) return setErrorText("Ban chua dang nhap hoac token da het han.");
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      return setErrorText("Vui long nhap day du thong tin ngan hang.");
    }

    setLoading(true);
    setErrorText("");

    try {
      const initResult = await initiatePayment(
        {
          userId,
          packageType: selectedPackage,
        },
        authToken,
      );

      const resolvedTx = initResult.transactionId ?? `GLU-${Date.now()}`;
      setTransactionId(resolvedTx);
      window.sessionStorage.setItem("payment_transaction_id", resolvedTx);

      const amount = PACKAGE_INFO[selectedPackage].amount;
      const webhookResult = await sendPaymentWebhook({
        id: generateUuid(),
        gateway: bankName.trim(),
        transactionDate: formatDateTime(new Date()),
        accountNumber: accountNumber.trim(),
        content: `GLUCARE ${userId} ${selectedPackage}`,
        transferType: "in",
        transferAmount: amount,
        accumulated: 19000000 + amount,
        referenceCode: resolvedTx,
      });

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
          <p className="mt-1 text-sm text-muted-foreground">Manual Bank Entry + Mock SePay Webhook</p>
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
          {step === "SELECT_PACKAGE" ? (
            <motion.section
              key="select-package"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid gap-4 md:grid-cols-3"
            >
              {(["M", "Y", "L"] as PackageCode[]).map((code) => (
                <Card
                  key={code}
                  className="rounded-2xl border-white/60 bg-white/85 shadow-xl shadow-indigo-200/20 backdrop-blur-md"
                >
                  <CardHeader>
                    <CardTitle>{PACKAGE_INFO[code].label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-2xl font-semibold text-indigo-700">
                      {PACKAGE_INFO[code].amount.toLocaleString("vi-VN")} VND
                    </p>
                    <p className="text-sm text-muted-foreground">Thoi han: {PACKAGE_INFO[code].duration}</p>
                    <Button
                      className="w-full bg-gradient-to-r from-sky-600 to-indigo-600"
                      onClick={() => {
                        setSelectedPackage(code);
                        setErrorText("");
                        setStep("BANK_INPUT");
                      }}
                    >
                      Chon goi {code}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </motion.section>
          ) : null}

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
                  <CardTitle className="flex items-center justify-between">
                    <span>Nhap thong tin ngan hang</span>
                    <Button variant="outline" onClick={() => setStep("SELECT_PACKAGE")}>
                      Doi goi
                    </Button>
                  </CardTitle>
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
                    disabled={loading}
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
