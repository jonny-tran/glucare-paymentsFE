import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, message: "Missing BACKEND_URL or NEXT_PUBLIC_BACKEND_URL" },
      { status: 500 },
    );
  }

  try {
    const payload = await request.json();
    const authHeader = request.headers.get("authorization");

    const upstreamResponse = await fetch(`${BACKEND_URL}/v1/payments/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
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
        message: error instanceof Error ? error.message : "Proxy initiate payment failed",
      },
      { status: 500 },
    );
  }
}
