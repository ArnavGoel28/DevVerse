import type { Metadata } from "next";

import { CONTACT_EMAIL } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What DevVerse collects from your GitHub account, where it is stored, which services process it and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="text-sm text-muted-foreground">Last updated 14 November 2026</p>
      <p>
        DevVerse is an early-stage product built for Startup Buildathon India 2026. This page explains, in plain language, what we collect and why. If anything here is unclear, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What we collect when you sign in with GitHub</h2>
      <ul>
        <li>Your GitHub username, display name, avatar and bio.</li>
        <li>A GitHub access token with the <code>read:user</code> scope. It is encrypted before it is stored and is only used to read your GitHub history.</li>
        <li>Public data about your repositories, languages, commits, pull requests and open-source contributions.</li>
      </ul>

      <h2>What we create from it</h2>
      <ul>
        <li>Your Developer Profile: skills, struggles, growth and the evidence behind each one.</li>
        <li>Activity inside DevVerse: practice submissions and results, your learning roadmap, ratings you give AI answers, and a daily count of AI requests used for usage limits.</li>
        <li>We store the fact that you asked the mentor about a topic. We do not store the text of your mentor conversations.</li>
      </ul>

      <h2>What stays in your browser</h2>
      <p>Community posts, saved jobs and team views are kept in your browser&apos;s local storage until those features have a backend. Clearing your browser data removes them.</p>

      <h2>Where it is stored and who processes it</h2>
      <ul>
        <li>Google Firebase (Authentication and Firestore) stores your account and profile.</li>
        <li>Google Gemini, through Google Cloud Vertex AI, writes profile text and answers AI requests. We send it the parts of your profile a request needs, not your access token.</li>
        <li>GitHub provides the data you allow us to read.</li>
      </ul>
      <p>We do not sell your data and we do not use it for advertising.</p>

      <h2>The live demo</h2>
      <p>The demo on the home page reads public GitHub data for the username you type. The profile it builds is not stored.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Mark any skill as wrong or hide it from your profile.</li>
        <li>Revoke DevVerse&apos;s access at any time from GitHub, under Settings, Applications.</li>
        <li>Ask us to delete your account and everything stored about you by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We delete it within 30 days.</li>
      </ul>

      <h2>Changes</h2>
      <p>If this policy changes, we will update the date at the top of this page.</p>
    </>
  );
}
