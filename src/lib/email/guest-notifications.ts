import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  const custom = process.env.GUEST_EMAIL_FROM?.trim();
  if (custom) return custom;
  return "Guest Services <onboarding@resend.dev>";
}

export async function sendRefundSubmissionEmail(params: {
  to: string;
  fullName: string;
  bookingReference: string;
  bookingDateLabel: string;
  refundReason: string;
}): Promise<{ sent: boolean }> {
  const resend = getResend();
  if (!resend) return { sent: false };

  const text = [
    `Hi ${params.fullName},`,
    "",
    "Thanks — we've received your refund request.",
    "",
    `Booking reference: ${params.bookingReference}`,
    `Booking date: ${params.bookingDateLabel}`,
    `Reason: ${params.refundReason}`,
    "",
    "Our team will review your submission and may follow up by email.",
    "",
    "— Guest services",
  ].join("\n");

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: params.to,
      subject: "We received your refund request",
      text,
      html: `
        <p>Hi ${escapeHtml(params.fullName)},</p>
        <p>Thanks — we've received your <strong>refund request</strong>.</p>
        <ul>
          <li><strong>Booking reference:</strong> ${escapeHtml(params.bookingReference)}</li>
          <li><strong>Booking date:</strong> ${escapeHtml(params.bookingDateLabel)}</li>
          <li><strong>Reason:</strong> ${escapeHtml(params.refundReason)}</li>
        </ul>
        <p>Our team will review your submission and may follow up by email.</p>
        <p>— Guest services</p>
      `,
    });
    return { sent: true };
  } catch (e) {
    console.error("sendRefundSubmissionEmail:", e);
    return { sent: false };
  }
}

export async function sendMaintenanceTicketNotifyEmail(params: {
  ticketNumber: string;
  property: string;
  category: string;
  urgency: string;
  descriptionPreview: string;
}): Promise<{ sent: boolean }> {
  const resend = getResend();
  const notifyTo = process.env.MAINTENANCE_NOTIFY_EMAIL?.trim();
  if (!resend || !notifyTo) return { sent: false };

  const preview =
    params.descriptionPreview.length > 280
      ? `${params.descriptionPreview.slice(0, 280)}…`
      : params.descriptionPreview;

  const text = [
    "New maintenance ticket",
    "",
    `Ticket: ${params.ticketNumber}`,
    `Property: ${params.property}`,
    `Category: ${params.category}`,
    `Urgency: ${params.urgency}`,
    "",
    preview,
  ].join("\n");

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: notifyTo,
      subject: `[${params.ticketNumber}] New maintenance issue — ${params.urgency}`,
      text,
      html: `
        <h2>New maintenance ticket</h2>
        <p><strong>${escapeHtml(params.ticketNumber)}</strong></p>
        <ul>
          <li><strong>Property:</strong> ${escapeHtml(params.property)}</li>
          <li><strong>Category:</strong> ${escapeHtml(params.category)}</li>
          <li><strong>Urgency:</strong> ${escapeHtml(params.urgency)}</li>
        </ul>
        <p>${escapeHtml(preview).replace(/\n/g, "<br/>")}</p>
      `,
    });
    return { sent: true };
  } catch (e) {
    console.error("sendMaintenanceTicketNotifyEmail:", e);
    return { sent: false };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
