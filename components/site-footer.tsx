import Link from "next/link";

import { Logo } from "@/components/logo";

export const CONTACT_EMAIL = "arnavgoel2866@gmail.com";
export const SOURCE_URL = "https://github.com/ArnavGoel28/DevVerse";

/** S7/S9/S19: one footer for the public pages, every link real. */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-xs text-muted-foreground">One Developer Profile behind ten tools. Built for Startup Buildathon India 2026.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2">
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Use</Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-muted-foreground hover:text-foreground">Contact</a>
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Source Code</a>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 font-mono text-xs text-muted-foreground">© {new Date().getFullYear()} DevVerse. All rights reserved.</p>
      </div>
    </footer>
  );
}
