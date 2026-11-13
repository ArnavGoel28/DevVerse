"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders AI answers. No raw HTML is allowed (react-markdown escapes it by default).
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h3 className="mt-1 text-base font-semibold" {...p} />,
          h2: (p) => <h3 className="mt-1 text-base font-semibold" {...p} />,
          h3: (p) => <h4 className="mt-1 font-semibold" {...p} />,
          ul: (p) => <ul className="ml-5 list-disc space-y-1" {...p} />,
          ol: (p) => <ol className="ml-5 list-decimal space-y-1" {...p} />,
          pre: (p) => <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs" {...p} />,
          code: ({ className, ...p }) => (
            <code className={className ? `${className} font-mono` : "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"} {...p} />
          ),
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs [&_td]:border [&_td]:p-1.5 [&_th]:border [&_th]:p-1.5" {...p} />
            </div>
          ),
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href} className="text-primary underline underline-offset-2">
                {children}
              </Link>
            ) : (
              <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                {children}
              </a>
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
