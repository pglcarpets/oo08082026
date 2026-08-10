"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { CONTACT_FORM_CONTEXT_COPY } from "@/features/site/data/routeCopy";
import { trackContactSubmission } from "@/lib/analytics/siteEvents";
import { submitContactAction } from "@/features/site/contact/submitContactAction";
import {
  contactFormDefaultValues,
  contactFormSchema,
  type ContactFormValues,
} from "@/features/site/contact/customerQuerySchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SubmitResult = {
  queryId: string;
  followUp: {
    email: string | null;
    whatsapp: string | null;
  };
};

const PRIMARY_QUOTE_PHONE_DISPLAY = "+91 98356 30940";
const PRIMARY_QUOTE_PHONE_LINK = "tel:+919835630940";

type CustomerQueryFormProps = {
  intent?: string | null;
  source?: string | null;
};

export function CustomerQueryForm({ intent, source }: CustomerQueryFormProps) {
  const pathname = usePathname();
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const contextCopy =
    intent === "quote" && source === "compare"
      ? CONTACT_FORM_CONTEXT_COPY.quote.compare
      : intent === "quote" && source === "quote-cart"
        ? CONTACT_FORM_CONTEXT_COPY.quote["quote-cart"]
        : null;

  const sourcePath = useMemo(() => {
    return contextCopy
      ? `${pathname}?intent=${intent}&source=${source}`
      : pathname;
  }, [contextCopy, intent, pathname, source]);

  const trackingSource = contextCopy
    ? `website-contact-${source}`
    : "website-contact";

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contactFormDefaultValues,
    mode: "onChange",
  });

  const watched = useWatch({ control: form.control });
  const canSubmit = useMemo(() => {
    return (
      (watched.name?.trim().length ?? 0) > 0 &&
      (watched.message?.trim().length ?? 0) > 0 &&
      ((watched.email?.trim().length ?? 0) > 0 ||
        (watched.phone?.trim().length ?? 0) > 0) &&
      Boolean(watched.consent)
    );
  }, [watched.consent, watched.email, watched.message, watched.name, watched.phone]);

  const { executeAsync, isExecuting } = useAction(submitContactAction, {
    onSuccess: ({ data }) => {
      if (!data?.queryId || !data.followUp) {
        return;
      }
      trackContactSubmission({
        pathname,
        surface: "contact-page-form",
        source: trackingSource,
        status: "success",
      });
      setResult({ queryId: data.queryId, followUp: data.followUp });
      form.reset(contactFormDefaultValues);
    },
    onError: () => {
      trackContactSubmission({
        pathname,
        surface: "contact-page-form",
        source: trackingSource,
        status: "error",
      });
    },
  });

  useEffect(() => {
    if (!contextCopy) {
      return;
    }

    const current = form.getValues("message");
    if (current.trim().length > 0) {
      return;
    }
    form.setValue("message", contextCopy.seededMessage, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [contextCopy, form]);

  async function onSubmit(values: ContactFormValues) {
    setError("");
    setResult(null);

    try {
      const actionResult = await executeAsync({
        ...values,
        requirement: contextCopy?.requirement,
        source: trackingSource,
        sourcePath,
      });

      if (actionResult?.serverError) {
        setError(actionResult.serverError);
        return;
      }

      if (actionResult?.validationErrors) {
        setError("Add name, message, and at least email or phone.");
        return;
      }

      if (!actionResult?.data?.queryId || !actionResult.data.followUp) {
        // Success path normally handled in onSuccess; empty data is an error.
        if (!actionResult?.data) {
          setError("Unable to submit right now.");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }

  const hasContactChannel =
    (watched.email?.trim().length ?? 0) > 0 ||
    (watched.phone?.trim().length ?? 0) > 0;
  const showNameInvalid = Boolean(error) && (watched.name?.trim().length ?? 0) === 0;
  const showMessageInvalid =
    Boolean(error) && (watched.message?.trim().length ?? 0) === 0;
  const showContactInvalid = Boolean(error) && !hasContactChannel;
  const showConsentInvalid = Boolean(error) && !watched.consent;

  return (
    <Form {...form}>
      <form
        className="contact-page-form"
        data-testid="contact-page-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        toolname="submitContactEnquiry"
        tooldescription="Submit a workplace furniture project enquiry to One&Only sales. Requires name, message, consent, and either email or phone."
      >
        {contextCopy ? (
          <div className="contact-form-context">
            <p className="typ-label text-brand">{contextCopy.eyebrow}</p>
            <p className="contact-form-context__title">{contextCopy.title}</p>
            <p className="contact-form-context__copy">{contextCopy.description}</p>
          </div>
        ) : null}
        <p className="contact-form-intro" id="contact-form-intro">
          Fields marked <span className="font-semibold text-primary">*</span> are
          required. Share either email or phone and we will respond within 1
          business day.
        </p>

        {/* Honeypot: hidden from humans; bots that autofill "website" are silently accepted without DB write. */}
        <div className="sr-only" aria-hidden="true">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <>
                <label htmlFor="contact-website">Leave blank</label>
                <input
                  {...field}
                  id="contact-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  data-testid="contact-form-honeypot"
                  toolparamdescription="Anti-spam honeypot. Always leave empty."
                />
              </>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="contact-page-form__field">
              <FormLabel htmlFor="name" className="contact-form-label">
                Name <span className="text-primary">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your Name"
                  className="contact-form-input"
                  required
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={showNameInvalid || undefined}
                  aria-describedby={
                    showNameInvalid ? "contact-form-error" : "contact-form-intro"
                  }
                  toolparamdescription="Full name of the person making the enquiry."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem className="contact-page-form__field">
              <FormLabel htmlFor="company" className="contact-form-label">
                Company
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Company Name (optional)"
                  className="contact-form-input"
                  autoComplete="organization"
                  toolparamdescription="Optional company or organisation name."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="contact-page-form__row">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="contact-page-form__field">
                <FormLabel htmlFor="email" className="contact-form-label">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    className="contact-form-input"
                    autoComplete="email"
                    aria-invalid={showContactInvalid || undefined}
                    aria-describedby={
                      showContactInvalid
                        ? "contact-form-error"
                        : "contact-form-intro"
                    }
                    toolparamdescription="Work email. Provide email or phone (at least one required)."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="contact-page-form__field">
                <FormLabel htmlFor="phone" className="contact-form-label">
                  Phone / WhatsApp
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91..."
                    className="contact-form-input"
                    autoComplete="tel"
                    aria-invalid={showContactInvalid || undefined}
                    aria-describedby={
                      showContactInvalid
                        ? "contact-form-error"
                        : "contact-form-intro"
                    }
                    toolparamdescription="Phone or WhatsApp number with country code. Provide email or phone (at least one required)."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preferredContact"
          render={({ field }) => (
            <FormItem className="contact-page-form__field">
              <FormLabel
                htmlFor="preferredContact"
                className="contact-form-label"
              >
                Preferred Contact
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  id="preferredContact"
                  name="preferredContact"
                  className={cn("contact-form-input")}
                  toolparamdescription="Preferred follow-up channel: any, email, whatsapp, or phone."
                >
                  <option value="any">Any</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="contact-page-form__field">
              <FormLabel htmlFor="message" className="contact-form-label">
                Message <span className="text-primary">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  id="message"
                  name="message"
                  placeholder="What do you need for your workspace?"
                  rows={4}
                  className="contact-form-input"
                  required
                  aria-required="true"
                  aria-invalid={showMessageInvalid || undefined}
                  aria-describedby={
                    showMessageInvalid
                      ? "contact-form-error"
                      : "contact-form-intro"
                  }
                  toolparamdescription="Project brief: city, headcount, product needs, timeline, and any constraints."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="contact-page-form__field">
              <label htmlFor="contact-consent" className="contact-form-consent">
                <input
                  id="contact-consent"
                  name="consent"
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                  aria-required="true"
                  aria-invalid={showConsentInvalid || undefined}
                  aria-describedby={
                    showConsentInvalid
                      ? "contact-form-error"
                      : "contact-consent-hint"
                  }
                  data-testid="contact-form-consent"
                  toolparamdescription="Must be true. Confirms consent for One&Only to use contact details to respond."
                />
                <span>
                  I agree that One&Only may use these details to respond to my
                  enquiry.{" "}
                  <a
                    href="/privacy/"
                    className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
                  >
                    Privacy policy
                  </a>
                  <span className="text-primary"> *</span>
                </span>
              </label>
              <p id="contact-consent-hint" className="contact-form-intro">
                Required to send. We do not sell contact data.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {error ? (
          <p id="contact-form-error" role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="contact-form-success" role="status">
            <p>
              Query submitted. Reference:{" "}
              <span className="font-medium">{result.queryId}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {result.followUp.email ? (
                <a
                  href={result.followUp.email}
                  className="contact-form-success__action"
                >
                  Reply by Email
                </a>
              ) : null}
              {result.followUp.whatsapp ? (
                <a
                  href={result.followUp.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-form-success__action"
                >
                  Reply on WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="contact-page-form__field">
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit || isExecuting}
            className="w-full disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="contact-form-submit"
          >
            {isExecuting
              ? "Sending..."
              : "Send - we respond within 1 business day"}
          </Button>
          <p className="contact-form-intro">
            Prefer to speak now?{" "}
            <a
              href={PRIMARY_QUOTE_PHONE_LINK}
              className="font-semibold text-primary hover:text-primary-hover"
            >
              Call {PRIMARY_QUOTE_PHONE_DISPLAY}
            </a>
            .
          </p>
        </div>
      </form>
    </Form>
  );
}
