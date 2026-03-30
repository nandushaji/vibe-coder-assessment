'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Upload } from 'lucide-react';
import { submitRefund } from '@/app/actions/refunds';

import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  bookingReference: z.string().min(3, 'Booking reference is required.'),
  bookingDate: z.date({
    message: 'A booking date is required.',
  }),
  refundReason: z.string().min(1, 'Please select a refund reason.'),
  additionalDetails: z.string().min(10, 'Please provide more details (at least 10 characters).'),
  fileUrl: z.string().optional(),
});

export default function RefundFormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<z.infer<typeof formSchema> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      bookingReference: '',
      additionalDetails: '',
      fileUrl: '',
    },
  });

  const bookingDate = form.watch('bookingDate');
  const isOutsideWindow = bookingDate ? differenceInDays(new Date(), bookingDate) > 90 : false;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // In a real app, handle file upload to S3/Supabase here and get URL
      // For this assessment, we'll just mock it or leave it empty
      const payload = {
        ...values,
        bookingDate: values.bookingDate.toISOString(),
      };
      
      const result = await submitRefund(payload);
      
      if (result.success) {
        setSuccessData(values);
      } else {
        console.error(result.errors);
        alert('Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successData) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800">Refund Request Submitted Successfully</CardTitle>
            <CardDescription>
              We have received your request and will review it shortly. Here is a summary of your submission:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-600 block">Full Name</span>
                <span>{successData.fullName}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600 block">Email</span>
                <span>{successData.email}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600 block">Booking Reference</span>
                <span>{successData.bookingReference}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600 block">Booking Date</span>
                <span>{format(successData.bookingDate, 'PPP')}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600 block">Reason</span>
                <span>{successData.refundReason}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-600 block">Additional Details</span>
                <p className="mt-1 whitespace-pre-wrap">{successData.additionalDetails}</p>
              </div>
            </div>
            <Button onClick={() => setSuccessData(null)} className="mt-6">Submit Another Request</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Guest Refund Request</h1>
        <p className="text-muted-foreground mt-2">
          Please fill out the form below to request a refund for your stay.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="bookingReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. BK-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bookingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>Booking Date</FormLabel>
                  <Popover>
                    <PopoverTrigger>
                      <div className="w-full">
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            type="button"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isOutsideWindow && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Notice:</strong> Your booking is outside the standard refund window (90 days). Your request will be reviewed on a case-by-case basis.
                  </p>
                </div>
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="refundReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Refund Reason</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Property Issue">Property Issue</SelectItem>
                    <SelectItem value="Booking Error">Booking Error</SelectItem>
                    <SelectItem value="Personal Reasons">Personal Reasons</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="additionalDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Details</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Please provide any relevant details about your request..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fileUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evidence / Photos (Optional)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="file" 
                      className="cursor-pointer"
                      onChange={(e) => {
                        // In a real app, upload file and set URL
                        // For now, we just pretend
                        field.onChange('uploaded-file-mock-url');
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription>Upload any relevant receipts or photos.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
