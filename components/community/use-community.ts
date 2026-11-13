"use client";

import { useCallback } from "react";

import { useLocal } from "@/components/use-local";
import { type Post, type PostDraft, toggleVote } from "@/lib/community/model";
import { seedPosts } from "@/lib/community/seed";

// Front-end store for Community until the API in docs/10-backend-plan.md §Community exists.
// Same actions the API will expose: create, answer, vote, accept.

const POSTS = "devverse.community.posts.v1";
const VOTES = "devverse.community.votes.v1";

const newId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function useCommunity(me: string) {
  const [posts, setPosts, saved] = useLocal<Post[]>(POSTS, () => seedPosts());
  const [votes, setVotes] = useLocal<Record<string, true>>(VOTES, () => ({}));

  const create = useCallback(
    (d: PostDraft): string => {
      const id = newId();
      const post: Post = { id, type: d.type, title: d.title.trim(), body: d.body.trim(), tags: d.tags, url: d.url?.trim() || undefined, author: me, score: 0, views: 0, answers: [], createdAt: new Date().toISOString() };
      setPosts((p) => [post, ...p]);
      return id;
    },
    [me, setPosts],
  );

  const answer = useCallback(
    (postId: string, body: string) =>
      setPosts((p) => p.map((x) => (x.id === postId ? { ...x, answers: [...x.answers, { id: newId(), body: body.trim(), author: me, score: 0, createdAt: new Date().toISOString() }] } : x))),
    [me, setPosts],
  );

  /** CM-04: one vote per item; you can't vote on your own content. */
  const vote = useCallback(
    (postId: string, answerId?: string) => {
      const key = answerId ? `${postId}:${answerId}` : postId;
      const target = posts.find((x) => x.id === postId);
      const author = answerId ? target?.answers.find((a) => a.id === answerId)?.author : target?.author;
      if (!target || author === me) return false;
      const { delta, voted } = toggleVote(!!votes[key]);
      setVotes((v) => {
        const n = { ...v };
        if (voted) n[key] = true;
        else delete n[key];
        return n;
      });
      setPosts((p) =>
        p.map((x) => (x.id !== postId ? x : answerId ? { ...x, answers: x.answers.map((a) => (a.id === answerId ? { ...a, score: a.score + delta } : a)) } : { ...x, score: x.score + delta })),
      );
      return true;
    },
    [me, posts, votes, setPosts, setVotes],
  );

  /** CM-05: only the question's author can accept; accepting again un-accepts. */
  const accept = useCallback(
    (postId: string, answerId: string) =>
      setPosts((p) => p.map((x) => (x.id === postId && x.author === me ? { ...x, acceptedAnswerId: x.acceptedAnswerId === answerId ? undefined : answerId } : x))),
    [me, setPosts],
  );

  const view = useCallback((postId: string) => setPosts((p) => p.map((x) => (x.id === postId ? { ...x, views: x.views + 1 } : x))), [setPosts]);

  return { posts, votes, saved, create, answer, vote, accept, view };
}
