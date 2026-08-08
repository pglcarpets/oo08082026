"use client";

import { useState } from "react";
import type { PlannerFurnitureBoq } from "@planner/lib/boq/types";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

type Props = {
  boq: PlannerFurnitureBoq;
  onClose: () => void;
};

export function PlannerHandoffDialog({ boq, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await browserApiFetch(apiPath("/api/Planner/handoff"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { name, email, phone, company: "", notes },
          boq: {
            projectId: boq.projectId,
            projectName: boq.projectName,
            calculationHash: boq.calculationHash,
            lines: boq.lines,
            subtotalInr: boq.subtotalInr,
            gstInr: boq.gstInr,
            totalInr: boq.totalInr,
          },
          idempotencyKey: `handoff-${boq.calculationHash.slice(0, 16)}-${name.trim()}`,
        }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        referenceId?: string;
        message?: string;
        error?: { message?: string };
      };
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message || body.message || `Handoff failed (${res.status})`);
      }
      setReferenceId(body.referenceId ?? "OK");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Handoff failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="planner-handoff" data-testid="planner-handoff-dialog" role="dialog" aria-label="Request quote">
      <header className="planner-handoff__head">
        <strong>Request quote</strong>
        <button type="button" className="btn btn--sm" onClick={onClose} data-testid="handoff-close">
          Close
        </button>
      </header>
      {referenceId ? (
        <p data-testid="handoff-success">Reference: {referenceId}</p>
      ) : (
        <>
          <label className="prop-row">
            <span className="prop-row__label">Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} data-testid="handoff-name" />
          </label>
          <label className="prop-row">
            <span className="prop-row__label">Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="handoff-email" />
          </label>
          <label className="prop-row">
            <span className="prop-row__label">Phone</span>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="handoff-phone" />
          </label>
          <label className="prop-row">
            <span className="prop-row__label">Notes</span>
            <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="handoff-notes" rows={2} />
          </label>
          {error ? <p className="planner-handoff__error" data-testid="handoff-error">{error}</p> : null}
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={busy || !name.trim()}
            onClick={() => void submit()}
            data-testid="handoff-submit"
          >
            {busy ? "Sending…" : "Submit handoff"}
          </button>
        </>
      )}
    </div>
  );
}
