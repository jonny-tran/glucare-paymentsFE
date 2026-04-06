"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SuccessProps = {
  type: "success";
  transactionId: string | null;
  referenceCode: string | null;
  amount: number;
  onBackToPayment: () => void;
  onReturnToApp: () => void;
};

type FailedProps = {
  type: "failed";
  reason: string;
  canceling: boolean;
  disableCancel?: boolean;
  onRetry: () => void;
  onCancel: () => void;
};

type Props = SuccessProps | FailedProps;

export function PaymentResultCard(props: Props) {
  if (props.type === "failed") {
    return (
      <Card className="mx-auto w-full max-w-xl overflow-hidden border-zinc-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-red-600 text-white">
              !
            </span>
            Thanh toan that bai
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {props.reason || "Giao dich khong thanh cong."}
          </p>
          <div className="space-y-2">
            <Button className="w-full" onClick={props.onRetry}>
              Thu lai
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={props.disableCancel}
              onClick={props.onCancel}
            >
              {props.canceling ? "Dang huy..." : "Huy giao dich"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-xl overflow-hidden border-zinc-200">
      <CardHeader className="bg-emerald-50">
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
            ✓
          </span>
          Thanh toan thanh cong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="rounded-lg bg-muted px-3 py-3 text-sm">
          <p className="text-xs text-muted-foreground">Transaction ID</p>
          <p className="mt-1 break-all font-mono text-xs text-foreground sm:text-sm">
            {props.transactionId ?? "-"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">So tien</p>
          <p className="text-base font-semibold text-foreground">
            {props.amount.toLocaleString("vi-VN")} VND
          </p>
          {props.referenceCode ? (
            <>
              <p className="mt-2 text-xs text-muted-foreground">Ma giao dich ngan hang</p>
              <p className="font-mono text-xs text-foreground">{props.referenceCode}</p>
            </>
          ) : null}
        </div>

        <div className="space-y-2 pt-2">
          <Button className="w-full" size="lg" onClick={props.onReturnToApp}>
            Ve ung dung GlucoDia
          </Button>
          <Button className="w-full" size="sm" variant="outline" onClick={props.onBackToPayment}>
            Quay ve trang thanh toan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

