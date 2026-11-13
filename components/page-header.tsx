import { getModule } from "@/lib/modules";

/** Title row for a module page, taken from lib/modules.ts. */
export function PageHeader({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const mod = getModule(slug);
  if (!mod) return null;
  const Icon = mod.icon;
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="rounded-lg bg-primary/10 p-3 text-primary">
        <Icon className="size-6" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{mod.name}</h1>
        <p className="text-muted-foreground">{mod.tagline}</p>
      </div>
      {children}
    </div>
  );
}
