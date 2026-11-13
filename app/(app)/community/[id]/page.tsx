"use client";

import { useParams } from "next/navigation";

import { PostView } from "@/components/community/post-view";
import { ModulePage } from "@/components/module-page";

export default function CommunityPostPage() {
  const { id } = useParams<{ id: string }>();
  return <ModulePage slug="community" header={false}>{(profile) => <PostView id={id} profile={profile} />}</ModulePage>;
}
