import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES, getModule } from "@/lib/modules";

// Placeholder page for every module until its block is built.
// When you build a module, create app/(app)/<slug>/page.tsx — it takes priority over this file.

export const dynamicParams = false;

export function generateStaticParams() {
  return MODULES.filter((m) => !m.built).map((m) => ({ module: m.slug }));
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();
  const Icon = mod.icon;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{mod.name}</h1>
          <p className="text-muted-foreground">{mod.tagline}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Coming soon</CardTitle>
            <Badge variant="secondary">{mod.block}</Badge>
          </div>
          <CardDescription>Here&apos;s what this section will do.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {mod.features.map((f) => (
              <li key={f.id + f.text} className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="font-mono">
                  {f.id}
                </Badge>
                {f.text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
