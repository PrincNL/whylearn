export default function LoadingPricing() {
  return (
    <div className="container flex flex-col gap-10 py-20">
      <div className="mx-auto flex flex-col items-center gap-4 text-center">
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-12 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-2xl border border-border/50 bg-muted/50" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-border/50 bg-muted/50" />
    </div>
  );
}
