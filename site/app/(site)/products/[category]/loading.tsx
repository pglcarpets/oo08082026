export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-soft">
      <div className="h-[50vh] min-h-[25rem] w-full animate-pulse bg-hover" />
      <div className="container border-b border-muted bg-panel px-6 py-5 2xl:px-0">
        <div className="h-10 w-full max-w-lg animate-pulse rounded-sm bg-muted" />
      </div>
      <div className="container flex gap-8 px-6 py-8 2xl:px-0">
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="space-y-3 rounded-sm border border-muted bg-panel p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded-sm bg-muted"
              />
            ))}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-px bg-hover sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-panel">
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="space-y-2 px-4 pb-5 pt-3">
                <div className="h-2 w-16 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-hover" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
