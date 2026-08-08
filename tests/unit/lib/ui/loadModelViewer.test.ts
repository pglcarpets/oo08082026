import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveSelfHostedAssetUrl } from "@/lib/ui/selfHostedAssetUrls";

vi.mock("@/lib/ui/selfHostedAssetUrls", () => ({
  MODEL_VIEWER_SCRIPT: { local: "local-src", cdn: "cdn-src" },
  resolveSelfHostedAssetUrl: vi.fn(),
}));

describe("loadModelViewer", () => {
  let customElementsMock: {
    get: ReturnType<typeof vi.fn>;
    whenDefined: ReturnType<typeof vi.fn>;
  };
  let scriptMap: Map<string, HTMLScriptElement>;
  let lastScript: HTMLScriptElement | null;
  let originalCreateElement: typeof document.createElement;
  let originalGetElementById: typeof document.getElementById;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    scriptMap = new Map();
    lastScript = null;
    originalCreateElement = document.createElement.bind(document);
    originalGetElementById = document.getElementById.bind(document);

    customElementsMock = {
      get: vi.fn(),
      whenDefined: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal("customElements", customElementsMock);

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      return element;
    });

    vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
      return scriptMap.get(id) ?? originalGetElementById(id);
    });

    vi.spyOn(document.head, "appendChild").mockImplementation((node: Node) => {
      if (node instanceof HTMLScriptElement && node.id) {
        lastScript = node;
        scriptMap.set(node.id, node);
        scriptMap.set("google-model-viewer-script", node);
      }
      return node;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    const script = originalGetElementById("google-model-viewer-script");
    script?.remove();
  });

  it("resolves immediately when model-viewer is already defined", async () => {
    const { loadModelViewer } = await import("@/lib/ui/loadModelViewer");
    customElementsMock.get.mockReturnValue({});

    await expect(loadModelViewer()).resolves.toBeUndefined();
    expect(customElementsMock.get).toHaveBeenCalledWith("model-viewer");
  });

  it("injects the local script and resolves on load", async () => {
    const { loadModelViewer } = await import("@/lib/ui/loadModelViewer");
    vi.mocked(resolveSelfHostedAssetUrl).mockResolvedValue("local-src");
    customElementsMock.get.mockReturnValue(undefined);

    const promise = loadModelViewer();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const script = document.getElementById("google-model-viewer-script") as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.type).toBe("module");
    expect(script.src).toContain("local-src");

    script.dispatchEvent(new Event("load"));

    await expect(promise).resolves.toBeUndefined();
    expect(customElementsMock.whenDefined).toHaveBeenCalledWith("model-viewer");
  });

  it("falls back to the CDN script if the local script fails", async () => {
    const { loadModelViewer } = await import("@/lib/ui/loadModelViewer");
    vi.mocked(resolveSelfHostedAssetUrl).mockResolvedValue("local-src");
    customElementsMock.get.mockReturnValue(undefined);

    const promise = loadModelViewer();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const localScript = lastScript;
    expect(localScript).not.toBeNull();
    expect(localScript?.src).toContain("local-src");

    localScript!.dispatchEvent(new Event("error"));
    await Promise.resolve();

    const cdnScript = document.getElementById("google-model-viewer-script") as HTMLScriptElement;
    expect(cdnScript.src).toContain("cdn-src");

    cdnScript.dispatchEvent(new Event("load"));

    await expect(promise).resolves.toBeUndefined();
  });
});
