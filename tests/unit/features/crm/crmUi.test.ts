import { describe, it, expect } from 'vitest';
import { crmUi, crmProjectStatus, crmQuoteStatusColumns } from '@/features/crm/crmUi';

describe('crmUi constants', () => {
  it('has correct classes defined in crmUi', () => {
    expect(crmUi.inverseTitle).toBe('text-strong');
    expect(crmUi.panelBorder).toBe('border-[color:var(--border-soft)]');
    expect(crmUi.modal).toContain('rounded-[2rem]');
    expect(crmUi.ghostDanger).toContain('hover:text-danger');
  });

  it('defines correct statuses in crmProjectStatus', () => {
    expect(crmProjectStatus.active.label).toBe('Active');
    expect(crmProjectStatus.active.dot).toBe('bg-[var(--color-success)]');

    expect(crmProjectStatus.completed.label).toBe('Completed');
    expect(crmProjectStatus.completed.badge).toContain('text-primary');

    expect(crmProjectStatus.archived.label).toBe('Archived');
    expect(crmProjectStatus.archived.badge).toContain('text-muted');

    expect(crmProjectStatus.on_hold.label).toBe('On Hold');
    expect(crmProjectStatus.on_hold.badge).toContain('text-warning');
  });

  it('defines correct quote columns in crmQuoteStatusColumns', () => {
    expect(crmQuoteStatusColumns).toHaveLength(4);

    const draft = crmQuoteStatusColumns.find((c) => c.value === 'draft');
    expect(draft?.label).toBe('Draft');
    expect(draft?.valueTone).toBe('text-muted');

    const sent = crmQuoteStatusColumns.find((c) => c.value === 'sent');
    expect(sent?.label).toBe('Sent');
    expect(sent?.valueTone).toBe('text-warning');

    const approved = crmQuoteStatusColumns.find((c) => c.value === 'approved');
    expect(approved?.label).toBe('Approved');
    expect(approved?.valueTone).toBe('text-success');

    const rejected = crmQuoteStatusColumns.find((c) => c.value === 'rejected');
    expect(rejected?.label).toBe('Rejected');
    expect(rejected?.valueTone).toBe('text-danger');
  });
});
