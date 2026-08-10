"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight, ChatCircleDots, ChatText, PhoneCall } from "@phosphor-icons/react";
import { buildWhatsAppHref, SITE_CONTACT, toTelHref } from "@/features/site/data/contact";
import {
  contactFormDefaultValues,
  contactFormSchema,
  type ContactFormValues,
} from "@/features/site/contact/customerQuerySchema";
import { submitContactAction } from "@/features/site/contact/submitContactAction";
import {
  trackContactSubmission,
  trackSiteCtaClick,
} from "@/lib/analytics/siteEvents";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

registerGsapPlugins();

interface DirectAction {
  type: string;
  label: string;
}

export function ContactTeaser() {
  const t = useTranslations("home");
  const pathname = usePathname() ?? "/";
  const sectionRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !sectionRef.current) {
        return;
      }

      const targets = sectionRef.current.querySelectorAll("[data-contact-teaser-reveal]");
      if (!targets.length) {
        return;
      }

      const ctx = gsap.context(() => {
        gsap.from(targets, {
          y: GSAP_SCROLL_REVEAL.y,
          opacity: GSAP_SCROLL_REVEAL.opacity,
          duration: GSAP_SCROLL_REVEAL.duration,
          stagger: GSAP_SCROLL_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 86%",
            once: true,
          },
        });
      }, sectionRef);

      return () => ctx.revert();
    },
    { scope: sectionRef, dependencies: [motionReady] },
  );

  /** City is UI-only; appended into `message` on submit (not in contactFormSchema). */
  const [city, setCity] = useState("");
  const [formStatus, setFormStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contactFormDefaultValues,
    mode: "onChange",
  });

  const watched = useWatch({ control: form.control });
  const briefLength = watched.message?.length ?? 0;

  const directActionsRaw = t.raw("contact.directActions") as DirectAction[];
  const directActions = directActionsRaw.map((action) => ({
    ...action,
    href:
      action.type === "whatsapp"
        ? buildWhatsAppHref("Need a direct workspace response for my project brief.")
        : toTelHref(SITE_CONTACT.supportPhone),
    icon: action.type === "whatsapp" ? ChatCircleDots : PhoneCall,
    external: action.type === "whatsapp",
  }));

  const hasContactChannel =
    (watched.email?.trim().length ?? 0) > 0 ||
    (watched.phone?.trim().length ?? 0) > 0;

  const canSubmit = useMemo(() => {
    return (
      (watched.name?.trim().length ?? 0) > 0 &&
      city.trim().length > 0 &&
      (watched.message?.trim().length ?? 0) > 0 &&
      hasContactChannel &&
      Boolean(watched.consent)
    );
  }, [
    city,
    hasContactChannel,
    watched.consent,
    watched.message,
    watched.name,
  ]);

  const showContactInvalid = formStatus.type === "error" && !hasContactChannel;
  const showConsentInvalid = formStatus.type === "error" && !watched.consent;

  const { executeAsync, isExecuting } = useAction(submitContactAction, {
    onSuccess: ({ data }) => {
      if (!data?.queryId) {
        return;
      }
      trackContactSubmission({
        pathname,
        surface: "contact-teaser",
        source: "homepage-quick-brief",
        status: "success",
      });
      form.reset(contactFormDefaultValues);
      setCity("");
      setFormStatus({
        type: "success",
        message: t("contact.status.success"),
      });
    },
    onError: () => {
      trackContactSubmission({
        pathname,
        surface: "contact-teaser",
        source: "homepage-quick-brief",
        status: "error",
      });
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setFormStatus({ type: "idle", message: "" });

    if (!city.trim()) {
      setFormStatus({
        type: "error",
        message: t("contact.status.errorCity"),
      });
      return;
    }

    if (!values.consent) {
      setFormStatus({
        type: "error",
        message: t("contact.status.errorConsent"),
      });
      return;
    }

    const trimmedEmail = values.email.trim();
    const trimmedPhone = values.phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      setFormStatus({
        type: "error",
        message: t("contact.status.errorChannel"),
      });
      return;
    }

    const preferredContact =
      trimmedEmail && trimmedPhone ? "any" : trimmedEmail ? "email" : "phone";

    try {
      const actionResult = await executeAsync({
        ...values,
        email: trimmedEmail,
        phone: trimmedPhone,
        preferredContact,
        message: `${values.message.trim()}\nCity: ${city.trim()}`,
        requirement: "Workspace planning",
        source: "homepage-quick-brief",
        sourcePath: pathname,
      });

      if (actionResult?.serverError) {
        setFormStatus({
          type: "error",
          message: actionResult.serverError,
        });
        return;
      }

      if (actionResult?.validationErrors) {
        setFormStatus({
          type: "error",
          message: t("contact.status.errorChannel"),
        });
        return;
      }

      if (!actionResult?.data?.queryId) {
        if (!actionResult?.data) {
          setFormStatus({
            type: "error",
            message: t("contact.status.errorGeneric"),
          });
        }
      }
    } catch {
      setFormStatus({
        type: "error",
        message: t("contact.status.errorGeneric"),
      });
    }
  }

  return (
    <section
      ref={sectionRef}
      id="contact"
      data-testid="home-contact-teaser"
      className="home-contact-band section-y-sm scroll-mt-24"
    >
      <div className="home-shell-xl">
        <div
          data-contact-teaser-reveal
          className="contact-teaser contact-teaser__shell"
        >
          <div className="contact-teaser__layout">
            <div className="contact-teaser__intro min-w-0">
              <h2 className="typ-subsection-title max-w-xl text-heading">
                {t("contact.titleLead")}{" "}
                <span className="text-accent-italic">
                  {t("contact.titleAccent")}
                </span>
              </h2>
              <p className="page-copy contact-teaser__subtitle text-muted">
                {t("contact.subtitle")}
              </p>
              <div className="contact-teaser__media">
                <Image
                  src={t("contact.image.src")}
                  alt={t("contact.image.alt")}
                  width={960}
                  height={720}
                  className="contact-teaser__img"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  loading="lazy"
                />
              </div>
            </div>

            <Form {...form}>
              <form
                data-contact-teaser-reveal
                aria-label="Project brief enquiry"
                className="contact-teaser__form min-w-0"
                onSubmit={form.handleSubmit(onSubmit)}
                data-testid="home-contact-teaser-form"
                noValidate
                toolname="submitHomepageBrief"
                tooldescription="Submit a short project brief from the homepage to One&Only. Requires name, city, message, consent, and either email or phone."
              >
                {/* Honeypot: hidden from humans; bots that autofill "website" are silently accepted without DB write. */}
                <div className="sr-only" aria-hidden="true">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <>
                        <label htmlFor="contact-teaser-website">Leave blank</label>
                        <input
                          {...field}
                          id="contact-teaser-website"
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          data-testid="contact-teaser-honeypot"
                          toolparamdescription="Anti-spam honeypot. Always leave empty."
                        />
                      </>
                    )}
                  />
                </div>
                <div className="contact-teaser__mini-grid">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="contact-teaser__field">
                        <FormLabel
                          htmlFor="contact-teaser-name"
                          className="contact-teaser__field-label typ-body-sm text-muted"
                        >
                          {t("contact.form.nameLabel")}
                        </FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            id="contact-teaser-name"
                            name="name"
                            className="contact-teaser__input"
                            type="text"
                            autoComplete="name"
                            required
                            maxLength={180}
                            placeholder={t("contact.form.namePlaceholder")}
                            toolparamdescription="Full name of the person making the enquiry."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* City is UI-only (not in contactFormSchema); appended into message on submit. */}
                  <div className="contact-teaser__field">
                    <label
                      className="contact-teaser__field-label typ-body-sm text-muted"
                      htmlFor="contact-teaser-city"
                    >
                      {t("contact.form.cityLabel")}
                    </label>
                    <input
                      id="contact-teaser-city"
                      name="city"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="contact-teaser__input"
                      type="text"
                      autoComplete="address-level2"
                      required
                      maxLength={120}
                      placeholder={t("contact.form.cityPlaceholder")}
                      toolparamdescription="City or metro where the workplace project will be installed."
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="contact-teaser__field">
                        <FormLabel
                          htmlFor="contact-teaser-phone"
                          className="contact-teaser__field-label typ-body-sm text-muted"
                        >
                          {t("contact.form.phoneLabel")}
                        </FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            id="contact-teaser-phone"
                            name="phone"
                            className="contact-teaser__input"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            maxLength={50}
                            placeholder={t("contact.form.phonePlaceholder")}
                            aria-invalid={showContactInvalid || undefined}
                            aria-describedby={
                              showContactInvalid
                                ? "contact-teaser-status"
                                : "contact-teaser-channel-hint"
                            }
                            toolparamdescription="Phone or WhatsApp number with country code. Provide email or phone (at least one required)."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="contact-teaser__field">
                        <FormLabel
                          htmlFor="contact-teaser-email"
                          className="contact-teaser__field-label typ-body-sm text-muted"
                        >
                          {t("contact.form.emailLabel")}
                        </FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            id="contact-teaser-email"
                            name="email"
                            className="contact-teaser__input"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            maxLength={180}
                            placeholder={t("contact.form.emailPlaceholder")}
                            aria-invalid={showContactInvalid || undefined}
                            aria-describedby={
                              showContactInvalid
                                ? "contact-teaser-status"
                                : "contact-teaser-channel-hint"
                            }
                            toolparamdescription="Work email. Provide email or phone (at least one required)."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p id="contact-teaser-channel-hint" className="contact-teaser__hint typ-body-sm text-muted">
                  {t("contact.form.channelHint")}
                </p>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="contact-teaser__field contact-teaser__field--brief">
                      <div className="flex items-center justify-between gap-2">
                        <FormLabel
                          htmlFor="contact-teaser-brief"
                          className="contact-teaser__field-label typ-body-sm text-muted"
                        >
                          {t("contact.form.briefLabel")}
                        </FormLabel>
                        <span className="typ-body-sm text-muted" aria-live="polite" aria-atomic="true">
                          {briefLength}/5000
                        </span>
                      </div>
                      <FormControl>
                        <textarea
                          {...field}
                          id="contact-teaser-brief"
                          name="message"
                          className="contact-teaser__input contact-teaser__input--textarea"
                          rows={2}
                          required
                          maxLength={5000}
                          placeholder={t("contact.form.briefPlaceholder")}
                          toolparamdescription="Short project brief: scope, headcount, products needed, and timeline."
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
                    <FormItem className="contact-teaser__field">
                      <label
                        htmlFor="contact-teaser-consent"
                        className="flex items-start gap-3 font-normal"
                      >
                        <input
                          id="contact-teaser-consent"
                          name="consent"
                          type="checkbox"
                          checked={Boolean(field.value)}
                          onChange={(event) => field.onChange(event.target.checked)}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                          aria-required="true"
                          aria-invalid={showConsentInvalid || undefined}
                          aria-describedby={
                            showConsentInvalid
                              ? "contact-teaser-status"
                              : "contact-teaser-consent-hint"
                          }
                          data-testid="contact-teaser-consent"
                          toolparamdescription="Must be true. Confirms consent for One&Only to use contact details to respond."
                        />
                        <span>
                          {t("contact.form.consentText")}{" "}
                          <a href="/privacy/" className="font-semibold text-primary hover:text-primary-hover">
                            {t("contact.form.consentLink")}
                          </a>
                          <span className="text-primary"> *</span>
                        </span>
                      </label>
                      <p id="contact-teaser-consent-hint" className="contact-teaser__hint typ-body-sm text-muted">
                        {t("contact.form.consentHint")}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="contact-teaser__cta-stack">
                  <button
                    type="submit"
                    disabled={!canSubmit || isExecuting}
                    className="contact-teaser__cta contact-teaser__cta--primary disabled:cursor-not-allowed disabled:opacity-60"
                    data-testid="home-contact-teaser-submit"
                  >
                    <ChatText size={16} weight="duotone" aria-hidden="true" />
                    <span>{isExecuting ? t("contact.form.submittingLabel") : t("contact.form.submitLabel")}</span>
                  </button>

                  {directActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <a
                        key={action.label}
                        href={action.href}
                        target={action.external ? "_blank" : undefined}
                        rel={action.external ? "noopener noreferrer" : undefined}
                        className={`contact-teaser__cta${
                          action.type === "whatsapp" ? " contact-teaser__cta--whatsapp" : ""
                        }`}
                        onClick={() =>
                          trackSiteCtaClick({
                            href: action.href,
                            label: action.label,
                            pathname,
                            surface: "contact-teaser",
                          })
                        }
                      >
                        <span className="contact-teaser__cta-icon">
                          <Icon size={16} weight="duotone" aria-hidden="true" />
                        </span>
                        <span>{action.label}</span>
                        <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
                      </a>
                    );
                  })}
                </div>

                {formStatus.type !== "idle" ? (
                  <p
                    id="contact-teaser-status"
                    className={`contact-teaser__status contact-teaser__status--${formStatus.type}`}
                    role={formStatus.type === "error" ? "alert" : "status"}
                  >
                    {formStatus.message}
                  </p>
                ) : null}
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
