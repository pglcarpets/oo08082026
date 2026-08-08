import { SITE_CONTACT } from "@/features/site/data/contact";

export type VisualIvrActionType = "contact" | "info" | "link";
export type VisualIvrIconId = "user" | "phone" | "info" | "arrow-right";

export type VisualIvrNode = {
  id: string;
  label: string;
  icon?: VisualIvrIconId;
  description?: string;
  options?: VisualIvrNode[];
  action?: {
    type: VisualIvrActionType;
    value: string;
    detail?: string;
  };
};

/**
 * Legacy visual-IVR tree. `/support-ivr` permanently redirects to `/service`.
 * Contact values must stay aligned with `SITE_CONTACT` — never invent phones.
 */
export const VISUAL_IVR_TREE: VisualIvrNode = {
  id: "root",
  label: "Main Menu",
  options: [
    {
      id: "sales",
      label: "Sales & Product Requests",
      icon: "user",
      description: "Request a quote or product information",
      options: [
        {
          id: "sales_de",
          label: "Domestic (India)",
          action: {
            type: "contact",
            value: SITE_CONTACT.salesPhone,
            detail: SITE_CONTACT.salesEmail,
          },
        },
        {
          id: "sales_int",
          label: "International Sales",
          action: {
            type: "contact",
            value: SITE_CONTACT.salesPhone,
            detail: SITE_CONTACT.salesEmail,
          },
        },
        {
          id: "dealer",
          label: "Find a Dealer",
          action: {
            type: "link",
            value: "/contact",
            detail: "Use our contact form",
          },
        },
      ],
    },
    {
      id: "support",
      label: "Customer Support",
      icon: "phone",
      description: "Help with existing orders or products",
      options: [
        {
          id: "order_status",
          label: "Order Status",
          action: {
            type: "info",
            value: "Please have your order confirmation number ready.",
          },
        },
        {
          id: "claims",
          label: "Complaints & Claims",
          action: {
            type: "contact",
            value: SITE_CONTACT.salesEmail,
            detail: "Attach photos for faster processing",
          },
        },
        {
          id: "spare_parts",
          label: "Spare Parts",
          action: {
            type: "link",
            value: "/products",
            detail: "Check product manuals first",
          },
        },
      ],
    },
    {
      id: "general",
      label: "General Inquiry",
      icon: "info",
      description: "Reception and general enquiries",
      options: [
        {
          id: "reception",
          label: "Reception / Switchboard",
          action: {
            type: "contact",
            value: SITE_CONTACT.supportPhone,
            detail: `${SITE_CONTACT.openingHours.replace("Mo-Sa", "Mon-Sat")  } IST`,
          },
        },
        {
          id: "careers",
          label: "Careers",
          action: {
            type: "link",
            value: "/career",
            detail: "View open positions",
          },
        },
        {
          id: "press",
          label: "Press & Marketing",
          action: {
            type: "contact",
            value: SITE_CONTACT.salesEmail,
          },
        },
      ],
    },
  ],
};
