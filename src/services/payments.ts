export type PackageType = "M" | "Y" | "L";

export type InitiatePaymentRequest = {
  userId: string;
  packageType: PackageType;
};

export type InitiatePaymentResponse = {
  success?: boolean;
  paymentUrl?: string;
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

export async function initiatePayment(
  body: InitiatePaymentRequest,
): Promise<InitiatePaymentResponse> {
  const response = await fetch(`${getBackendUrl()}/v1/payments/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await parseJsonResponse(response)) as InitiatePaymentResponse;
  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Initiate failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
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
