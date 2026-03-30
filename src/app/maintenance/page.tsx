"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { submitMaintenanceTicket } from '@/app/actions/maintenance';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  property: z.string().min(1, 'Please select a property.'),
  category: z.string().min(1, 'Please select a category.'),
  urgency: z.enum(['Low', 'Medium', 'High'], { message: 'Please select an urgency level.' }),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters).'),
  photoUrl: z.string().optional(),
});

const PROPERTIES = [
  'Sunset Apartments - Unit 101',
  'Oceanview Condos - Unit 4B',
  'Downtown Lofts - Penthouse',
  'Pine Ridge Townhomes - Unit 12',
  'Maple Street House',
];

export default function MaintenanceSubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      photoUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await submitMaintenanceTicket(values);
      if (result.success && result.ticketNumber) {
        setTicketNumber(result.ticketNumber);
      } else {
        alert('Failed to submit ticket. Please try again.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (ticketNumber) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <Card className="border-green-200 bg-green-50/50 text-center py-8">
          <CardHeader>
            <div className="mx-auto bg-green-100 text-green-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-800">Issue Submitted</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your maintenance ticket has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border shadow-sm inline-block mx-auto mb-6">
              <span className="text-sm text-gray-500 block mb-1">Ticket Number</span>
              <span className="text-2xl font-bold font-mono text-gray-900">{ticketNumber}</span>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => {
                setTicketNumber(null);
                form.reset();
              }} variant="outline">
                Submit Another
              </Button>
<Link href="/maintenance/dashboard" className={buttonVariants({ variant: "default" })}>View Dashboard</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report an Issue</h1>
          <p className="text-muted-foreground mt-2">
            Submit a maintenance request for your property.
          </p>
        </div>
        <Link href="/maintenance/dashboard" className={buttonVariants({ variant: "outline" })}>Dashboard</Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <FormField
            control={form.control}
            name="property"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Name</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROPERTIES.map(prop => (
                      <SelectItem key={prop} value={prop}>{prop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="AC/HVAC">AC/HVAC</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Cleaning">Cleaning</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Urgency</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Low" />
                        </FormControl>
                        <FormLabel className="font-normal">Low</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Medium" />
                        </FormControl>
                        <FormLabel className="font-normal">Medium</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="High" />
                        </FormControl>
                        <FormLabel className="font-normal">High</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Please describe the issue in detail..." 
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="photoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Photo (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={(e) => {
                      field.onChange('uploaded-photo-mock-url');
                    }}
                  />
                </FormControl>
                <FormDescription>Upload a photo of the issue.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Issue'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
