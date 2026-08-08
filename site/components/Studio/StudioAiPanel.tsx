"use client";
import React, { useState } from "react";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";
import { api } from "@studio/lib/studioApi";
import { useStudioUIStore } from "@studio/store/studioUiStore";

const PROMPT_EXAMPLES = [
  "modern task chair 600x600x950mm with 5 wheel base",
  "L-shaped executive desk 1800x1600x750mm",
  "round meeting table for 6 people, diameter 1200mm",
  "3-seat lounge sofa 2200x900x850mm",
  "phone booth, 1000x1000x2200mm",
];

type AiPanelProps = {
  onGenerate?: (prompt: string) => void | Promise<void>;
  onSuggest?: () => void | Promise<void>;
  onRestyle?: () => void | Promise<void>;
  hasSelection?: boolean;
  hasSvg?: boolean;
  generating?: boolean;
};

export const AiPanel = ({ onGenerate, onSuggest, onRestyle, hasSelection: _hasSelection, hasSvg, generating }: AiPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const [tab, setTab] = useState("generate");
  const showToast = useStudioUIStore((s) => s.showToast);

  const doGenerate = async () => {
    if (!prompt.trim()) { showToast("Enter a prompt", "error"); return; }
    try { await onGenerate?.(prompt); }
    catch (e: unknown) { showToast(`AI error: ${e instanceof Error ? e.message : String(e)}`, "error"); }
  };

  return (
    <div className="ai-panel" data-testid="ai-panel">
      <div className="segmented" style={{ width: "100%", justifyContent: "stretch" }}>
        <button style={{ flex: 1 }} data-active={tab === "generate"} onClick={() => setTab("generate")} data-testid="ai-tab-generate">Generate</button>
        <button style={{ flex: 1 }} data-active={tab === "suggest"} onClick={() => setTab("suggest")} data-testid="ai-tab-suggest">Suggest</button>
        <button style={{ flex: 1 }} data-active={tab === "restyle"} onClick={() => setTab("restyle")} data-testid="ai-tab-restyle">Restyle</button>
      </div>

      {tab === "generate" && (
        <>
          <textarea
            className="input ai-prompt"
            placeholder="Describe furniture. e.g. modern task chair 600×600×950mm…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            data-testid="ai-prompt"
            rows={3}
          />
          <div className="ai-examples">
            {PROMPT_EXAMPLES.map((ex) => (
              <button key={ex} className="chip" onClick={() => setPrompt(ex)} data-testid="ai-example">{ex.split(",")[0].slice(0, 32)}</button>
            ))}
          </div>
          <button className="btn btn--primary" onClick={doGenerate} disabled={generating || !prompt.trim()} data-testid="ai-generate" style={{ width: "100%", justifyContent: "center" }}>
            {generating ? <span className="spin">Generating…</span> : <><PhIcon name="gear" size={16} /> Generate onto canvas</>}
          </button>
        </>
      )}

      {tab === "suggest" && (
        <>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Analyse the current drawing and infer name, category, and real-world dimensions.</div>
          <button className="btn btn--primary" onClick={onSuggest} disabled={generating || !hasSvg} data-testid="ai-suggest" style={{ width: "100%", justifyContent: "center" }}>
            {generating ? "Thinking…" : "AI suggest metadata"}
          </button>
          {!hasSvg && <div className="ai-hint">Draw something first.</div>}
        </>
      )}

      {tab === "restyle" && (
        <>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Clean up geometry, simplify, straighten edges.</div>
          <button className="btn btn--primary" onClick={onRestyle} disabled={generating || !hasSvg} data-testid="ai-restyle" style={{ width: "100%", justifyContent: "center" }}>
            {generating ? "Restyling…" : "AI restyle current"}
          </button>
          {!hasSvg && <div className="ai-hint">Draw something first.</div>}
        </>
      )}
    </div>
  );
};

// helpers used from Studio
export const aiApi = {
  generate: (prompt: string) => api.post("/Studio/ai/generate", { prompt }).then((r) => r.data),
  suggest: (svg: string, context: unknown) =>
    api.post("/Studio/ai/suggest", { svg, context }).then((r) => r.data),
  restyle: (svg: string, instruction: string) =>
    api.post("/Studio/ai/restyle", { svg, instruction }).then((r) => r.data),
};

export default AiPanel;
