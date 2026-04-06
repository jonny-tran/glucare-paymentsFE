"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  qrUrl: string;
  loading: boolean;
  canceling: boolean;
  expired: boolean;
  methodLabel: string;
  errorText?: string;
  disableCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onBack: () => void;
};

export function QrPaymentPanel({
  qrUrl,
  loading,
  canceling,
  expired,
  methodLabel,
  errorText,
  disableCancel,
  onConfirm,
  onCancel,
  onBack,
}: Props) {
  return (
    <Card className="relative overflow-hidden border-zinc-200">
      {loading ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-blue-600" />
            <p className="text-sm text-muted-foreground">Dang xu ly thanh toan...</p>
          </div>
        </div>
      ) : null}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quet ma QR de thanh toan</span>
          <button type="button" onClick={onBack} className="text-sm font-normal text-blue-700 hover:underline">
            ← Quay lai
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{methodLabel}</p>

        <div className="flex items-center justify-center rounded-2xl bg-zinc-100 p-4">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="QR Code" className="h-64 w-64 rounded-lg bg-white p-2 shadow-sm" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center text-sm text-muted-foreground">
              Khong co QR code
            </div>
          )}
        </div>

        {errorText ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorText}
          </p>
        ) : null}
        {expired ? (
          <p className="rounded-lg border border-amber-400/60 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Don da het han. Vui long tao giao dich moi.
          </p>
        ) : null}

        <Button className="w-full" size="lg" disabled={loading || expired} onClick={onConfirm}>
          {loading ? (
            <>
              <Spinner className="mr-2" />
              Dang thanh toan...
            </>
          ) : (
            "Gia lap thanh toan"
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

