export type MktPlatform = "instagram";
export type MktPostStatus = "draft" | "scheduled" | "published" | "failed";

export type MktAccount = {
  id: string;
  platform: MktPlatform;
  username: string;
  instagramUserId: string;
  pageId: string;
  accessToken: string;
};

export type MktPost = {
  id: string;
  accountId?: string;
  platform: MktPlatform;
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  blogContent?: string;
  scheduledAt?: string;
  publishedAt?: string;
  status: MktPostStatus;
  instagramMediaId?: string;
  createdAt: string;
};

// ── localStorage helpers ──────────────────────────────────────────────────

const ACCOUNTS_KEY = "mkt_accounts";
const POSTS_KEY = "mkt_posts";

export function getMktAccounts(): MktAccount[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]"); } catch { return []; }
}
export function saveMktAccount(account: MktAccount) {
  const accounts = getMktAccounts().filter((a) => a.id !== account.id);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
}
export function removeMktAccount(id: string) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(getMktAccounts().filter((a) => a.id !== id)));
}

export function getMktPosts(): MktPost[] {
  try { return JSON.parse(localStorage.getItem(POSTS_KEY) ?? "[]"); } catch { return []; }
}
export function saveMktPost(post: MktPost) {
  const posts = getMktPosts().filter((p) => p.id !== post.id);
  localStorage.setItem(POSTS_KEY, JSON.stringify([...posts, post]));
}
export function removeMktPost(id: string) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(getMktPosts().filter((p) => p.id !== id)));
}
export function newPostId() {
  return `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
