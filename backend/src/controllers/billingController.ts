import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";

/**
 * NO PAYMENT PROVIDER HAS BEEN APPROVED.
 *
 * This controller implements a clearly separated development/mock billing
 * mode. It does NOT charge real money and does NOT talk to any external
 * payment API. It exists so the rest of the app (feature gating, plan
 * limits, upgrade UI) can be fully built and tested end-to-end.
 *
 * To go live, swap the body of `checkout` and `webhook` for real calls to
 * an approved provider (see README "Payment provider setup" section for
 * the recommendation) and keep everything else — Subscription model,
 * planAccess middleware, plan limits — unchanged.
 */

export async function getSubscription(req: AuthedRequest, res: Response) {
  const sub = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  res.json({ subscription: sub });
}

export async function mockCheckout(req: AuthedRequest, res: Response) {
  // Simulates a successful checkout completing instantly.
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const sub = await prisma.subscription.upsert({
    where: { userId: req.userId },
    update: {
      plan: "PRO",
      status: "ACTIVE",
      provider: "MOCK",
      customerId: `mock_cus_${req.userId}`,
      subscriptionId: `mock_sub_${Date.now()}`,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      userId: req.userId!,
      plan: "PRO",
      status: "ACTIVE",
      provider: "MOCK",
      customerId: `mock_cus_${req.userId}`,
      subscriptionId: `mock_sub_${Date.now()}`,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  res.json({
    subscription: sub,
    message: "Mock checkout complete. No real payment was processed.",
  });
}

export async function mockCancel(req: AuthedRequest, res: Response) {
  const sub = await prisma.subscription.update({
    where: { userId: req.userId },
    data: { cancelAtPeriodEnd: true, status: "CANCELED", plan: "FREE" },
  });
  res.json({ subscription: sub, message: "Subscription canceled (mock)." });
}

/**
 * Webhook-ready endpoint. When a real provider is approved, verify its
 * signature here and translate provider events into Subscription updates.
 * Currently a stub that acknowledges receipt without trusting the payload,
 * since no signing secret exists yet.
 */
export async function webhook(_req: AuthedRequest, res: Response) {
  res.status(501).json({
    error: "NO_PROVIDER_CONFIGURED",
    message:
      "No payment provider has been approved yet, so webhook events are not processed. See README for setup steps.",
  });
}
