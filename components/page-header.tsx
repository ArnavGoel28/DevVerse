import { getModule } from "@/lib/modules";

/** Title row for a module page: gradient icon tile, clear title, one-line promise (first-impression effect). */
export function PageHeader({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const mod = getModule(slug);
  if (!mod) return null;
  const Icon = mod.icon;
  return (
    <div className="animate-fade-up flex flex-wrap items-center gap-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-primary/25">
        <Icon className="size-6" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{mod.name}</h1>
        <p className="text-muted-foreground">{mod.tagline}</p>
      </div>
      {children}
    </div>
  );
}
