import { Export, Layout, Ruler, Sparkle, type IconProps } from "@phosphor-icons/react";

export type PlannerLandingIcon = React.ComponentType<IconProps>;

export const PLANNER_LANDING_ICONS: Record<string, PlannerLandingIcon> = {
  measure: Ruler,
  catalog: Layout,
  export: Export,
  "ai-assist": Sparkle,
};
