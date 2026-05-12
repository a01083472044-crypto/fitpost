"use client";

import { useEffect, useState } from "react";
import { getMktPosts, getMktAccounts, saveMktPost, removeMktPost, type MktPost, type MktAccount } from "../../../lib/mkt";

export default function SchedulePage() {
  const [posts, setPosts]       = useState<MktPost[]>([]);
  const [accounts, setAccounts] = useState<MktAccount[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [msg, setMsg]           = useState("");

  function reload() {
    const all = getMktPosts();
    setPosts(all.sort((a, b) => {
      const aTime = a.scheduledAt ?? a.createdAt;
      const bTime = b.scheduledAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    }));
    setAccounts(getMktAccounts());
  }

  useEffect(() => {
    reload();
    // 예약된 포스트 중 시간이 지난 것 자동 체크
    checkOverdue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkOverdue() {
    const all  = getMktPosts();
    const accs = getMktAccounts();
    const now  = new Date();

    for (const post of all) {
      if (post.status !== "scheduled" || !post.scheduledAt) continue;
      if (new Date(post.scheduledAt) > now) continue;
      if (!post.imageUrl) continue;

      const acc = accs.find((a) => a.id === post.accountId) ?? accs[0];
      if (!acc) continue;

      try {
        const res  = await fetch("/api/mkt/instagram/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            igUserId:    acc.instagramUserId,
            accessToken: acc.accessToken,
            imageUrl:    post.imageUrl,
            caption:     post.caption,
          }),
        });
        const data = await res.json();
        saveMktPost({
          ...post,
          status:           res.ok ? "published" : "failed",
          publishedAt:      res.ok ? new Date().toISOString() : undefined,
          instagramMediaId: data.mediaId,
        });
      } catch {
        saveMktPost({ ...post, status: "failed" });
      }
    }
    reload();
  }

  async function publishPost(post: MktPost) {
    const acc = accounts.find((a) => a.id === post.accountId) ?? accounts[0];
    if (!acc) { setMsg("❌ 연결된 계정이 없습니다"); return; }
    if (!post.imageUrl) { setMsg("❌ 이미지 URL이 없습니다"); return; }

    setPublishing(post.id);
    setMsg("");

    try {
      const res  = await fetch("/api/mkt/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igUserId:    acc.instagramUserId,
          accessToken: acc.accessToken,
          imageUrl:    post.imageUrl,
          caption:     post.caption,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      saveMktPost({
        ...post,
        status:           "published",
        publishedAt:      new Date().toISOString(),
        instagramMediaId: data.mediaId,
      });
      setMsg("✅ 발행됐습니다!");
      reload();
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`);
    } finally {
      setPublishing(null);
    }
  }

  function deletePost(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    removeMktPost(id);
    reload();
  }

  const scheduled  = posts.filter((p) => p.status === "scheduled");
  const drafts     = posts.filter((p) => p.status === "draft");
  const published  = posts.filter((p) => p.status === "published");
  const failed     = posts.filter((p) => p.status === "failed");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">예약 관리</h2>
          <p className="text-sm text-gray-500 mt-1">예약된 포스트를 확인하고 즉시 발행할 수 있습니다</p>
        </div>
        <button
          onClick={checkOverdue}
          className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          🔄 자동 발행 체크
        </button>
      </div>

      {msg && (
        <div className={`mb-5 p-3 rounded-lg text-sm ${
          msg.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          {msg}
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📅</div>
          <p className="font-medium">저장된 포스트가 없습니다</p>
          <p className="text-sm mt-1">콘텐츠 생성 페이지에서 글을 작성해보세요</p>
        </div>
      )}

      {[
        { label: "📅 예약됨", items: scheduled, color: "blue" },
        { label: "📝 임시저장", items: drafts, color: "gray" },
        { label: "❌ 실패", items: failed, color: "red" },
        { label: "✅ 발행 완료", items: published, color: "green" },
      ].filter((g) => g.items.length > 0).map((group) => (
        <div key={group.label} className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{group.label} ({group.items.length})</h3>
          <div className="space-y-3">
            {group.items.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-5 flex gap-4">
                {post.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                    📷
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">{post.caption || "(캡션 없음)"}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    {post.scheduledAt && (
                      <span>📅 {new Date(post.scheduledAt).toLocaleString("ko-KR")}</span>
                    )}
                    {post.publishedAt && (
                      <span>✅ {new Date(post.publishedAt).toLocaleString("ko-KR")}</span>
                    )}
                    <span>생성: {new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {(post.status === "scheduled" || post.status === "draft" || post.status === "failed") && (
                    <button
                      onClick={() => publishPost(post)}
                      disabled={publishing === post.id}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {publishing === post.id ? "발행 중..." : "즉시 발행"}
                    </button>
                  )}
                  <button
                    onClick={() => deletePost(post.id)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
