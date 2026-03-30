"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendMaintenanceTicketNotifyEmail } from "@/lib/email/guest-notifications";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const maintenanceSchema = z.object({
  property: z.string().min(1, "Property is required"),
  category: z.string().min(1, "Category is required"),
  urgency: z.enum(["Low", "Medium", "High"], { message: "Urgency is required" }),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  photoUrl: z.string().url().optional(),
});

const STATUS_VALUES = ["Open", "In Progress", "Resolved"] as const;

export async function submitMaintenanceTicket(
  data: z.infer<typeof maintenanceSchema>
) {
  const parsed = maintenanceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const id = crypto.randomUUID();
  const supabase = createAdminClient();

  try {
    const { count, error: countError } = await supabase
      .from("maintenance_tickets")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Ticket count error:", countError);
      return { success: false, error: "Database error" };
    }

    const next = (count ?? 0) + 1;
    const ticketNumber = `MNT-${String(next).padStart(4, "0")}`;

    const { error } = await supabase.from("maintenance_tickets").insert({
      id,
      ticket_number: ticketNumber,
      property: parsed.data.property,
      category: parsed.data.category,
      urgency: parsed.data.urgency,
      description: parsed.data.description,
      photo_url: parsed.data.photoUrl ?? null,
      status: "Open",
    });

    if (error) {
      console.error("Failed to submit ticket:", error);
      return { success: false, error: error.message };
    }

    void sendMaintenanceTicketNotifyEmail({
      ticketNumber,
      property: parsed.data.property,
      category: parsed.data.category,
      urgency: parsed.data.urgency,
      descriptionPreview: parsed.data.description,
    }).catch((e) => console.error("Maintenance notify email:", e));

    revalidatePath("/maintenance/dashboard");
    return { success: true, ticketNumber };
  } catch (e) {
    console.error("Failed to submit ticket:", e);
    return { success: false, error: "Database error" };
  }
}

export async function updateTicketStatus(id: string, status: string) {
  if (!(STATUS_VALUES as readonly string[]).includes(status)) {
    return { success: false };
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .from("maintenance_tickets")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Failed to update status:", error);
      return { success: false };
    }

    revalidatePath("/maintenance/dashboard");
    return { success: true };
  } catch (e) {
    console.error("Failed to update status:", e);
    return { success: false };
  }
}
