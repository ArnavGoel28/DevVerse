import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { Toaster } from "sonner";

import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "DevVerse: learn, build and ship with an AI mentor that knows your GitHub", template: "%s · DevVerse" },
  description:
    "DevVerse turns your GitHub history into a Developer Profile, then uses it to guide you across ten tools: mentor, learning, practice, code, CI, community, jobs and teams.",
  applicationName: "DevVerse",
};

export const viewport: Viewport = { themeColor: "#f8f5f0", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-clip font-sans">
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="bottom-right"
          closeButton
          toastOptions={{
            classNames: {
              toast: "!rounded-md !border !border-border !bg-card !text-foreground !shadow-none !font-sans",
              description: "!text-muted-foreground",
              success: "[&_[data-icon]]:!text-success",
              error: "!border-destructive/50 [&_[data-icon]]:!text-destructive",
            },
          }}
        />
      </body>
    </html>
  );
}
