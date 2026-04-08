import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const SEPAY_WEBHOOK_API_KEY =
  process.env.SEPAY_WEBHOOK_API_KEY;

export async function POST(request: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, message: "Missing BACKEND_URL or NEXT_PUBLIC_BACKEND_URL" },
      { status: 500 },
    );
  }

  try {
    const payload = await request.json();
    const forceInvalidKey = request.headers.get("x-force-invalid-key") === "1";
    const requestApiKey = request.headers.get("x-api-key");
    const apiKey = forceInvalidKey
      ? "invalid-key-for-401-test"
      : (requestApiKey ?? SEPAY_WEBHOOK_API_KEY);

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing x-api-key (request header) or SEPAY_WEBHOOK_API_KEY (server env)",
        },
        { status: 500 },
      );
    }

    const upstreamResponse = await fetch(`${BACKEND_URL}/v1/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const raw = await upstreamResponse.text();
    return new Response(raw, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Proxy webhook failed",
      },
      { status: 500 },
    );
  }
}
