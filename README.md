This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Payments local test

### 1) Env

Set values in `.env`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
SEPAY_WEBHOOK_API_KEY=your_local_sepay_webhook_api_key
NEXT_PUBLIC_SEPAY_WEBHOOK_API_KEY=your_local_sepay_webhook_api_key
```

### 2) Subscription flow

- Open `http://localhost:3000/subscription`
- Select test user and package `M | Y | L`
- Click `Thanh toan` to call `POST /v1/payments/initiate`
- Frontend redirects to `paymentUrl` from backend

### 3) Simulator flow

- Open `http://localhost:3000/payment/simulator?userId=<uuid>&package=M`
- Click `Xac nhan da chuyen khoan` to call server route:
  - `POST /api/payments/mock-webhook`
  - route forwards to backend `POST /v1/payments/webhook`
  - `x-api-key` is injected on server from env

### 4) Verify checklist

- Test package `M`, `Y`, `L` on simulator
- Toggle `Test sai x-api-key` to verify backend returns `401`
- Remove `userId` or `package` in query to verify UI blocks API call
