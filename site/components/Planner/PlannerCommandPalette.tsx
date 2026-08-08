"use client";

import { useEffect, useMemo, useState } from "react";
import { filterCommands, type PlannerCommand } from "@planner/lib/commands/registry";

type Props = {
  open: boolean;
  commands: readonly PlannerCommand[];
  onClose: () => void;
};

export function PlannerCommandPalette({ open, commands, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterCommands(commands, query), [commands, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="planner-command-palette" data-testid="planner-command-palette" role="dialog" aria-label="Command palette">
      <input
        className="input"
        autoFocus
        placeholder="Type a command…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="planner-command-query"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter" && filtered[0]) {
            filtered[0].run();
            onClose();
          }
        }}
      />
      <ul data-testid="planner-command-list">
        {filtered.map((cmd) => (
          <li key={cmd.id}>
            <button
              type="button"
              className="btn btn--sm"
              data-testid={`planner-command-${cmd.id}`}
              onClick={() => {
                cmd.run();
                onClose();
              }}
            >
              {cmd.label}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--sm" onClick={onClose} data-testid="planner-command-close">
        Close
      </button>
    </div>
  );
}
