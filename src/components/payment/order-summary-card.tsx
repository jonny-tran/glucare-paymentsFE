"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PackageCode } from "@/services/payments";

type Props = {
  transactionId: string | null;
  packageType: PackageCode | null;
  amount: number;
  countdownLabel: string;
  expired: boolean;
};

function packageLabel(packageType: PackageCode | null): string {
  if (packageType === "M") return "Goi Thang";
  if (packageType === "Y") return "Goi Nam";
  if (packageType === "L") return "Goi Tron doi";
  return "Khong xac dinh";
}

export function OrderSummaryCard({
  transactionId,
  packageType,
  amount,
  countdownLabel,
  expired,
}: Props) {
  return (
    <Card className="rounded-2xl border-white/60 bg-white/85 shadow-xl shadow-indigo-200/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle>Thong tin giao dich</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Transaction ID</p>
          <p className="break-all font-mono text-xs text-foreground sm:text-sm">
            {transactionId ?? "(missing transactionId)"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Goi dich vu</p>
          <p className="text-sm font-medium text-foreground">{packageLabel(packageType)}</p>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">So tien</p>
          <p className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-2xl font-semibold text-transparent">
            {amount.toLocaleString("vi-VN")} VND
          </p>
        </div>
        <div
          className={`rounded-lg px-3 py-2 text-xs ${
            expired
              ? "border border-amber-400/60 bg-amber-50 text-amber-700"
              : "border border-zinc-200 bg-zinc-50 text-zinc-700"
          }`}
        >
          <span className="font-medium">Con lai:</span> {countdownLabel}
          {expired ? " (Da het han)" : ""}
        </div>
      </CardContent>
    </Card>
  );
}

