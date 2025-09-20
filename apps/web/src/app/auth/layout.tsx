import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20 py-16">
      <div className="mx-4 flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border/60 bg-background p-8 shadow-lg">
        <Link href="/" className="text-center text-sm font-semibold text-primary">
          ← Back to WhyLearn
        </Link>
        {children}
      </div>
    </div>
  );
}
