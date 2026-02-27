import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { POST as initPost } from "../src/app/api/payments/init/route";
import { POST as webhookPost } from "../src/app/api/webhooks/wompi/route";

const prisma = new PrismaClient();

const TEST_ORDER_CODE = "ESS-TEST1";

async function createTestOrder() {
  const product = await prisma.product.findFirst();
  if (!product) throw new Error("No product in DB - run db:seed first");

  const existing = await prisma.order.findUnique({
    where: { code: TEST_ORDER_CODE },
  });

  if (existing) {
    await prisma.paymentAttempt.deleteMany({ where: { orderId: existing.id } });
    await prisma.stockReservation.deleteMany({ where: { orderId: existing.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: existing.id } });
    await prisma.order.delete({ where: { id: existing.id } });
  }

  const order = await prisma.order.create({
    data: {
      code: TEST_ORDER_CODE,
      email: "test@test.com",
      shippingName: "Test",
      shippingAddr: "Calle Test 1",
      shippingCity: "Madrid",
      subtotal: 100,
      shippingCost: 0,
      total: 100,
      status: "CREATED",
      items: {
        create: {
          productId: product.id,
          quantity: 1,
          price: 100,
        },
      },
    },
    include: { items: true },
  });

  return order;
}

describe("payments/init idempotency", () => {
  beforeAll(async () => {
    await createTestOrder();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns same paymentUrl on second call (idempotency)", async () => {
    const body = JSON.stringify({
      orderCode: TEST_ORDER_CODE,
      provider: "wompi",
    });

    const req1 = new Request("http://localhost/api/payments/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const res1 = await initPost(req1);
    const json1 = await res1.json();
    expect(res1.ok).toBe(true);
    expect(json1.paymentUrl).toBeDefined();
    expect(json1.providerIntentId).toBeDefined();

    const req2 = new Request("http://localhost/api/payments/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const res2 = await initPost(req2);
    const json2 = await res2.json();
    expect(res2.ok).toBe(true);
    expect(json2.paymentUrl).toBe(json1.paymentUrl);
    expect(json2.providerIntentId).toBe(json1.providerIntentId);
  });
});

describe("webhook APPROVED", () => {
  beforeAll(async () => {
    const order = await createTestOrder();
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAYMENT_PENDING" },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("updates order to PAID when webhook receives APPROVED", async () => {
    const secret = process.env.MOCK_WEBHOOK_SECRET || "test-secret";

    const req = new Request("http://localhost/api/webhooks/wompi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": secret,
      },
      body: JSON.stringify({
        orderCode: TEST_ORDER_CODE,
        providerTxnId: "txn_test_123",
        status: "APPROVED",
        amount: 10000,
      }),
    });

    const res = await webhookPost(req);
    expect(res.ok).toBe(true);

    const order = await prisma.order.findUnique({
      where: { code: TEST_ORDER_CODE },
    });
    expect(order?.status).toBe("PAID");
    expect(order?.paidAt).toBeDefined();
  });
});
