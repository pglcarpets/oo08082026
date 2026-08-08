export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-soft border-t-primary"
          aria-hidden="true"
        />
        <p className="typ-body-sm text-muted">Loading...</p>
      </div>
    </div>
  );
}
