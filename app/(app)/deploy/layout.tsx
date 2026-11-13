import { moduleMetadata } from "@/lib/modules";

export const metadata = moduleMetadata("deploy");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
