import Stripe from "stripe";
import { env } from "@/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

export const STRIPE_PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    limits: {
      users: 3,
      projects: 2,
    },
    features: [
      "Up to 3 team members",
      "2 projects",
      "Basic support",
    ],
  },
  starter: {
    name: "Starter",
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    limits: {
      users: 10,
      projects: 10,
    },
    features: [
      "Up to 10 team members",
      "10 projects",
      "Priority support",
      "Advanced analytics",
    ],
  },
  pro: {
    name: "Pro",
    price: 99,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      users: 50,
      projects: 50,
    },
    features: [
      "Up to 50 team members",
      "50 projects",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "SSO",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    priceId: null,
    limits: {
      users: -1, // unlimited
      projects: -1, // unlimited
    },
    features: [
      "Unlimited team members",
      "Unlimited projects",
      "24/7 dedicated support",
      "Custom SLA",
      "On-premise deployment",
      "Custom features",
    ],
  },
} as const;

export type PlanName = keyof typeof STRIPE_PLANS;
