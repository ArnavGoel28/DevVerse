import { getModule } from "@/lib/modules";

/** Title row for a tool page: the tool name and what it does, nothing decorative. */
export function PageHeader({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const mod = getModule(slug);
  if (!mod) return null;
  return (
    <div className="flex flex-wrap items-end gap-4 border-b pb-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{mod.name}</h1>
        <p className="max-w-2xl text-muted-foreground">{mod.tagline}</p>
      </div>
      {children}
    </div>
  );
}
