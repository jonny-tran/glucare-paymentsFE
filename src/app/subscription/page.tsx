"use client";

import { useState } from "react";
import { ApiError, initiatePayment, type PackageType } from "@/services/payments";

type TestUser = {
  id: string;
  fullName: string;
  phoneNumber: string;
};

const TEST_USERS: TestUser[] = [
  {
    id: "4d3c9bea-6683-467c-ae28-85061d86ef64",
    fullName: "Tran Thi B",
    phoneNumber: "0984444444",
  },
  {
    id: "50b4860e-7b1e-4006-9448-f823a623ad6c",
    fullName: "Le Van C",
    phoneNumber: "0985555555",
  },
  {
    id: "945add22-6c73-4902-ae52-d1b1b884c067",
    fullName: "Nguyen Van A",
    phoneNumber: "0983333333",
  },
];

const PACKAGE_OPTIONS: Array<{ value: PackageType; label: string; price: number }> = [
  { value: "M", label: "1 thang (M)", price: 50000 },
  { value: "Y", label: "1 nam (Y)", price: 500000 },
  { value: "L", label: "Tron doi (L)", price: 2000000 },
];

export default function SubscriptionPage() {
  const [selectedUserId, setSelectedUserId] = useState(TEST_USERS[0].id);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("M");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const selectedPackageInfo =
    PACKAGE_OPTIONS.find((item) => item.value === selectedPackage) ?? PACKAGE_OPTIONS[0];

  const handlePay = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await initiatePayment({
        userId: selectedUserId,
        packageType: selectedPackage,
      });

      if (!response.paymentUrl) {
        throw new Error("Backend khong tra ve paymentUrl");
      }

      window.location.href = response.paymentUrl;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`HTTP ${err.status} - ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong the khoi tao thanh toan");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <section className="mx-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Chon goi dich vu</h1>
        <p className="mt-1 text-sm text-gray-600">
          Buoc 1: chon user va goi. Buoc 2: bam thanh toan de redirect sang paymentUrl.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">User test</span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
            >
              {TEST_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} - {user.phoneNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Goi dich vu</span>
            <select
              value={selectedPackage}
              onChange={(event) => setSelectedPackage(event.target.value as PackageType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
            >
              {PACKAGE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} - {item.price.toLocaleString("vi-VN")} VND
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p>
            Goi da chon:{" "}
            <span className="font-semibold text-gray-900">{selectedPackageInfo.label}</span>
          </p>
          <p>
            So tien:{" "}
            <span className="font-semibold text-gray-900">
              {selectedPackageInfo.price.toLocaleString("vi-VN")} VND
            </span>
          </p>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Dang khoi tao..." : "Thanh toan"}
        </button>
      </section>
    </main>
  );
}
