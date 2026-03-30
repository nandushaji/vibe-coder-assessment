"use server";

import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRefundSubmissionEmail } from "@/lib/email/guest-notifications";
import { z } from "zod";

const refundSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  email: z.string().email("Invalid email address"),
  bookingReference: z.string().min(1, "Booking Reference is required"),
  bookingDate: z.string().min(1, "Booking Date is required"),
  refundReason: z.string().min(1, "Refund Reason is required"),
  additionalDetails: z
    .string()
    .min(10, "Additional details must be at least 10 characters."),
  fileUrl: z.string().url().optional(),
});

export async function submitRefund(data: z.infer<typeof refundSchema>) {
  const parsed = refundSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const id = crypto.randomUUID();
  const supabase = createAdminClient();

  try {
    const { error } = await supabase.from("refunds").insert({
      id,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      booking_reference: parsed.data.bookingReference,
      booking_date: parsed.data.bookingDate,
      refund_reason: parsed.data.refundReason,
      additional_details: parsed.data.additionalDetails,
      file_url: parsed.data.fileUrl ?? null,
      review_status: "pending",
    });

    if (error) {
      console.error("Failed to submit refund:", error);
      return { success: false, error: error.message };
    }

    const bookingDateLabel = format(
      new Date(parsed.data.bookingDate),
      "MMMM d, yyyy",
    );
    const { sent: emailSent } = await sendRefundSubmissionEmail({
      to: parsed.data.email,
      fullName: parsed.data.fullName,
      bookingReference: parsed.data.bookingReference,
      bookingDateLabel,
      refundReason: parsed.data.refundReason,
    });

    return { success: true, data: parsed.data, emailSent };
  } catch (e) {
    console.error("Failed to submit refund:", e);
    return { success: false, error: "Database error" };
  }
}
