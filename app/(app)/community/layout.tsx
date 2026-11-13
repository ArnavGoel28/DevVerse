import { moduleMetadata } from "@/lib/modules";

export const metadata = moduleMetadata("community");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
