/** Ask GitHub's avatar CDN for a small image (`s=` is the pixel size) instead of the full-size original. */
export function githubAvatar(url: string, size: number): string {
  if (!/^https:\/\/(avatars\.githubusercontent\.com|github\.com)\//.test(url)) return url;
  const u = new URL(url);
  u.searchParams.set("s", String(size));
  return u.toString();
}
