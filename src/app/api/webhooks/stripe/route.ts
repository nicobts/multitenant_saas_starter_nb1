import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe/webhooks";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    await handleStripeWebhook(body);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
