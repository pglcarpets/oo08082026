"use client";

import { Button } from "@/components/ui/Button";
import {
  AdminCheckbox,
  AdminField,
  AdminFieldGroup,
  AdminNumberInput,
  AdminTextInput,
} from "../ui/AdminFormFields";
import {
  defaultWorkstationAuthorDraft,
  releaseWorkstationAuthorDraft,
  workstationAuthorFromJson,
  workstationJsonFromAuthor,
  type WorkstationAuthorDraft,
} from "./workstationFamilyAuthor";
import { requiresMigrationChoice } from "./workstationFamilyRelease";
import type { WorkstationFamilyContract } from "./workstationFamilyContract";

type Props = {
  readonly workstationJson: string;
  readonly readOnly?: boolean;
  readonly onWorkstationJsonChange: (next: string) => void;
};

function toggleNumber(list: readonly number[], value: number, enabled: boolean): number[] {
  if (enabled) {return [...list, value].sort((a, b) => a - b);}
  return list.filter((entry) => entry !== value);
}

export function WorkstationFamilyAuthorFields({
  workstationJson,
  readOnly,
  onWorkstationJsonChange,
}: Props) {
  const draft = workstationJson.trim()
    ? workstationAuthorFromJson(workstationJson)
    : defaultWorkstationAuthorDraft();

  let embeddedContract: WorkstationFamilyContract | null = null;
  try {
    const parsed = JSON.parse(workstationJson) as {
      oandoWorkstationFamily?: WorkstationFamilyContract;
    };
    if (parsed.oandoWorkstationFamily?.type === "oando-workstation-family") {
      embeddedContract = parsed.oandoWorkstationFamily;
    }
  } catch {
    embeddedContract = null;
  }

  const needsMigration =
    embeddedContract !== null &&
    requiresMigrationChoice(embeddedContract, draft.versionId);

  const commit = (next: WorkstationAuthorDraft) => {
    onWorkstationJsonChange(workstationJsonFromAuthor(next));
  };

  return (
    <AdminFieldGroup title="Workstation family (structured)">
      <AdminField label="Family slug">
        <AdminTextInput
          value={draft.familySlug}
          disabled={readOnly}
          onChange={(event) => commit({ ...draft, familySlug: event.target.value })}
        />
      </AdminField>
      <div className="admin-grid-2">
        <AdminField label="Version id">
          <AdminTextInput
            value={draft.versionId}
            disabled={readOnly}
            onChange={(event) => commit({ ...draft, versionId: event.target.value })}
          />
        </AdminField>
        <AdminField label="Effective from">
          <AdminTextInput
            value={draft.effectiveFrom}
            disabled={readOnly}
            onChange={(event) => commit({ ...draft, effectiveFrom: event.target.value })}
          />
        </AdminField>
      </div>

      <div className="admin-stack--tight">
        <p className="admin-type-subsection">Topologies</p>
        <AdminCheckbox
          checked={draft.linear2Seat}
          disabled={readOnly}
          label="2-seat linear"
          onChange={(checked) => commit({ ...draft, linear2Seat: checked })}
        />
        <AdminCheckbox
          checked={draft.lShape4Seat}
          disabled={readOnly}
          label="4-seat L-shape"
          onChange={(checked) => commit({ ...draft, lShape4Seat: checked })}
        />
      </div>

      <div className="admin-stack--tight">
        <p className="admin-type-subsection">Options</p>
        <AdminCheckbox
          checked={draft.panelOption}
          disabled={readOnly}
          label="Privacy panel"
          onChange={(checked) => commit({ ...draft, panelOption: checked })}
        />
        <AdminCheckbox
          checked={draft.pedestalOption}
          disabled={readOnly}
          label="Pedestal storage"
          onChange={(checked) => commit({ ...draft, pedestalOption: checked })}
        />
      </div>

      <div className="admin-stack--tight">
        <p className="admin-type-subsection">Length options (mm)</p>
        {[900, 1200, 1500].map((lengthMm) => (
          <AdminCheckbox
            key={lengthMm}
            checked={draft.lengthOptions.includes(lengthMm)}
            disabled={readOnly}
            label={`${lengthMm} mm`}
            onChange={(checked) =>
              commit({
                ...draft,
                lengthOptions: toggleNumber(draft.lengthOptions, lengthMm, checked),
              })
            }
          />
        ))}
      </div>

      <div className="admin-stack--tight">
        <p className="admin-type-subsection">Depth options (mm)</p>
        {[600, 750].map((depthMm) => (
          <AdminCheckbox
            key={depthMm}
            checked={draft.depthOptions.includes(depthMm)}
            disabled={readOnly}
            label={`${depthMm} mm`}
            onChange={(checked) =>
              commit({
                ...draft,
                depthOptions: toggleNumber(draft.depthOptions, depthMm, checked),
              })
            }
          />
        ))}
      </div>

      <AdminField label="Height (mm)">
        <AdminNumberInput
          value={String(draft.heightMm)}
          disabled={readOnly}
          onChange={(event) =>
            commit({ ...draft, heightMm: Math.max(1, Number(event.target.value) || draft.heightMm) })
          }
        />
      </AdminField>

      {needsMigration ? (
        <div className="admin-stack--tight">
          <p className="admin-type-subsection">Version migration</p>
          <AdminCheckbox
            checked={draft.migrationChoice === "append"}
            disabled={readOnly}
            label="Append new version (keep prior released)"
            onChange={(checked) => {
              if (checked) {commit({ ...draft, migrationChoice: "append" });}
            }}
          />
          <AdminCheckbox
            checked={draft.migrationChoice === "replace"}
            disabled={readOnly}
            label="Replace active version (explicit migration)"
            onChange={(checked) => {
              if (checked) {commit({ ...draft, migrationChoice: "replace" });}
            }}
          />
        </div>
      ) : null}

      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={readOnly}
        onClick={() => {
          const result = releaseWorkstationAuthorDraft(draft, workstationJson);
          if (result.ok) {onWorkstationJsonChange(result.json);}
        }}
      >
        Release version
      </Button>
    </AdminFieldGroup>
  );
}
