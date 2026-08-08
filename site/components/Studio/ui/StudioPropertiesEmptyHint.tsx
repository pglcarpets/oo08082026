import { PanelEmptyState } from "@studio/components/ui/StudioPanelEmptyState";

export const PROPERTIES_EMPTY_TITLE = "Nothing selected";
export const PROPERTIES_EMPTY_BODY = "Click an object on the sheet to edit its properties.";

export function PropertiesEmptyHint() {
  return (
    <PanelEmptyState
      icon="cursor"
      title={PROPERTIES_EMPTY_TITLE}
      body={PROPERTIES_EMPTY_BODY}
      testId="properties-empty-hint"
    />
  );
}

export default PropertiesEmptyHint;
