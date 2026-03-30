import { getMaintenanceTickets } from '@/app/actions/maintenance';
import DashboardClient from './client-page';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const tickets = await getMaintenanceTickets();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <DashboardClient initialTickets={tickets} />
    </div>
  );
}
