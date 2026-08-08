"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CrmFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
};

export function CrmFormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: CrmFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function crmPageShell(embedded: boolean, viewClass: string): string {
  return embedded ? viewClass : "admin-page";
}

export function crmPageInner(embedded: boolean): string {
  return embedded
    ? "flex w-full flex-col gap-5 sm:gap-6"
    : "admin-page__body flex w-full max-w-7xl flex-col gap-8";
}
