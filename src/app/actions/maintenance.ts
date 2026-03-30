'use server';

import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const maintenanceSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  category: z.string().min(1, 'Category is required'),
  urgency: z.enum(['Low', 'Medium', 'High'], { message: 'Urgency is required' }),
  description: z.string().min(1, 'Description is required'),
  photoUrl: z.string().optional(),
});

export async function submitMaintenanceTicket(data: z.infer<typeof maintenanceSchema>) {
  const parsed = maintenanceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const db = await getDb();
  const id = uuidv4();
  
  // Generate a simple sequential ticket number MNT-XXXX
  const row = await db.get(`SELECT COUNT(*) as count FROM maintenance_tickets`);
  const count = row ? row.count + 1 : 1;
  const ticketNumber = `MNT-${count.toString().padStart(4, '0')}`;

  try {
    await db.run(
      `INSERT INTO maintenance_tickets (id, ticketNumber, property, category, urgency, description, photoUrl, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ticketNumber,
        parsed.data.property,
        parsed.data.category,
        parsed.data.urgency,
        parsed.data.description,
        parsed.data.photoUrl || null,
        'Open'
      ]
    );

    revalidatePath('/maintenance/dashboard');
    return { success: true, ticketNumber };
  } catch (error) {
    console.error('Failed to submit ticket:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function getMaintenanceTickets() {
  const db = await getDb();
  const tickets = await db.all(`SELECT * FROM maintenance_tickets ORDER BY createdAt DESC`);
  return tickets;
}

export async function updateTicketStatus(id: string, status: string) {
  const db = await getDb();
  try {
    await db.run(`UPDATE maintenance_tickets SET status = ? WHERE id = ?`, [status, id]);
    revalidatePath('/maintenance/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update ticket:', error);
    return { success: false };
  }
}
