"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Sparkles, X } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { GROUPS, MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

// Sidebar: 4 labelled groups instead of 11 flat links (Hick–Hyman law, chunking — docs/12-todo.md §1).
export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <aside className="sticky top-0 z-30 flex w-full flex-col border-b bg-sidebar/90 text-sidebar-foreground backdrop-blur md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-5 py-4">
        <Link href="/home" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-md">DV</span>
          <span className="text-lg font-bold tracking-tight">Dev<span className="text-brand">Verse</span></span>
        </Link>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="app-nav" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      <nav id="app-nav" className={cn("flex-col gap-4 px-3 pb-4 md:flex md:flex-1 md:overflow-y-auto md:pb-2", open ? "flex" : "hidden")}>
        {GROUPS.map((g) => (
          <div key={g.id} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">{g.label}</p>
            {MODULES.filter((m) => m.group === g.id).map(({ slug, name, icon: Icon }) => {
              const active = pathname === `/${slug}` || pathname.startsWith(`/${slug}/`);
              return (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors md:py-2",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                  )}
                >
                  {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-1 rounded-full bg-brand" aria-hidden />}
                  <Icon className={cn("size-4 transition-transform group-hover:scale-110", active && "text-primary")} />
                  {name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="hidden px-3 pb-3 md:block">
        <div className="rounded-xl border bg-card p-3 text-xs">
          <p className="mb-1 flex items-center gap-1.5 font-semibold"><Sparkles className="size-3.5 text-primary" /> 9 AI agents, one profile</p>
          <p className="text-muted-foreground">Every tool learns from what you do in the others.</p>
        </div>
      </div>

      {user && (
        <div className="hidden items-center gap-3 border-t p-3 md:flex">
          {user.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="size-8 rounded-full ring-2 ring-primary/30" />
          )}
          <span className="flex-1 truncate text-sm">{user.displayName ?? "You"}</span>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      )}
    </aside>
  );
}
