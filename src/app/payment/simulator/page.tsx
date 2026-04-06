"use client";

import { useEffect, useMemo, useState } from "react";
import {
  sendPaymentWebhook,
  type PackageType,
  type PaymentWebhookPayload,
} from "@/services/payments";

const PACKAGE_AMOUNT: Record<PackageType, number> = {
  M: 50000,
  Y: 500000,
  L: 2000000,
};

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
  if (value === "M" || value === "Y" || value === "L") {
    return value;
  }
  return null;
}

export default function PaymentSimulatorPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [packageType, setPackageType] = useState<PackageType | null>(null);

  const [loading, setLoading] = useState(false);
  const [useInvalidApiKey, setUseInvalidApiKey] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [toastText, setToastText] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get("userId"));
    setPackageType(parsePackage(params.get("package")));
  }, []);

  const missingQueryError = useMemo(() => {
    if (!userId || !packageType) {
      return "Thieu query params. Can userId va package (M | Y | L).";
    }
    return "";
  }, [packageType, userId]);

  const payloadPreview: PaymentWebhookPayload | null = useMemo(() => {
    if (!userId || !packageType) {
      return null;
    }
    const amount = PACKAGE_AMOUNT[packageType];
    return {
      id: "11111111-1111-4111-8111-111111111111",
      gateway: "Vietcombank",
      transactionDate: "2026-04-06 10:00:00",
      accountNumber: "0123456789",
      content: `GLUCARE ${userId} ${packageType}`,
      transferType: "in",
      transferAmount: amount,
      accumulated: 19000000 + amount,
      referenceCode: "MBVCB.PREVIEW.000001",
    };
  }, [packageType, userId]);

  const handleConfirmTransfer = async () => {
    if (!userId || !packageType) {
      setErrorText("Thieu userId/package, khong the goi webhook.");
      return;
    }

    setLoading(true);
    setStatusCode(null);
    setResponseText("");
    setErrorText("");
    setToastText("");

    try {
      const amount = PACKAGE_AMOUNT[packageType];
      const runtimePayload: PaymentWebhookPayload = {
        id: generateUuid(),
        gateway: "Vietcombank",
        transactionDate: formatDateTime(new Date()),
        accountNumber: "0123456789",
        content: `GLUCARE ${userId} ${packageType}`,
        transferType: "in",
        transferAmount: amount,
        accumulated: 19000000 + amount,
        referenceCode: `MBVCB.${Date.now()}`,
      };

      const result = await sendPaymentWebhook(runtimePayload, {
        useInvalidApiKey,
      });

      setStatusCode(result.status);
      setResponseText(JSON.stringify(result.data, null, 2));

      if (result.status >= 200 && result.status < 300) {
        setToastText("Webhook thanh cong (200). Ban co the tiep tuc test ngay tren trang nay.");
      } else {
        setErrorText(`HTTP ${result.status} - Webhook call failed`);
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Webhook failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <section className="mx-auto w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payment Simulator</h1>
        <p className="mt-1 text-sm text-gray-600">
          Mo phong SePay webhook voi content format: GLUCARE {"<userId>"} {"<M|Y|L>"}.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">User ID</p>
            <p className="break-all text-sm font-semibold text-gray-900">
              {userId ?? "(missing)"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Package</p>
            <p className="text-sm font-semibold text-gray-900">{packageType ?? "(missing)"}</p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={useInvalidApiKey}
            onChange={(event) => setUseInvalidApiKey(event.target.checked)}
          />
          Test sai x-api-key (ky vong 401)
        </label>

        {missingQueryError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {missingQueryError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleConfirmTransfer}
          disabled={loading || Boolean(missingQueryError)}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Dang gui webhook..." : "Xac nhan da chuyen khoan"}
        </button>

        {toastText ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {toastText}
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorText}
          </div>
        ) : null}

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p>
            HTTP status: <span className="font-semibold text-gray-900">{statusCode ?? "--"}</span>
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Payload preview</h2>
            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800">
              {payloadPreview
                ? JSON.stringify(payloadPreview, null, 2)
                : "(Cannot build payload because query is invalid)"}
            </pre>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Response</h2>
            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800">
              {responseText || "(No response yet)"}
            </pre>
          </article>
        </div>
      </section>
    </main>
  );
}
