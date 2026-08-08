export type ExportMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  testId?: string;
};

export type ExportMenuSection = {
  id: string;
  heading?: string;
  items: ExportMenuItem[];
};

export function flattenExportSections(sections: ExportMenuSection[]): ExportMenuItem[] {
  return sections.flatMap((section) => section.items);
}
