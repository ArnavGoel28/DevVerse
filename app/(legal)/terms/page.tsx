import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using DevVerse, including AI-generated advice, community content and your account.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of use</h1>
      <p className="text-sm text-muted-foreground">Last updated 14 November 2026</p>
      <p>
        By using DevVerse you agree to these terms. DevVerse is an early-stage product, offered as it is while we build it. Questions go to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You sign in with your own GitHub account and are responsible for what happens under it.</li>
        <li>You can stop using DevVerse and ask us to delete your data at any time. See the <Link href="/privacy">privacy policy</Link>.</li>
      </ul>

      <h2>AI-generated content</h2>
      <ul>
        <li>Profiles, hints, explanations and diagnoses are written with help from AI and can be wrong. Check them before relying on them, especially for code you ship.</li>
        <li>Each skill shows the evidence behind it so you can judge it. Mark anything wrong and it stops counting.</li>
        <li>AI use has daily limits so the service stays available for everyone.</li>
      </ul>

      <h2>What you post</h2>
      <ul>
        <li>You keep ownership of what you write in Community. Do not post anything you do not have the right to share, secrets such as API keys, or content that harasses others.</li>
        <li>Posts marked &ldquo;Sample&rdquo; are example content written by the DevVerse team.</li>
        <li>Job listings marked as samples are fictional and show how matching works.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not try to break, overload or get around the limits of the service.</li>
        <li>Do not use DevVerse to collect other people&apos;s data.</li>
      </ul>

      <h2>No warranty</h2>
      <p>DevVerse is provided without warranties of any kind. To the extent the law allows, we are not liable for losses that come from using it.</p>

      <h2>Changes</h2>
      <p>We may update these terms as the product changes. The date at the top shows the latest version.</p>
    </>
  );
}
