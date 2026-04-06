"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  packageType: string | null;
  amount: number;
  loading: boolean;
  canceling: boolean;
  expired: boolean;
  errorText?: string;
  disableCancel?: boolean;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  onCardNameChange: (value: string) => void;
  onCardNumberChange: (value: string) => void;
  onCardExpiryChange: (value: string) => void;
  onCardCvvChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onBack: () => void;
};

export function CardPaymentForm(props: Props) {
  const {
    packageType,
    amount,
    loading,
    canceling,
    expired,
    errorText,
    disableCancel,
    cardName,
    cardNumber,
    cardExpiry,
    cardCvv,
    onCardNameChange,
    onCardNumberChange,
    onCardExpiryChange,
    onCardCvvChange,
    onConfirm,
    onCancel,
    onBack,
  } = props;

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
          <span>Thong tin the</span>
          <button type="button" className="text-sm font-normal text-blue-700 hover:underline" onClick={onBack}>
            ← Quay lai
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="card-name">Ten chu the</Label>
            <Input id="card-name" placeholder="VD: Nguyen Van A" value={cardName} onChange={(e) => onCardNameChange(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Goi dang thanh toan</Label>
            <div className="rounded-lg border bg-muted/60 px-3 py-2 text-sm">
              <p className="font-medium text-gray-900">{packageType ? `Goi ${packageType}` : "Chua xac dinh"}</p>
              <p className="text-xs text-muted-foreground">So tien: {amount.toLocaleString("vi-VN")} VND</p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="card-number">So the</Label>
          <Input
            id="card-number"
            inputMode="numeric"
            maxLength={19}
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => onCardNumberChange(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="card-expiry">Ngay het han</Label>
            <Input id="card-expiry" placeholder="MM/YY" value={cardExpiry} onChange={(e) => onCardExpiryChange(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-cvv">CVV</Label>
            <Input
              id="card-cvv"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={cardCvv}
              onChange={(e) => onCardCvvChange(e.target.value)}
            />
          </div>
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

        <Button className="w-full" size="lg" disabled={loading || expired} onClick={onConfirm}>
          {loading ? (
            <>
              <Spinner className="mr-2" />
              Dang thanh toan...
            </>
          ) : (
            "Thanh toan ngay"
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

