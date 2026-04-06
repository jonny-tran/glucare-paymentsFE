"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cancelPayment, sendPaymentWebhook, type PackageType } from "@/services/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderSummaryCard } from "@/components/payment/order-summary-card";
import { PaymentMethodSelector } from "@/components/payment/payment-method-selector";
import { QrPaymentPanel } from "@/components/payment/qr-payment-panel";
import { CardPaymentForm } from "@/components/payment/card-payment-form";
import { PaymentResultCard } from "@/components/payment/payment-result-card";

const PACKAGE_AMOUNT: Record<PackageType, number> = {
  M: 50000,
  Y: 500000,
  L: 2000000,
};

type PaymentMethod = "vietqr" | "vietqrpay" | "card";
type Step = "method" | "qr" | "card" | "success" | "failed";

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
  if (value === "M" || value === "Y" || value === "L") return value;
  return null;
}

export default function PaymentPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [packageType, setPackageType] = useState<PackageType | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("method");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [errorText, setErrorText] = useState("");
  const [failureReason, setFailureReason] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

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
    if (!userId || !packageType) return "Thieu query params: userId va package (M | Y | L).";
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

  const resetToMethod = () => {
    setStep("method");
    setSelectedMethod(null);
    setQrUrl("");
    setFailureReason("");
    setErrorText("");
  };

  const fetchQr = async (pkg: PackageType) => {
    const res = await fetch(`/api/payments/qr?package=${pkg}`);
    const data = (await res.json()) as { success?: boolean; url?: string; message?: string };
    if (!res.ok || !data.url) throw new Error(data.message ?? "Khong the tai QR.");
    setQrUrl(data.url);
  };

  const handleSelectQr = async (method: "vietqr" | "vietqrpay") => {
    if (!packageType) return;
    try {
      setSelectedMethod(method);
      setStep("qr");
      setErrorText("");
      await fetchQr(packageType);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Khong the tai QR.");
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionId) return setErrorText(missingTransactionError);
    if (!packageType || !resolvedPhone) return setErrorText("Khong du thong tin thanh toan.");
    if (expired) return setErrorText("Don da het han.");

    setLoading(true);
    setErrorText("");
    setFailureReason("");

    try {
      const referenceCode = `MBVCB.${Date.now()}`;
      const result = await sendPaymentWebhook({
        id: generateUuid(),
        gateway: "Vietcombank",
        transactionDate: formatDateTime(new Date()),
        accountNumber: "0123456789",
        content: `GLUCARE ${resolvedPhone} ${packageType}`,
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
    console.log("Return to mobile app clicked");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
        <header className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Thanh toan goi GlucoDia
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Giao dich se tu dong het han sau 5 phut neu chua thanh toan.
          </p>
          <p className="mt-2 text-sm font-medium text-amber-600">Thoi gian con lai: {countdownLabel}</p>
        </header>

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

        {step === "method" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <OrderSummaryCard
              transactionId={transactionId}
              packageType={packageType}
              amount={amount}
              countdownLabel={countdownLabel}
              expired={expired}
            />
            <PaymentMethodSelector
              disabled={Boolean(missingQueryError) || expired}
              errorText={errorText}
              onSelectVietQr={() => void handleSelectQr("vietqr")}
              onSelectVietQrPay={() => void handleSelectQr("vietqrpay")}
              onSelectCard={() => {
                setSelectedMethod("card");
                setStep("card");
                setErrorText("");
              }}
            />
          </section>
        ) : null}

        {step === "qr" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <OrderSummaryCard
              transactionId={transactionId}
              packageType={packageType}
              amount={amount}
              countdownLabel={countdownLabel}
              expired={expired}
            />
            <QrPaymentPanel
              qrUrl={qrUrl}
              loading={loading}
              canceling={canceling}
              expired={expired}
              errorText={errorText}
              methodLabel={
                selectedMethod === "vietqrpay"
                  ? "Su dung app ngan hang/vi ho tro VietQR Pay de quet ma."
                  : "Su dung app ngan hang/vi ho tro VietQR de quet ma."
              }
              onBack={resetToMethod}
              onConfirm={handleConfirmPayment}
              disableCancel={!transactionId}
              onCancel={handleCancelTransaction}
            />
          </section>
        ) : null}

        {step === "card" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <OrderSummaryCard
              transactionId={transactionId}
              packageType={packageType}
              amount={amount}
              countdownLabel={countdownLabel}
              expired={expired}
            />
            <CardPaymentForm
              packageType={packageType}
              amount={amount}
              loading={loading}
              canceling={canceling}
              expired={expired}
              errorText={errorText}
              cardName={cardName}
              cardNumber={cardNumber}
              cardExpiry={cardExpiry}
              cardCvv={cardCvv}
              onCardNameChange={setCardName}
              onCardNumberChange={setCardNumber}
              onCardExpiryChange={setCardExpiry}
              onCardCvvChange={setCardCvv}
              onConfirm={handleConfirmPayment}
              disableCancel={!transactionId}
              onCancel={handleCancelTransaction}
              onBack={resetToMethod}
            />
          </section>
        ) : null}

        {step === "failed" ? (
          <PaymentResultCard
            type="failed"
            reason={failureReason}
            canceling={canceling}
            disableCancel={!transactionId}
            onRetry={() => setStep(selectedMethod === "card" ? "card" : "qr")}
            onCancel={handleCancelTransaction}
          />
        ) : null}

        {step === "success" ? (
          <PaymentResultCard
            type="success"
            transactionId={transactionId}
            referenceCode={lastReferenceCode}
            amount={amount}
            onReturnToApp={handleReturnToApp}
            onBackToPayment={resetToMethod}
          />
        ) : null}
      </div>
    </main>
  );
}
