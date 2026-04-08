import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "QR payment flow is deprecated. Please use manual bank transfer flow.",
    },
    { status: 410 },
  );
}
