/**
 * Reject designer-static GLB/GLTF product URLs in admin configurator forms.
 * Generated catalog-assets (`…/generated/…`) remain allowed.
 */

const DESIGNER_STATIC_GLB =
  /\/(?:vendor|models|static)\/.*\.(?:glb|gltf)(?:\?|#|$)/i;
const GENERATED_ALLOW =
  /catalog-assets\/generated\//i;

export function assertNoDesignerStaticGlb(
  url: string | null | undefined,
  fieldLabel = "model_3d_url",
): void {
  if (!url) return;
  const trimmed = url.trim();
  if (!trimmed) return;
  if (GENERATED_ALLOW.test(trimmed)) return;
  if (DESIGNER_STATIC_GLB.test(trimmed) || /\.(?:glb|gltf)(?:\?|#|$)/i.test(trimmed)) {
    // Allow absolute/relative paths under generated or planner-owned uploads only.
    if (
      trimmed.includes("/api/files/") ||
      trimmed.includes("catalog-assets/generated") ||
      trimmed.startsWith("blob:")
    ) {
      return;
    }
    throw new Error(
      `${fieldLabel}: designer static GLB/GLTF URLs are not allowed. Use a generated catalog asset path.`,
    );
  }
}
