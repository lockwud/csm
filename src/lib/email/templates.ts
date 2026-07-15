import { formatCurrency } from "@/lib/utils/formatCurrency";

const brand = {
  blue: "#064bbf",
  blueSoft: "#e8f2ff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#dbe4f0",
  success: "#16a34a",
};

function layout({
  eyebrow,
  title,
  preview,
  children,
}: {
  eyebrow: string;
  title: string;
  preview: string;
  children: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f5f7fb;font-family:Inter,Arial,sans-serif;color:${brand.text};">
    <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${preview}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid ${brand.border};border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,.08);">
            <tr>
              <td style="background:${brand.blue};padding:24px 28px;color:#ffffff;">
                <div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;opacity:.85;">${eyebrow}</div>
                <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;font-weight:900;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${children}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid ${brand.border};padding:18px 28px;color:${brand.muted};font-size:12px;line-height:1.6;">
                Sankofa Express keeps courier bookings, rider dispatch, payment updates, and delivery proof in one flow.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;color:${brand.muted};font-size:15px;line-height:1.7;">${text}</p>`;
}

export function signupOtpEmail(input: { name?: string; otp: string; expiresMinutes: number }) {
  return {
    subject: "Verify your Sankofa Express email",
    html: layout({
      eyebrow: "Email verification",
      title: "Confirm your email address",
      preview: `Your verification code is ${input.otp}.`,
      children: `
        ${paragraph(`Hello ${input.name || "there"}, use this code to verify your email before creating your Sankofa Express account.`)}
        <div style="margin:24px 0;padding:22px;border-radius:14px;background:${brand.blueSoft};text-align:center;">
          <div style="font-size:13px;font-weight:800;color:${brand.blue};text-transform:uppercase;letter-spacing:.12em;">Verification code</div>
          <div style="margin-top:8px;font-size:38px;letter-spacing:.18em;font-weight:900;color:${brand.blue};">${input.otp}</div>
        </div>
        ${paragraph(`This code expires in ${input.expiresMinutes} minutes. If you did not request it, you can ignore this email.`)}
      `,
    }),
  };
}

export function forgotPasswordEmail(input: { name?: string; otp: string; expiresMinutes: number }) {
  return {
    subject: "Your Sankofa Express password reset code",
    html: layout({
      eyebrow: "Account recovery",
      title: "Reset your password",
      preview: `Your password reset code is ${input.otp}.`,
      children: `
        ${paragraph(`Hello ${input.name || "there"}, use this code to reset access to your Sankofa Express account.`)}
        <div style="margin:24px 0;padding:22px;border-radius:14px;background:${brand.blueSoft};text-align:center;">
          <div style="font-size:13px;font-weight:800;color:${brand.blue};text-transform:uppercase;letter-spacing:.12em;">Password reset code</div>
          <div style="margin-top:8px;font-size:38px;letter-spacing:.18em;font-weight:900;color:${brand.blue};">${input.otp}</div>
        </div>
        ${paragraph(`This code expires in ${input.expiresMinutes} minutes. If this was not you, ignore this email and keep your account details private.`)}
      `,
    }),
  };
}

export function accountVerifiedEmail(input: { name?: string; role: string; dashboardUrl?: string }) {
  const roleLabel = input.role === "RIDER" ? "rider" : "client";
  return {
    subject: "Your Sankofa Express account is verified",
    html: layout({
      eyebrow: "Account verified",
      title: "Welcome to Sankofa Express",
      preview: "Your email has been verified and your account is ready.",
      children: `
        ${paragraph(`Hello ${input.name || "there"}, your email has been verified and your ${roleLabel} account has been created successfully.`)}
        <div style="margin:20px 0;border-radius:14px;background:${brand.blueSoft};padding:18px;color:${brand.blue};font-size:14px;line-height:1.7;">
          ${input.role === "RIDER"
            ? "Your rider application is saved for admin verification. Once approved, dispatch can assign delivery orders to you."
            : "You can now book deliveries, upload package images, choose payment points, and track rider progress from your dashboard."}
        </div>
        ${input.dashboardUrl ? `<p style="margin:22px 0;"><a href="${input.dashboardUrl}" style="display:inline-block;border-radius:10px;background:${brand.blue};padding:12px 18px;color:#fff;font-size:14px;font-weight:800;text-decoration:none;">Open dashboard</a></p>` : ""}
      `,
    }),
  };
}

export function paymentReceiptEmail(input: {
  customerName?: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  waybill?: string;
  paidAt?: Date | null;
}) {
  return {
    subject: `Payment receipt ${input.reference}`,
    html: layout({
      eyebrow: "Payment receipt",
      title: "Payment received successfully",
      preview: `Receipt for ${input.currency} ${input.amount.toFixed(2)}.`,
      children: `
        ${paragraph(`Hello ${input.customerName || "there"}, your payment has been received and recorded successfully.`)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border:1px solid ${brand.border};border-radius:14px;overflow:hidden;">
          ${receiptRow("Reference", input.reference)}
          ${input.waybill ? receiptRow("Waybill", input.waybill) : ""}
          ${receiptRow("Amount", formatCurrency(String(input.amount), input.currency))}
          ${receiptRow("Channel", input.channel.replaceAll("_", " ").toLowerCase())}
          ${receiptRow("Paid at", input.paidAt ? input.paidAt.toLocaleString("en-GH") : new Date().toLocaleString("en-GH"))}
        </table>
        <div style="margin-top:18px;border-radius:14px;background:#ecfdf3;padding:14px;color:${brand.success};font-size:14px;font-weight:800;">Your courier payment is now synced with finance and order tracking.</div>
      `,
    }),
  };
}

function receiptRow(label: string, value: string) {
  return `<tr>
    <td style="border-bottom:1px solid ${brand.border};padding:13px 16px;color:${brand.muted};font-size:13px;font-weight:700;">${label}</td>
    <td align="right" style="border-bottom:1px solid ${brand.border};padding:13px 16px;color:${brand.text};font-size:14px;font-weight:900;">${value}</td>
  </tr>`;
}
