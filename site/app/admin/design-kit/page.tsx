import type { Metadata } from "next";

import DesignKitPageView from "@/features/admin/design-kit/DesignKitPageView";

/** Design-kit styles only on this route — not on every admin page. */
import "@focss/admin/components/design-kit.css";

export const metadata: Metadata = {
  title: "Design Kit",
  description: "Living visual contract — materials, primitives, and density reference.",
};

export default function AdminDesignKitPage() {
  return <DesignKitPageView />;
}
