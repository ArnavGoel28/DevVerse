import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Logo />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-16">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">This page doesn&apos;t exist.</h1>
        <p className="text-muted-foreground">The link may be old or mistyped. These usually help:</p>
        <ul className="flex flex-col gap-1.5">
          <li><Link href="/home" className="text-primary underline-offset-4 hover:underline">Home: your next best moves</Link></li>
          <li><Link href="/profile" className="text-primary underline-offset-4 hover:underline">Your Developer Profile</Link></li>
          <li><Link href="/" className="text-primary underline-offset-4 hover:underline">The DevVerse landing page</Link></li>
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
