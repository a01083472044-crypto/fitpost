"use client";

import { useState } from "react";
import { getMktAccounts, saveMktPost, newPostId, type MktPost, type MktAccount } from "../../../lib/mkt";

type GenerateResult = {
  caption: string;
  hashtags: string[];
  blogContent: string;
};

export default function CreatePage() {
  const [topic, setTopic]               = useState("");
  const [tone, setTone]                 = useState("친근하고 동기부여가 되는");
  const [gymName, setGymName]           = useState("");
  const [specialOffer, setSpecialOffer] = useState("");
  const [imageUrl, setImageUrl]         = useState("");

  const [result, setResult]   = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState<"instagram" | "blog">("instagram");

  // 편집 가능한 상태
  const [caption, setCaption]     = useState("");
  const [hashtags, setHashtags]   = useState("");
  const [blog, setBlog]           = useState("");

  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState("");

  async function generate() {
    if (!topic.trim()) { setError("주제를 입력해주세요"); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res  = await fetch("/api/mkt/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, gymName, specialOffer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setCaption(data.caption);
      setHashtags(data.hashtags.join(" "));
      setBlog(data.blogContent);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function saveDraft() {
    const post: MktPost = {
      id:          newPostId(),
      platform:    "instagram",
      caption:     caption + "\n\n" + hashtags,
      hashtags:    hashtags.split(/\s+/).filter((h) => h.startsWith("#")),
      imageUrl:    imageUrl || undefined,
      blogContent: blog || undefined,
      status:      "draft",
      createdAt:   new Date().toISOString(),
    };
    saveMktPost(post);
    setPublishMsg("✅ 임시 저장됐습니다");
  }

  async function publishNow() {
    const accounts: MktAccount[] = getMktAccounts();
    if (accounts.length === 0) {
      setPublishMsg("❌ 연결된 인스타그램 계정이 없습니다. 계정 연동 페이지에서 연결해주세요.");
      return;
    }
    if (!imageUrl.trim()) {
      setPublishMsg("❌ 게시할 이미지 URL을 입력해주세요 (인스타그램은 이미지 필수)");
      return;
    }

    setPublishing(true);
    setPublishMsg("");

    const acc        = accounts[0];
    const fullCaption = caption + "\n\n" + hashtags;

    try {
      const res  = await fetch("/api/mkt/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igUserId:    acc.instagramUserId,
          accessToken: acc.accessToken,
          imageUrl,
          caption:     fullCaption,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const post: MktPost = {
        id:               newPostId(),
        accountId:        acc.id,
        platform:         "instagram",
        caption:          fullCaption,
        hashtags:         hashtags.split(/\s+/).filter((h) => h.startsWith("#")),
        imageUrl,
        blogContent:      blog || undefined,
        status:           "published",
        publishedAt:      new Date().toISOString(),
        instagramMediaId: data.mediaId,
        createdAt:        new Date().toISOString(),
      };
      saveMktPost(post);
      setPublishMsg(`✅ 인스타그램에 게시됐습니다! (ID: ${data.mediaId})`);
    } catch (e) {
      setPublishMsg(`❌ ${(e as Error).message}`);
    } finally {
      setPublishing(false);
    }
  }

  function schedulePost() {
    const at = prompt("예약 시간 입력 (예: 2026-05-13T09:00)");
    if (!at) return;
    const accounts: MktAccount[] = getMktAccounts();
    const post: MktPost = {
      id:           newPostId(),
      accountId:    accounts[0]?.id,
      platform:     "instagram",
      caption:      caption + "\n\n" + hashtags,
      hashtags:     hashtags.split(/\s+/).filter((h) => h.startsWith("#")),
      imageUrl:     imageUrl || undefined,
      blogContent:  blog || undefined,
      status:       "scheduled",
      scheduledAt:  new Date(at).toISOString(),
      createdAt:    new Date().toISOString(),
    };
    saveMktPost(post);
    setPublishMsg(`✅ ${new Date(at).toLocaleString("ko-KR")}으로 예약됐습니다`);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">콘텐츠 생성</h2>
        <p className="text-sm text-gray-500 mt-1">주제를 입력하면 AI가 인스타 캡션 + 블로그 초안을 자동 생성합니다</p>
      </div>

      {/* 입력 폼 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              오늘 주제 <span className="text-red-500">*</span>
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 등 운동 3종 세트, 신규 회원 이벤트, PT 후기"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">헬스장 이름</label>
            <input
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              placeholder="예: 바디핏 강남점"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">톤앤매너</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>친근하고 동기부여가 되는</option>
              <option>전문적이고 신뢰감 있는</option>
              <option>활기차고 에너지 넘치는</option>
              <option>차분하고 건강을 강조하는</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">특별 이벤트 / 할인 (선택)</label>
            <input
              value={specialOffer}
              onChange={(e) => setSpecialOffer(e.target.value)}
              placeholder="예: 5월 한정 PT 20% 할인"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "AI 생성 중..." : "✨ AI 콘텐츠 생성"}
        </button>
      </div>

      {/* 생성 결과 */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          {/* 탭 */}
          <div className="flex border-b border-gray-200">
            {(["instagram", "blog"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-3.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "instagram" ? "📸 인스타그램" : "📝 네이버 블로그"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "instagram" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">캡션 (편집 가능)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">해시태그 (편집 가능)</label>
                  <textarea
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">이미지 URL (공개 접근 가능한 URL)</label>
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">인스타그램은 공개 이미지 URL이 필요합니다</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">블로그 초안 (편집 가능)</label>
                  <button
                    onClick={() => { navigator.clipboard.writeText(blog); alert("복사됐습니다!"); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                  >
                    📋 복사
                  </button>
                </div>
                <textarea
                  value={blog}
                  onChange={(e) => setBlog(e.target.value)}
                  rows={16}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">복사 후 네이버 블로그에 직접 붙여넣기 하세요</p>
              </div>
            )}
          </div>

          {/* 발행 액션 */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={publishNow}
              disabled={publishing}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
            >
              {publishing ? "발행 중..." : "📸 인스타 즉시 발행"}
            </button>
            <button
              onClick={schedulePost}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              📅 예약 발송
            </button>
            <button
              onClick={saveDraft}
              className="px-5 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              저장
            </button>
          </div>

          {publishMsg && (
            <div className={`mx-6 mb-6 p-3 rounded-lg text-sm ${
              publishMsg.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {publishMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
