"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { LogOut, Menu, X } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { githubAvatar } from "@/lib/avatar";
import { GROUPS, MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

// Sidebar: 4 labelled groups instead of 11 flat links (Hick–Hyman law, chunking — docs/12-todo.md §1).
export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out");
    } catch {
      toast.error("Couldn't sign out. Check your connection and try again.");
    }
  }

  return (
    <aside className="sticky top-0 z-30 flex w-full flex-col border-b bg-sidebar text-sidebar-foreground md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-4 py-3.5">
        <Logo href="/home" />
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="app-nav" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      <nav id="app-nav" aria-label="Tools" className={cn("max-h-[calc(100dvh-4rem)] flex-col gap-4 overflow-y-auto px-2 pb-4 md:flex md:max-h-none md:flex-1 md:pb-2", open ? "flex" : "hidden")}>
        {GROUPS.map((g) => (
          <div key={g.id} className="flex flex-col gap-px">
            <p className="px-3 pb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{g.label}</p>
            {MODULES.filter((m) => m.group === g.id).map(({ slug, name, icon: Icon }) => {
              const active = pathname === `/${slug}` || pathname.startsWith(`/${slug}/`);
              return (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors md:py-1.5",
                    active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4", active && "text-primary")} weight={active ? "bold" : "regular"} />
                  {name}
                </Link>
              );
            })}
          </div>
        ))}
        {user && (
          <div className="flex items-center gap-3 border-t px-1 pt-3 md:hidden">
            <SignedInUser photo={user.photoURL} name={user.displayName} onSignOut={handleSignOut} />
          </div>
        )}
      </nav>

      {user && (
        <div className="hidden items-center gap-3 border-t p-3 md:flex">
          <SignedInUser photo={user.photoURL} name={user.displayName} onSignOut={handleSignOut} />
        </div>
      )}
    </aside>
  );
}

function SignedInUser({ photo, name, onSignOut }: { photo: string | null; name: string | null; onSignOut: () => void }) {
  return (
    <>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={githubAvatar(photo, 64)} alt="" width={32} height={32} loading="lazy" className="size-8 rounded-full border" />
      )}
      <span className="flex-1 truncate text-sm">{name ?? "You"}</span>
      <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out" title="Sign out">
        <LogOut />
      </Button>
    </>
  );
}
