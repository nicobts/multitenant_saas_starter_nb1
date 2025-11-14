import { headers } from "next/headers";
import { stripe } from "./index";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export async function handleStripeWebhook(body: string) {
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    throw new Error("No signature found");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    webhookSecret
  );

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { received: true };
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await db
    .update(tenants)
    .set({
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      stripePriceId: subscription.items.data[0]?.price.id,
      updatedAt: new Date(),
    })
    .where(eq(tenants.stripeCustomerId, customerId));
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await db
    .update(tenants)
    .set({
      stripeSubscriptionStatus: "canceled",
      plan: "free",
      updatedAt: new Date(),
    })
    .where(eq(tenants.stripeCustomerId, customerId));
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // You can add logic here to send receipt emails, update payment history, etc.
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // You can add logic here to notify the tenant, send emails, etc.
  console.log(`Payment failed for invoice: ${invoice.id}`);
}
