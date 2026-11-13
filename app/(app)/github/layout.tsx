import { moduleMetadata } from "@/lib/modules";

export const metadata = moduleMetadata("github");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
