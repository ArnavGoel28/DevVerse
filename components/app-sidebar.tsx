"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex w-full flex-col border-b bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <Link href="/home" className="px-5 py-4 text-lg font-bold tracking-tight">
        Dev<span className="text-primary">Verse</span>
      </Link>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:overflow-visible">
        {MODULES.map(({ slug, name, icon: Icon }) => {
          const active = pathname === `/${slug}` || pathname.startsWith(`/${slug}/`);
          return (
            <Link
              key={slug}
              href={`/${slug}`}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {name}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="hidden items-center gap-3 border-t p-3 md:flex">
          {user.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="size-8 rounded-full" />
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
