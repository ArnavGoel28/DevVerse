import Link from "next/link";

import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Logo />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Back to DevVerse</Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 outline-none">
        <article className="legal flex flex-col gap-4 leading-relaxed [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_p]:text-[15px] [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:text-[15px]">
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
