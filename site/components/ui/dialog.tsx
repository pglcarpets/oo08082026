"use client";

import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";

import { cn } from "@/lib/utils";

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

/** FOCSS modal shell (React Aria). API matches prior Dialog open/onOpenChange. */
function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <AriaModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable
      className="admin-dialog-scrim"
    >
      {children}
    </AriaModalOverlay>
  );
}

function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <AriaModal className={cn("admin-dialog", className)}>
      <AriaDialog className="admin-dialog__panel outline-none">{children}</AriaDialog>
    </AriaModal>
  );
}

function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("admin-dialog__header", className)}>{children}</div>;
}

function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Heading slot="title" className={cn("admin-dialog__title", className)}>
      {children}
    </Heading>
  );
}

function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={cn("admin-dialog__description", className)}>{children}</p>;
}

export { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle };
