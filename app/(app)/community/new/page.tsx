"use client";

import { NewPost } from "@/components/community/new-post";
import { ModulePage } from "@/components/module-page";

export default function NewCommunityPostPage() {
  return <ModulePage slug="community" header={false}>{(profile) => <NewPost profile={profile} />}</ModulePage>;
}
