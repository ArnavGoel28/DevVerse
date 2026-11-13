import Link from "next/link";

import { cn } from "@/lib/utils";

/** The DevVerse wordmark. Always a link (home for signed-in pages, the landing page otherwise). */
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 rounded-md", className)} aria-label="DevVerse home">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="5" className="fill-primary" />
        <path d="M6.5 10h4.5a6 6 0 0 1 0 12H6.5z M19 10l3.5 12 3.5-12" className="fill-none stroke-primary-foreground" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="text-[17px] font-semibold tracking-tight">DevVerse</span>
    </Link>
  );
}
