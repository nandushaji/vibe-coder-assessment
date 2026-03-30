"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { submitRefund } from "@/app/actions/refunds";
import { uploadRefundEvidenceFile } from "@/app/actions/storage";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileInput } from "@/components/ui/file-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { FormWorkflowSection } from "@/components/form-workflow-section";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  bookingReference: z.string().min(3, "Booking reference is required."),
  bookingDate: z.date({
    message: "A booking date is required.",
  }),
  refundReason: z.string().min(1, "Please select a refund reason."),
  additionalDetails: z
    .string()
    .min(10, "Please provide more details (at least 10 characters)."),
});

const REFUND_WINDOW_WARNING =
  "Your booking is outside the standard refund window. Your request will be reviewed on a case-by-case basis.";

type RefundReceipt = {
  values: z.infer<typeof formSchema>;
  evidenceUrl?: string;
  evidenceName?: string;
};

export default function RefundFormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<RefundReceipt | null>(null);
  const [bookingDatePopoverOpen, setBookingDatePopoverOpen] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      bookingReference: "",
      refundReason: "",
      additionalDetails: "",
    },
  });

  const bookingDate = form.watch("bookingDate");
  const isOutsideWindow = bookingDate
    ? differenceInDays(new Date(), bookingDate) > 90
    : false;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      let evidenceUrl: string | undefined;
      let evidenceName: string | undefined;
      const file = evidenceInputRef.current?.files?.[0];
      if (file && file.size > 0) {
        const uploaded = await uploadRefundEvidenceFile(file);
        if (!uploaded.success) {
          toast.error(uploaded.error ?? "Could not upload your file.");
          return;
        }
        if (uploaded.url) {
          evidenceUrl = uploaded.url;
          evidenceName = file.name;
        }
      }

      const result = await submitRefund({
        fullName: values.fullName,
        email: values.email,
        bookingReference: values.bookingReference,
        bookingDate: values.bookingDate.toISOString(),
        refundReason: values.refundReason,
        additionalDetails: values.additionalDetails,
        ...(evidenceUrl ? { fileUrl: evidenceUrl } : {}),
      });

      if (result.success) {
        setReceipt({
          values,
          evidenceUrl,
          evidenceName,
        });
      } else {
        toast.error("We could not submit your request. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (receipt) {
    const { values: successData, evidenceUrl, evidenceName } = receipt;
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          eyebrow="Confirmation"
          title="Request submitted"
          description="Keep this summary for your records. We will email you at the address you provided if we need anything else."
        />
        <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--elevation-2)]">
          <CardHeader className="border-b border-border/80 bg-success/35 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-success-foreground/90">
              Submission receipt
            </p>
            <CardDescription className="mt-2 text-base leading-relaxed text-success-foreground/95">
              Below is the information we recorded. Reference it if you follow up
              with our team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 bg-card/50 px-6 py-8 sm:px-8">
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-muted-foreground">Full name</dt>
                <dd className="mt-0.5 text-foreground">{successData.fullName}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Email</dt>
                <dd className="mt-0.5 text-foreground">{successData.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Booking reference
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {successData.bookingReference}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Booking date</dt>
                <dd className="mt-0.5 text-foreground">
                  {format(successData.bookingDate, "PPP")}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-muted-foreground">
                  Refund reason
                </dt>
                <dd className="mt-0.5 text-foreground">{successData.refundReason}</dd>
              </div>
            </dl>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Additional details
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {successData.additionalDetails}
              </p>
            </div>
            {evidenceUrl ? (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Attachment
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {evidenceName ?? "Uploaded file"}
                  </p>
                  <a
                    href={evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open uploaded file
                  </a>
                </div>
              </>
            ) : null}
            <Button
              type="button"
              onClick={() => {
                setReceipt(null);
                form.reset();
                if (evidenceInputRef.current) evidenceInputRef.current.value = "";
              }}
              className="w-full sm:w-auto"
            >
              Submit another request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Refunds"
        title="Guest refund request"
        description="Complete each section below. Required fields must be filled before you can submit — you will receive an on-screen confirmation with everything you sent."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-8">
          <FormWorkflowSection
            title="Guest details"
            description="How we can reach you about this request."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="As on the booking" {...field} />
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
                    <FormLabel required>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormWorkflowSection>

          <FormWorkflowSection
            title="Booking"
            description="Match the details from your reservation."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="bookingReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Booking reference</FormLabel>
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
                  <FormItem className="flex flex-col">
                    <FormLabel required>Booking date</FormLabel>
                    {/* One wrapper so Base UI focus guards (siblings of the trigger when open)
                        stay inside this div; otherwise space-y-2 on FormItem adds margin above
                        the button and the card appears to jump. */}
                    <div className="w-full min-w-0">
                      <Popover
                        open={!!bookingDatePopoverOpen}
                        onOpenChange={(next) =>
                          setBookingDatePopoverOpen(Boolean(next))
                        }
                      >
                        <FormControl>
                          <PopoverTrigger
                            className={cn(
                              buttonVariants({ variant: "outline", size: "default" }),
                              "h-11 min-h-11 w-full justify-start gap-2 rounded-xl pl-3.5 text-left text-sm font-normal shadow-[0_1px_2px_rgba(60,64,67,0.08)]",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </span>
                            <CalendarIcon className="size-4 shrink-0 opacity-50" />
                          </PopoverTrigger>
                        </FormControl>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setBookingDatePopoverOpen(false);
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isOutsideWindow ? (
              <Alert
                className="border-warning/60 bg-warning text-warning-foreground [&_svg]:text-warning-foreground"
                role="status"
              >
                <TriangleAlert className="size-4" aria-hidden />
                <AlertTitle>Refund window</AlertTitle>
                <AlertDescription className="text-warning-foreground/95">
                  {REFUND_WINDOW_WARNING}
                </AlertDescription>
              </Alert>
            ) : null}
          </FormWorkflowSection>

          <FormWorkflowSection
            title="Reason & details"
            description="Help us understand what happened."
          >
            <FormField
              control={form.control}
              name="refundReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Refund reason</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Property Issue">Property Issue</SelectItem>
                      <SelectItem value="Booking Error">Booking Error</SelectItem>
                      <SelectItem value="Personal Reasons">
                        Personal Reasons
                      </SelectItem>
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
                  <FormLabel required>Additional details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your request…"
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormWorkflowSection>

          <FormWorkflowSection
            title="Attachments"
            description="Optional — receipts or photos that support your request."
          >
            <FormItem>
              <FormLabel>Evidence / photos (optional)</FormLabel>
              <FormControl>
                <FileInput
                  ref={evidenceInputRef}
                  formValue=""
                  onChange={() => {}}
                />
              </FormControl>
              <FormDescription>
                Upload any relevant receipts or photos (max 5 MB). Files are
                stored in Supabase Storage.
              </FormDescription>
            </FormItem>
          </FormWorkflowSection>

          <Button
            type="submit"
            size="lg"
            className="min-h-11 w-full px-8 font-semibold sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit refund request"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
