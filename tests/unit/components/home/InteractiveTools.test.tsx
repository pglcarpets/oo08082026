import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InteractiveTools } from '@/components/home/InteractiveTools';

vi.mock('@/components/home/PlannerToolsShowcase', () => ({
  PlannerToolsShowcase: (props: {
    title: { lead: string; accent: string };
    kicker: string;
    primaryCta: { label: string; href: string };
    demoAriaLabel?: string;
  }) => (
    <div data-testid="mock-tools-showcase">
      <span>Title: {props.title.lead} - {props.title.accent}</span>
      <span>Kicker: {props.kicker}</span>
      <span>CTA: {props.primaryCta.label} ({props.primaryCta.href})</span>
      <span>Demo aria: {props.demoAriaLabel ?? ''}</span>
    </div>
  )
}));

describe('InteractiveTools Component', () => {
  it('renders PlannerToolsShowcase delegate with correct props', () => {
    render(<InteractiveTools />);

    expect(screen.getByTestId('mock-tools-showcase')).toBeInTheDocument();
    expect(screen.getByText('Title: Design your - workspace')).toBeInTheDocument();
    expect(screen.getByText('Kicker: Workspace planning')).toBeInTheDocument();
    expect(screen.getByText(/Launch planner/)).toBeInTheDocument();
  });

  it('Launch planner CTA targets planner marketing landing', () => {
    render(<InteractiveTools />);
    expect(
      screen.getByText('CTA: Launch planner (/planner)'),
    ).toBeInTheDocument();
  });

  it('exposes floor-plan demo accessible name for nav smoke', () => {
    render(<InteractiveTools />);
    expect(
      screen.getByText('Demo aria: Example 10 by 8 metre office floor plan'),
    ).toBeInTheDocument();
  });
});
