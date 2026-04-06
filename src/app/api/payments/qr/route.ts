import { NextResponse } from "next/server";

function getQrUrlByPackage(packageType: string | null): string | null {
  if (packageType === "M") return process.env.PAYMENT_QR_CODE_URL_MONTH ?? null;
  if (packageType === "Y") return process.env.PAYMENT_QR_CODE_URL_YEAR ?? null;
  if (packageType === "L") return process.env.PAYMENT_QR_CODE_URL_LIFETIME ?? null;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packageType = searchParams.get("package");
  const url = getQrUrlByPackage(packageType);

  if (!url) {
    return NextResponse.json(
      { success: false, message: "QR url is not configured for this package" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, url });
}

