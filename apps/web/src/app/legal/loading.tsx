export default function LoadingLegal() {
  return (
    <div className="container flex flex-col gap-6 py-20">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-4 w-full animate-pulse rounded bg-muted/80" />
        ))}
      </div>
    </div>
  );
}
