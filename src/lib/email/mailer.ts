import nodemailer from "nodemailer";
import { accountVerifiedEmail, forgotPasswordEmail, paymentReceiptEmail, signupOtpEmail } from "./templates";

type MailInput = {
  to: string;
  subject: string;
  html: string;
};

function smtpReady() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM);
}

function transporter() {
  if (!smtpReady()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail(input: MailInput) {
  const mailer = transporter();
  if (!mailer) {
    console.warn(`Email not sent to ${input.to}. SMTP env is not configured.`);
    return { sent: false, reason: "SMTP env is not configured" };
  }

  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  return { sent: true };
}

export async function sendSignupOtpEmail(input: { to: string; name?: string; otp: string; expiresMinutes: number }) {
  const template = signupOtpEmail(input);
  return sendMail({ to: input.to, ...template });
}

export async function sendForgotPasswordEmail(input: { to: string; name?: string; otp: string; expiresMinutes: number }) {
  const template = forgotPasswordEmail(input);
  return sendMail({ to: input.to, ...template });
}

export async function sendAccountVerifiedEmail(input: { to: string; name?: string; role: string; dashboardUrl?: string }) {
  const template = accountVerifiedEmail(input);
  return sendMail({ to: input.to, ...template });
}

export async function sendPaymentReceiptEmail(input: {
  to: string;
  customerName?: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  waybill?: string;
  paidAt?: Date | null;
}) {
  const template = paymentReceiptEmail(input);
  return sendMail({ to: input.to, ...template });
}
