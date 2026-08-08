import {
  MODEL_VIEWER_SCRIPT,
  resolveSelfHostedAssetUrl,
} from "@/lib/ui/selfHostedAssetUrls";

const MODEL_VIEWER_TAG = "model-viewer";
const MODEL_VIEWER_SCRIPT_ID = "google-model-viewer-script";

let modelViewerLoadPromise: Promise<void> | null = null;

function injectModelViewerScript(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      void customElements.whenDefined(MODEL_VIEWER_TAG).then(() => resolve(), reject);
    };

    const script = document.createElement("script");
    script.id = MODEL_VIEWER_SCRIPT_ID;
    script.type = "module";
    script.src = src;
    script.onload = finish;
    script.onerror = () => reject(new Error(`Failed to load model-viewer script from ${src}.`));
    document.head.appendChild(script);
  });
}

async function loadModelViewerScript(): Promise<void> {
  const primarySrc = await resolveSelfHostedAssetUrl(
    MODEL_VIEWER_SCRIPT.local,
    MODEL_VIEWER_SCRIPT.cdn,
  );

  try {
    await injectModelViewerScript(primarySrc);
    
  } catch (primaryError) {
    if (primarySrc === MODEL_VIEWER_SCRIPT.cdn) {
      throw primaryError;
    }

    document.getElementById(MODEL_VIEWER_SCRIPT_ID)?.remove();
    await injectModelViewerScript(MODEL_VIEWER_SCRIPT.cdn);
  }
}

export function loadModelViewer(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof customElements === "undefined") {
    return Promise.resolve();
  }

  if (customElements.get(MODEL_VIEWER_TAG)) {
    return Promise.resolve();
  }

  if (modelViewerLoadPromise) {
    return modelViewerLoadPromise;
  }

  const existingScript = document.getElementById(MODEL_VIEWER_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    modelViewerLoadPromise = new Promise<void>((resolve, reject) => {
      if (customElements.get(MODEL_VIEWER_TAG)) {
        resolve();
        return;
      }

      const finish = () => {
        void customElements.whenDefined(MODEL_VIEWER_TAG).then(() => resolve(), reject);
      };

      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load model-viewer script.")),
        { once: true },
      );
    }).catch((error) => {
      modelViewerLoadPromise = null;
      throw error;
    });

    return modelViewerLoadPromise;
  }

  modelViewerLoadPromise = loadModelViewerScript().catch((error) => {
    modelViewerLoadPromise = null;
    throw error;
  });

  return modelViewerLoadPromise;
}