/** Shown in the content area straight away while a dashboard page loads. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6 p-6 lg:p-10" role="status" aria-label="Loading">
      <div className="h-8 w-56 rounded-lg bg-foreground/10" />
      <div className="h-4 w-80 max-w-full rounded bg-foreground/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 rounded-xl bg-foreground/5" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-foreground/5" />
    </div>
  );
}
