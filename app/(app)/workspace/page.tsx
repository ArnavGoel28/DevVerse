"use client";

import { CodeWorkspace } from "@/components/code/code-workspace";
import { ModulePage } from "@/components/module-page";

// WS-01 + AI-03 (block B5): "Code" tool with the Code Reviewer agent (D-28, D-31).
export default function CodePage() {
  return <ModulePage slug="workspace" wide>{(profile, auth) => <CodeWorkspace auth={auth} profile={profile} />}</ModulePage>;
}
