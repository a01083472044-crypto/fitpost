"use client";

import { useState } from "react";

type BlogResult = {
  title: string;
  content: string;
  hashtags: string[];
  seoScore: number;
  keywordCount: number;
  charCount: number;
  tips: string[];
};

const CATEGORIES = [
  "헬스장 / 피트니스센터",
  "개인 PT샵",
  "필라테스 스튜디오",
  "요가 스튜디오",
  "크로스핏 박스",
  "수영장 / 아쿠아",
];

const KEYWORD_EXAMPLES = [
  "강남 헬스장 추천",
  "홈트레이닝 방법",
  "다이어트 PT 효과",
  "바디프로필 준비",
  "필라테스 효능",
  "근육 만들기 초보",
];

const SEO_TIPS = [
  "발행 시간: 오전 7-9시 또는 오후 12-2시가 노출에 유리합니다",
  "이미지 3-5장 첨부 시 체류 시간이 늘어 순위가 올라갑니다",
  "발행 후 3일 이내 댓글에 답글 달기 (활성도 신호)",
  "이웃 추가 적극 활용 — 초기 유입 확보에 효과적입니다",
];

export default function BlogPage() {
  const [keyword, setKeyword]     = useState("");
  const [category, setCategory]   = useState(CATEGORIES[0]);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<BlogResult | null>(null);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);

  async function generate() {
    if (!keyword.trim()) { setError("키워드를 입력해주세요"); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res  = await fetch("/api/mkt/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (!result) return;
    const text = `${result.title}\n\n${result.content}\n\n${result.hashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const scoreColor =
    !result ? "gray"
    : result.seoScore >= 80 ? "green"
    : result.seoScore >= 60 ? "yellow"
    : "red";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">블로그 SEO</h2>
        <p className="text-sm text-gray-500 mt-1">
          네이버 상위 노출에 최적화된 블로그 포스팅을 AI가 자동 작성합니다.
        </p>
      </div>

      {/* 입력 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">타겟 키워드</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="예: 강남 헬스장 추천"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {KEYWORD_EXAMPLES.map((k) => (
              <button
                key={k}
                onClick={() => setKeyword(k)}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">업종</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                  category === c
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> SEO 최적화 글 작성 중...
            </span>
          ) : "📝 네이버 SEO 블로그 글 생성"}
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <div className="space-y-4">
          {/* SEO 점수 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div className="flex gap-6">
              <div className="text-center">
                <p className={`text-3xl font-bold ${
                  scoreColor === "green" ? "text-green-600"
                  : scoreColor === "yellow" ? "text-yellow-600"
                  : "text-red-600"
                }`}>{result.seoScore}</p>
                <p className="text-xs text-gray-500 mt-0.5">SEO 점수</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{result.charCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">글자 수</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{result.keywordCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">키워드 반복</p>
              </div>
            </div>
            <button
              onClick={copyAll}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {copied ? "✅ 복사됨!" : "📋 전체 복사"}
            </button>
          </div>

          {/* 제목 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">제목</p>
            <p className="text-lg font-bold text-gray-900">{result.title}</p>
          </div>

          {/* 본문 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">본문</p>
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {result.content}
            </div>
          </div>

          {/* 해시태그 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">해시태그 ({result.hashtags.length}개)</p>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* SEO 팁 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">AI 추천 SEO 팁</p>
            <ul className="space-y-2">
              {result.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-indigo-500 mt-0.5">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* 네이버 업로드 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">📌 네이버 블로그 업로드 방법</p>
            <ol className="text-xs space-y-1 text-blue-700 list-decimal list-inside">
              <li>위 <strong>전체 복사</strong> 클릭</li>
              <li>네이버 블로그 → 글쓰기 → 붙여넣기</li>
              <li>이미지 3-5장 추가 후 발행</li>
              <li>발행 시간: 오전 7-9시 또는 오후 12-2시 권장</li>
            </ol>
          </div>
        </div>
      )}

      {/* 네이버 SEO 가이드 */}
      {!result && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">네이버 상위 노출 핵심 전략</p>
          <ul className="space-y-2">
            {SEO_TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-indigo-500 font-bold">{i + 1}.</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
