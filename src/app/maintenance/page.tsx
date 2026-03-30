"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { submitMaintenanceTicket } from "@/app/actions/maintenance";
import { uploadMaintenancePhotoFile } from "@/app/actions/storage";
import { CheckCircle2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { FormWorkflowSection } from "@/components/form-workflow-section";

const formSchema = z.object({
  property: z.string().min(1, "Please select a property."),
  category: z.string().min(1, "Please select a category."),
  urgency: z.enum(["Low", "Medium", "High"], {
    message: "Please select an urgency level.",
  }),
  description: z
    .string()
    .min(10, "Please provide a detailed description (at least 10 characters)."),
});

const PROPERTIES = [
  "Sunset Apartments - Unit 101",
  "Oceanview Condos - Unit 4B",
  "Downtown Lofts - Penthouse",
  "Pine Ridge Townhomes - Unit 12",
  "Maple Street House",
];

export default function MaintenanceSubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property: "",
      category: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      let photoUrl: string | undefined;
      const file = photoInputRef.current?.files?.[0];
      if (file && file.size > 0) {
        const uploaded = await uploadMaintenancePhotoFile(file);
        if (!uploaded.success) {
          toast.error(uploaded.error ?? "Could not upload the photo.");
          return;
        }
        if (uploaded.url) photoUrl = uploaded.url;
      }

      const result = await submitMaintenanceTicket({
        ...values,
        ...(photoUrl ? { photoUrl } : {}),
      });
      if (result.success && result.ticketNumber) {
        setTicketNumber(result.ticketNumber);
      } else {
        toast.error("Could not submit the ticket. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (ticketNumber) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          eyebrow="Maintenance"
          title="Ticket created"
          description="Your request is in the queue. Share this ticket number with building staff or support if you need a follow-up."
        />
        <Card className="overflow-hidden rounded-2xl border border-border bg-card text-center shadow-[var(--elevation-2)]">
          <CardHeader className="border-b border-border/80 bg-success/35 pb-8 pt-10">
            <div className="mx-auto mb-5 flex size-[4.5rem] items-center justify-center rounded-2xl bg-card text-primary shadow-md ring-1 ring-border/60">
              <CheckCircle2 className="size-9" aria-hidden />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-success-foreground/90">
              Active ticket
            </p>
            <CardDescription className="mt-2 text-base leading-relaxed text-success-foreground/95">
              Save the number below. It appears on the operations dashboard for
              your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 bg-card/50 px-6 pt-10 pb-14 sm:px-10">
            <div className="rounded-xl border border-border/80 bg-card px-8 py-6 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ticket number
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-foreground">
                {ticketNumber}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  setTicketNumber(null);
                  form.reset();
                  if (photoInputRef.current) photoInputRef.current.value = "";
                }}
              >
                Submit another
              </Button>
              <Link
                href="/maintenance/dashboard"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "min-h-11 px-8 font-semibold"
                )}
              >
                Open dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Maintenance"
        title="Report an issue"
        description="Tell us which property is affected and what needs attention. You will receive a ticket number immediately after a successful submission."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-8">
          <FormWorkflowSection
            title="Property"
            description="Which unit or building is affected?"
          >
            <FormField
              control={form.control}
              name="property"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Property name</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROPERTIES.map((prop) => (
                        <SelectItem key={prop} value={prop}>
                          {prop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormWorkflowSection>

          <FormWorkflowSection
            title="Issue details"
            description="Category and how urgent it is."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Issue category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
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
                    <FormLabel required>Urgency</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        className="flex flex-wrap gap-4"
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
            <Separator className="my-2" />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail…"
                      className="min-h-[140px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormWorkflowSection>

          <FormWorkflowSection
            title="Photo"
            description="Optional — a picture can help the team prepare."
          >
            <FormItem>
              <FormLabel>Photo (optional)</FormLabel>
              <FormControl>
                <FileInput
                  ref={photoInputRef}
                  accept="image/*"
                  formValue=""
                  onChange={() => {}}
                />
              </FormControl>
              <FormDescription>
                Upload a photo of the issue (max 5 MB). Stored in Supabase
                Storage.
              </FormDescription>
            </FormItem>
          </FormWorkflowSection>

          <Button
            type="submit"
            size="lg"
            className="min-h-11 w-full px-8 font-semibold sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit issue"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
