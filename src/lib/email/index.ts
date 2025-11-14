import { Resend } from "resend";
import { env } from "@/env";
import { render } from "@react-email/render";
import { WelcomeEmail } from "./templates/welcome";
import { InvitationEmail } from "./templates/invitation";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  to,
  name,
  tenantName,
  loginUrl,
}: {
  to: string;
  name: string;
  tenantName: string;
  loginUrl: string;
}) {
  const html = await render(
    WelcomeEmail({ name, tenantName, loginUrl })
  );

  return resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `Welcome to ${tenantName}!`,
    html,
  });
}

export async function sendInvitationEmail({
  to,
  inviterName,
  tenantName,
  inviteUrl,
  role,
}: {
  to: string;
  inviterName: string;
  tenantName: string;
  inviteUrl: string;
  role: string;
}) {
  const html = await render(
    InvitationEmail({ inviterName, tenantName, inviteUrl, role })
  );

  return resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `You've been invited to join ${tenantName}`,
    html,
  });
}
