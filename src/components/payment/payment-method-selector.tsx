"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  disabled?: boolean;
  onSelectVietQr: () => void;
  onSelectVietQrPay: () => void;
  onSelectCard: () => void;
  errorText?: string;
};

function MethodButton({
  title,
  description,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="text-zinc-400">›</span>
      </div>
    </button>
  );
}

export function PaymentMethodSelector({
  disabled,
  onSelectVietQr,
  onSelectVietQrPay,
  onSelectCard,
  errorText,
}: Props) {
  return (
    <Card className="border-zinc-200">
      <CardHeader>
        <CardTitle>Chon phuong thuc thanh toan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <MethodButton
          disabled={disabled}
          onClick={onSelectVietQr}
          title="Chuyen khoan ngan hang qua VietQR"
          description="Quet ma QR va thanh toan bang ung dung ngan hang"
        />
        <MethodButton
          disabled={disabled}
          onClick={onSelectVietQrPay}
          title="Chuyen khoan ngan hang qua VietQR Pay"
          description="Quet ma QR va thanh toan bang ung dung NAPAS"
        />
        <MethodButton
          disabled={disabled}
          onClick={onSelectCard}
          title="The tin dung/ghi no"
          description="Thanh toan an toan, ho tro the quoc te"
        />

        {errorText ? (
          <p className="mt-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorText}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

