import { cn } from "@/lib/utils";

/** shadcn/ui-style skeleton: shows the shape of what's loading (perceived speed beats spinners). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

/** A page-shaped skeleton for tool pages while the profile loads. */
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export { Skeleton, PageSkeleton };
