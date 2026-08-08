"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logClientError } from "@/lib/errorLogger";

interface SiteErrorBoundaryProps {
  children: ReactNode;
}

interface SiteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SiteErrorBoundary extends Component<
  SiteErrorBoundaryProps,
  SiteErrorBoundaryState
> {
  constructor(props: SiteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SiteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void logClientError({
      error,
      label: "site-layout-global",
      componentStack: info?.componentStack ?? "",
    });
  }

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-ocean-boat-blue-900)] to-[var(--color-ocean-boat-blue-850)] p-6 text-white font-sans">
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[color:var(--overlay-panel-08)] p-8 text-center shadow-2xl backdrop-blur-xl border border-white/10">
          {/* Decorative glowing background elements */}
          <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-warning/10 blur-3xl" />

          {/* Error Illustration Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 text-warning mb-6">
            <svg
              className="h-8 w-8 text-warning"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Something went wrong
          </h1>
          <p className="mt-4 text-sm text-white/70 leading-relaxed">
            Our systems encountered an unexpected error while rendering this page.
            Don't worry, your progress and session details remain intact.
          </p>

          {this.state.error?.message && (
            <div className="mt-4 rounded-xl bg-black/30 p-3 text-start font-mono text-xs text-white/50 border border-white/5 max-h-32 overflow-auto">
              <code>{this.state.error.message}</code>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-xl bg-background px-5 py-3 text-sm font-semibold text-[var(--color-ocean-boat-blue-900)] transition-all hover:bg-background/90 active:scale-[0.98] shadow-md shadow-white/5"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center rounded-xl bg-[color:var(--overlay-panel-10)] px-5 py-3 text-sm font-semibold text-white/90 transition-all hover:bg-[color:var(--overlay-panel-12)] active:scale-[0.98] border border-white/10"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }
}
