"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  cancelPayment,
  sendPaymentWebhook,
  submitPayment,
  type PackageType,
} from "@/services/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderSummaryCard } from "@/components/payment/order-summary-card";
import { BankTransferForm } from "@/components/payment/bank-transfer-form";
import { PaymentResultCard } from "@/components/payment/payment-result-card";

const PACKAGE_AMOUNT: Record<PackageType, number> = {
  MONTHLY: 50000,
  YEARLY: 450000,
  LIFETIME: 1000000,
};

type Step = "form" | "success" | "failed";

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
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

function parsePackage(value: string | null): PackageType | null {
  if (value === "M" || value === "MONTHLY") return "MONTHLY";
  if (value === "Y" || value === "YEARLY") return "YEARLY";
  if (value === "L" || value === "LIFETIME") return "LIFETIME";
  return null;
}

export default function PaymentPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [packageType, setPackageType] = useState<PackageType | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("form");
  const [errorText, setErrorText] = useState("");
  const [failureReason, setFailureReason] = useState("");

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [lastReferenceCode, setLastReferenceCode] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const [expired, setExpired] = useState(false);
  const timeoutCanceledRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get("userId"));
    setPackageType(parsePackage(params.get("package")));
    setPhoneNumber(params.get("phone"));
    const queryTx = params.get("transactionId");
    const sessionTx = window.sessionStorage.getItem("payment_transaction_id");
    const resolvedTx = queryTx ?? sessionTx;
    setTransactionId(resolvedTx);
    if (resolvedTx) {
      window.sessionStorage.setItem("payment_transaction_id", resolvedTx);
    }
  }, []);

  useEffect(() => {
    const token =
      window.localStorage.getItem("accessToken") ??
      window.localStorage.getItem("token") ??
      window.sessionStorage.getItem("accessToken") ??
      window.sessionStorage.getItem("token");
    setAuthToken(token);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setExpired(true);
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (!expired || timeoutCanceledRef.current || !authToken || !transactionId) return;
    timeoutCanceledRef.current = true;
    cancelPayment(authToken, transactionId).catch(() => null);
  }, [authToken, expired, transactionId]);

  const missingTransactionError =
    "Thiếu mã giao dịch, vui lòng khởi tạo lại thanh toán";

  const missingQueryError = useMemo(() => {
    if (!userId || !packageType) {
      return "Thieu query params: userId va package (MONTHLY | YEARLY | LIFETIME).";
    }
    return "";
  }, [packageType, userId]);

  const resolvedPhone = useMemo(() => {
    if (phoneNumber) return phoneNumber;
    const byUserId: Record<string, string> = {
      "4d3c9bea-6683-467c-ae28-85061d86ef64": "0984444444",
      "50b4860e-7b1e-4006-9448-f823a623ad6c": "0985555555",
      "945add22-6c73-4902-ae52-d1b1b884c067": "0983333333",
    };
    return userId ? byUserId[userId] ?? null : null;
  }, [phoneNumber, userId]);

  const amount = packageType ? PACKAGE_AMOUNT[packageType] : 0;
  const countdownLabel = `${`${Math.floor(secondsLeft / 60)}`.padStart(2, "0")}:${`${secondsLeft % 60}`.padStart(2, "0")}`;

  const resetToForm = () => {
    setStep("form");
    setFailureReason("");
    setErrorText("");
  };

  const handleConfirmPayment = async () => {
    if (!transactionId) return setErrorText(missingTransactionError);
    if (!packageType || !resolvedPhone) return setErrorText("Khong du thong tin thanh toan.");
    if (expired) return setErrorText("Don da het han.");
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      return setErrorText("Vui long nhap day du thong tin ngan hang.");
    }

    setLoading(true);
    setErrorText("");
    setFailureReason("");

    try {
      if (authToken && userId) {
        await submitPayment(
          {
            userId,
            packageType,
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            accountHolder: accountHolder.trim(),
          },
          authToken,
        );
      }

      const referenceCode = `MBVCB.${Date.now()}`;
      const result = await sendPaymentWebhook({
        id: generateUuid(),
        gateway: bankName.trim(),
        transactionDate: formatDateTime(new Date()),
        accountNumber: accountNumber.trim(),
        content: `GLUCARE ${resolvedPhone} ${packageType} ${accountHolder.trim()}`,
        transferType: "in",
        transferAmount: amount,
        accumulated: 19000000 + amount,
        referenceCode,
      });

      if (result.status >= 200 && result.status < 300) {
        setLastReferenceCode(referenceCode);
        setStep("success");
      } else {
        setFailureReason(`Thanh toan that bai (HTTP ${result.status}).`);
        setStep("failed");
      }
    } catch (error) {
      setFailureReason(error instanceof Error ? error.message : "Thanh toan that bai.");
      setStep("failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!authToken) return setErrorText("Khong tim thay token dang nhap.");
    if (!transactionId) return setErrorText(missingTransactionError);

    setCanceling(true);
    setErrorText("");
    try {
      await cancelPayment(authToken, transactionId);
      window.location.href = "/";
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Huy giao dich that bai.");
    } finally {
      setCanceling(false);
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
          <p className="mt-1 text-sm text-muted-foreground">
            Giao dich se tu dong het han sau 5 phut neu chua thanh toan.
          </p>
          <p className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
            Thoi gian con lai: {countdownLabel}
          </p>
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
        {!missingQueryError && !transactionId ? (
          <Card>
            <CardContent className="pt-4">
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {missingTransactionError}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.section
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
            >
              <OrderSummaryCard
                transactionId={transactionId}
                packageType={packageType}
                amount={amount}
                countdownLabel={countdownLabel}
                expired={expired}
              />
              <BankTransferForm
                packageType={packageType}
                amount={amount}
                loading={loading}
                canceling={canceling}
                expired={expired}
                errorText={errorText}
                bankName={bankName}
                accountNumber={accountNumber}
                accountHolder={accountHolder}
                onBankNameChange={setBankName}
                onAccountNumberChange={setAccountNumber}
                onAccountHolderChange={setAccountHolder}
                onConfirm={handleConfirmPayment}
                disableCancel={!transactionId}
                onCancel={handleCancelTransaction}
              />
            </motion.section>
          ) : null}

          {step === "failed" ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PaymentResultCard
                type="failed"
                reason={failureReason}
                canceling={canceling}
                disableCancel={!transactionId}
                onRetry={resetToForm}
                onCancel={handleCancelTransaction}
              />
            </motion.div>
          ) : null}

          {step === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <PaymentResultCard
                type="success"
                transactionId={transactionId}
                referenceCode={lastReferenceCode}
                amount={amount}
                onReturnToApp={handleReturnToApp}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
