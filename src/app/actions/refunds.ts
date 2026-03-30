'use server';

import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const refundSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  email: z.string().email('Invalid email address'),
  bookingReference: z.string().min(1, 'Booking Reference is required'),
  bookingDate: z.string().min(1, 'Booking Date is required'),
  refundReason: z.string().min(1, 'Refund Reason is required'),
  additionalDetails: z.string().optional(),
  fileUrl: z.string().optional(),
});

export async function submitRefund(data: z.infer<typeof refundSchema>) {
  const parsed = refundSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const db = await getDb();
  const id = uuidv4();

  try {
    await db.run(
      `INSERT INTO refunds (id, fullName, email, bookingReference, bookingDate, refundReason, additionalDetails, fileUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        parsed.data.fullName,
        parsed.data.email,
        parsed.data.bookingReference,
        parsed.data.bookingDate,
        parsed.data.refundReason,
        parsed.data.additionalDetails || null,
        parsed.data.fileUrl || null,
      ]
    );

    return { success: true, data: parsed.data };
  } catch (error) {
    console.error('Failed to submit refund:', error);
    return { success: false, error: 'Database error' };
  }
}
