export default function LoadingApp() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col gap-4 py-10">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/80" />
      </div>
      <div className="h-12 w-full animate-pulse rounded-full bg-muted/60" />
      <div className="flex-1 rounded-3xl border border-border/60 bg-muted/40" />
    </div>
  );
}
