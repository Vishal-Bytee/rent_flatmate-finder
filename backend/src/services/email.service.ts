import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = env.smtpUser
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    })
  : null;

async function send(to: string, subject: string, html: string) {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log(`[email:skipped - no SMTP configured] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await transporter.sendMail({ from: env.smtpFrom, to, subject, html });
  } catch (err) {
    // Email failures should never break the request that triggered them
    // eslint-disable-next-line no-console
    console.error("Failed to send email:", err);
  }
}

function baseTemplate(title: string, rows: Record<string, string>) {
  const rowsHtml = Object.entries(rows)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#555;">${k}</td><td style="padding:6px 12px;font-weight:600;">${v}</td></tr>`)
    .join("");
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:8px;">
    <h2 style="color:#1F2544;">${title}</h2>
    <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
    <p style="margin-top:24px;color:#888;font-size:12px;">Rent & Flatmate Finder</p>
  </div>`;
}

export const emailService = {
  async notifyOwnerHighInterest(ownerEmail: string, listingTitle: string, ownerName: string, tenantName: string) {
    await send(
      ownerEmail,
      `Strong match interested in "${listingTitle}"`,
      baseTemplate("New high-compatibility interest", {
        Listing: listingTitle,
        Owner: ownerName,
        Tenant: tenantName,
        Status: "Pending",
        Date: new Date().toLocaleDateString(),
      })
    );
  },

  async notifyTenantInterestAccepted(tenantEmail: string, listingTitle: string, ownerName: string, tenantName: string) {
    await send(
      tenantEmail,
      `Good news! Your interest in "${listingTitle}" was accepted`,
      baseTemplate("Interest request accepted", {
        Listing: listingTitle,
        Owner: ownerName,
        Tenant: tenantName,
        Status: "Accepted",
        Date: new Date().toLocaleDateString(),
      })
    );
  },

  async notifyTenantInterestDeclined(tenantEmail: string, listingTitle: string, ownerName: string, tenantName: string) {
    await send(
      tenantEmail,
      `Update on your interest in "${listingTitle}"`,
      baseTemplate("Interest request declined", {
        Listing: listingTitle,
        Owner: ownerName,
        Tenant: tenantName,
        Status: "Declined",
        Date: new Date().toLocaleDateString(),
      })
    );
  },
};
