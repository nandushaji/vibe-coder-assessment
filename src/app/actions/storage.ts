"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_REFUND = "refund-evidence";
const BUCKET_MAINTENANCE = "maintenance-photos";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function sanitizeFilename(name: string): string {
  const trimmed = name.trim().slice(0, 200);
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe || "upload";
}

async function uploadToBucket(
  file: File,
  bucket: string
): Promise<
  { success: true; url: string | null } | { success: false; error: string }
> {
  if (!file || file.size === 0) {
    return { success: true, url: null };
  }
  if (file.size > MAX_BYTES) {
    return { success: false, error: "File must be 5 MB or smaller." };
  }

  try {
    const supabase = createAdminClient();
    const path = `${crypto.randomUUID()}/${sanitizeFilename(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
    });
    if (error) {
      console.error("Storage upload error:", error);
      return {
        success: false,
        error: error.message || "Could not upload file.",
      };
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { success: true, url: data.publicUrl };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Upload failed. Check Supabase configuration.",
    };
  }
}

export async function uploadRefundEvidenceFile(file: File) {
  return uploadToBucket(file, BUCKET_REFUND);
}

export async function uploadMaintenancePhotoFile(file: File) {
  return uploadToBucket(file, BUCKET_MAINTENANCE);
}
