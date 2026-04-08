export type PackageType = "MONTHLY" | "YEARLY" | "LIFETIME";

export type SubmitPaymentRequest = {
  userId: string;
  packageType: PackageType;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type SubmitPaymentResponse = {
  success: boolean;
  transactionRef?: string;
  expectedAmount?: number;
  packageType?: PackageType;
  status?: "PENDING" | "SUCCESS" | "FAILED";
  message?: string;
};

export type PaymentWebhookPayload = {
  id: string;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  content: string;
  transferType: "in";
  transferAmount: number;
  accumulated: number;
  referenceCode: string;
};

export type SendWebhookOptions = {
  useInvalidApiKey?: boolean;
};

export type CancelPaymentResponse = {
  transactionId: string;
  status: "CANCELLED";
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }
  return url;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

function bearerHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function submitPayment(
  body: SubmitPaymentRequest,
  token: string,
): Promise<SubmitPaymentResponse> {
  const response = await fetch("/api/payments/submit", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(body),
  });

  const data = (await parseJsonResponse(response)) as
    | SubmitPaymentResponse
    | { data?: SubmitPaymentResponse; message?: string };

  const normalized = "success" in data ? data : data?.data;

  if (!response.ok || !normalized?.success) {
    const message =
      typeof (data as { message?: string })?.message === "string"
        ? (data as { message?: string }).message!
        : `Submit payment failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return normalized;
}

export async function cancelPayment(
  token: string,
  transactionId?: string,
): Promise<CancelPaymentResponse> {
  const response = await fetch(`${getBackendUrl()}/v1/payments/cancel`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(transactionId ? { transactionId } : {}),
  });

  const data = (await parseJsonResponse(response)) as
    | CancelPaymentResponse
    | { data?: CancelPaymentResponse; message?: string };

  const normalized = "status" in data ? data : data?.data;

  if (!response.ok || !normalized?.transactionId) {
    const message =
      typeof (data as { message?: string })?.message === "string"
        ? (data as { message?: string }).message!
        : `Cancel failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return normalized;
}

export async function sendPaymentWebhook(
  payload: PaymentWebhookPayload,
  options: SendWebhookOptions = {},
): Promise<{ status: number; data: unknown }> {
  const response = await fetch("/api/payments/mock-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.useInvalidApiKey ? { "x-force-invalid-key": "1" } : {}),
    },
    body: JSON.stringify(payload),
  });

  return {
    status: response.status,
    data: await parseJsonResponse(response),
  };
}
