'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { updateTicketStatus } from '@/app/actions/maintenance';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';

type Ticket = {
  id: string;
  ticketNumber: string;
  property: string;
  category: string;
  urgency: string;
  status: string;
  createdAt: string;
};

export default function DashboardClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filterProperty, setFilterProperty] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('All');

  const filteredTickets = tickets.filter(ticket => {
    const matchesProperty = ticket.property.toLowerCase().includes(filterProperty.toLowerCase());
    const matchesUrgency = filterUrgency === 'All' || ticket.urgency === filterUrgency;
    return matchesProperty && matchesUrgency;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setTickets(current => 
      current.map(t => t.id === id ? { ...t, status: newStatus } : t)
    );
    
    const result = await updateTicketStatus(id, newStatus);
    if (!result.success) {
      // Revert on failure
      alert('Failed to update status');
      setTickets(initialTickets);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Low': return 'bg-green-100 text-green-800 hover:bg-green-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and track maintenance requests.</p>
        </div>
        <Link href="/maintenance" className={buttonVariants({ variant: "default" })}>Submit New Issue</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-lg border">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Filter by Property</label>
          <Input 
            placeholder="Search property..." 
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <label className="text-sm font-medium mb-1 block">Filter by Urgency</label>
          <Select value={filterUrgency} onValueChange={(val) => setFilterUrgency(val || 'All')}>
            <SelectTrigger>
              <SelectValue placeholder="All Urgencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Urgencies</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No tickets found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono font-medium">{ticket.ticketNumber}</TableCell>
                  <TableCell>{ticket.property}</TableCell>
                  <TableCell>{ticket.category}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getUrgencyColor(ticket.urgency)}>
                      {ticket.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={ticket.status} 
                      onValueChange={(val) => { if (val) handleStatusChange(ticket.id, val) }}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
