"use client";
import { Button as AriaButton } from "react-aria-components";
import { TopBarShell } from "@studio/components/ui/StudioTopBarShell";
import { useStudioUIStore } from "@studio/store/studioUiStore";

const UnitPill = () => {
  const unit = useStudioUIStore((s) => s.unit);
  const setUnit = useStudioUIStore((s) => s.setUnit);
  return (
    <div className="topbar__unit" data-testid="top-unit">
      {(["mm", "cm", "m", "in"] as const).map((u) => (
        <AriaButton
          key={u}
          data-active={unit === u}
          onPress={() => setUnit(u)}
          data-testid={`top-unit-${u}`}
        >
          {u}
        </AriaButton>
      ))}
    </div>
  );
};

export const TopBar = () => <TopBarShell productLabel="Furniture Studio" unitPill={<UnitPill />} />;

export default TopBar;
