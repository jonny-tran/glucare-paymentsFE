"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PackageType } from "@/services/payments";

type Props = {
  transactionId: string | null;
  packageType: PackageType | null;
  amount: number;
  countdownLabel: string;
  expired: boolean;
};

export function OrderSummaryCard({
  transactionId,
  packageType,
  amount,
  countdownLabel,
  expired,
}: Props) {
  return (
    <Card className="border-zinc-200">
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
          <p className="text-sm font-medium text-foreground">
            {packageType ? `Goi ${packageType}` : "Khong xac dinh"}
          </p>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">So tien</p>
          <p className="text-2xl font-semibold text-blue-700">
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

