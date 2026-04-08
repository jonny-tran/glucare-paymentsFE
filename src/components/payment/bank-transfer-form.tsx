"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { PackageType } from "@/services/payments";
import { motion } from "framer-motion";

type Props = {
  packageType: PackageType | null;
  amount: number;
  loading: boolean;
  canceling: boolean;
  expired: boolean;
  errorText?: string;
  disableCancel?: boolean;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  onBankNameChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onAccountHolderChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function packageLabel(packageType: PackageType | null): string {
  if (packageType === "MONTHLY") return "Goi Thang";
  if (packageType === "YEARLY") return "Goi Nam";
  if (packageType === "LIFETIME") return "Goi Tron doi";
  return "Chua xac dinh";
}

export function BankTransferForm(props: Props) {
  const {
    packageType,
    amount,
    loading,
    canceling,
    expired,
    errorText,
    disableCancel,
    bankName,
    accountNumber,
    accountHolder,
    onBankNameChange,
    onAccountNumberChange,
    onAccountHolderChange,
    onConfirm,
    onCancel,
  } = props;

  return (
    <Card className="relative overflow-hidden rounded-2xl border-white/60 bg-white/85 shadow-xl shadow-sky-200/30 backdrop-blur-md">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-200/60 blur-2xl" />
      {loading ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-blue-600" />
            <p className="text-sm text-muted-foreground">Dang xu ly thanh toan...</p>
          </div>
        </div>
      ) : null}

      <CardHeader className="relative">
        <CardTitle>Nhap thong tin ngan hang</CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-3 py-2 text-sm"
        >
          <p className="font-medium text-gray-900">{packageLabel(packageType)}</p>
          <p className="text-xs text-muted-foreground">So tien: {amount.toLocaleString("vi-VN")} VND</p>
        </motion.div>

        <div className="space-y-1.5">
          <Label htmlFor="bank-name">Ten ngan hang</Label>
          <Input
            id="bank-name"
            placeholder="VD: Vietcombank"
            value={bankName}
            onChange={(e) => onBankNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account-number">So tai khoan</Label>
          <Input
            id="account-number"
            inputMode="numeric"
            placeholder="VD: 0123456789"
            value={accountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account-holder">Ten chu tai khoan</Label>
          <Input
            id="account-holder"
            placeholder="VD: Nguyen Van A"
            value={accountHolder}
            onChange={(e) => onAccountHolderChange(e.target.value)}
          />
        </div>

        {errorText ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorText}
          </p>
        ) : null}
        {expired ? (
          <p className="rounded-lg border border-amber-400/60 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Don da het han. Vui long huy giao dich va tao lai.
          </p>
        ) : null}

        <Button
          className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-300/30 transition-transform hover:scale-[1.01] hover:from-sky-500 hover:to-indigo-500"
          size="lg"
          disabled={loading || expired}
          onClick={onConfirm}
        >
          {loading ? (
            <>
              <Spinner className="mr-2" />
              Dang thanh toan...
            </>
          ) : (
            "Thanh toan"
          )}
        </Button>
        <Button
          className="w-full"
          variant="outline"
          disabled={canceling || disableCancel}
          onClick={onCancel}
        >
          {canceling ? "Dang huy..." : "Huy giao dich"}
        </Button>
      </CardContent>
    </Card>
  );
}
