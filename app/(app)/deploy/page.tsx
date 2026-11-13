"use client";

import { ModulePage } from "@/components/module-page";
import { ShipView } from "@/components/ship/ship-view";

// DP-05 (block B5): "Ship" tool with the DevOps & Debug agent (D-28, D-31). One-click deploy (DP-01) is Later.
export default function ShipPage() {
  return <ModulePage slug="deploy" wide>{(profile, auth) => <ShipView auth={auth} profile={profile} />}</ModulePage>;
}
