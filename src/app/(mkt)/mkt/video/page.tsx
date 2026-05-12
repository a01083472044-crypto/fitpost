"use client";

import { useState } from "react";

type Service = {
  id: "kling" | "runway" | "luma";
  name: string;
  desc: string;
  quality: number;
  pricePerSec: number; // USD
  badge?: string;
  color: string;
};

const SERVICES: Service[] = [
  {
    id: "kling",
    name: "Kling 2.0",
    desc: "중국 최고 AI 영상 모델. 현실감 넘치는 움직임과 디테일",
    quality: 5,
    pricePerSec: 0.04,
    badge: "가성비 최고",
    color: "indigo",
  },
  {
    id: "runway",
    name: "Runway Gen-3",
    desc: "할리우드 수준 영상 품질. 가장 자연스러운 인물 동작",
    quality: 5,
    pricePerSec: 0.05,
    badge: "최고 품질",
    color: "purple",
  },
  {
    id: "luma",
    name: "Luma Dream Machine",
    desc: "빠른 생성 속도와 안정적인 품질. 배경/공간 표현 우수",
    quality: 4,
    pricePerSec: 0.14,
    badge: "",
    color: "pink",
  },
];

const DURATIONS = [5, 10, 15];

const KRW_RATE = 1380;

const FITNESS_PROMPTS = [
  "헬스장에서 바벨 스쿼트를 하는 근육질 트레이너, 전문적인 조명, 4K 화질",
  "PT 세션 중 트레이너가 회원의 자세를 교정해주는 장면, 밝고 현대적인 헬스장",
  "운동 전후 바디 트랜스포메이션, 동기부여 영상, 시네마틱 스타일",
  "여성 트레이너가 필라테스 동작을 시연하는 장면, 화이트 스튜디오",
  "그룹 PT 수업, 활기찬 분위기, 다양한 운동 동작, 밝은 색감",
];

export default function VideoPage() {
  const [selected, setSelected]   = useState<Service["id"]>("kling");
  const [duration, setDuration]   = useState(10);
  const [prompt, setPrompt]       = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult]       = useState<{ videoUrl: string; taskId: string } | null>(null);
  const [error, setError]         = useState("");

  const service  = SERVICES.find((s) => s.id === selected)!;
  const usdCost  = service.pricePerSec * duration;
  const krwCost  = Math.round(usdCost * KRW_RATE);

  async function generate() {
    if (!prompt.trim()) { setError("영상 설명을 입력해주세요"); return; }
    setError("");
    setGenerating(true);
    setResult(null);

    try {
      const res  = await fetch("/api/mkt/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: selected, prompt, duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const colorMap: Record<string, string> = {
    indigo: "border-indigo-500 bg-indigo-50",
    purple: "border-purple-500 bg-purple-50",
    pink:   "border-pink-500 bg-pink-50",
  };
  const badgeMap: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700",
    purple: "bg-purple-100 text-purple-700",
    pink:   "bg-pink-100 text-pink-700",
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">AI 영상 제작</h2>
        <p className="text-sm text-gray-500 mt-1">
          AI가 피트니스 홍보 영상을 자동 생성합니다. 결과물을 Instagram 릴스로 바로 업로드하세요.
        </p>
      </div>

      {/* 서비스 선택 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">AI 서비스 선택</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SERVICES.map((svc) => (
            <button
              key={svc.id}
              onClick={() => setSelected(svc.id)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                selected === svc.id
                  ? colorMap[svc.color]
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-semibold text-gray-900 text-sm">{svc.name}</span>
                {svc.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeMap[svc.color]}`}>
                    {svc.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{svc.desc}</p>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-sm ${i < svc.quality ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                ))}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                ${svc.pricePerSec.toFixed(2)}<span className="text-xs font-normal text-gray-500">/초</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 영상 길이 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">영상 길이</h3>
        <div className="flex gap-3">
          {DURATIONS.map((d) => {
            const cost = Math.round(service.pricePerSec * d * KRW_RATE);
            return (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm transition-all ${
                  duration === d
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">{d}초</div>
                <div className="text-xs mt-0.5 opacity-70">약 {cost.toLocaleString()}원</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 예상 금액 */}
      <div className="mb-6 bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">예상 생성 비용</p>
          <p className="text-xs text-gray-400 mt-0.5">{service.name} · {duration}초</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{krwCost.toLocaleString()}원</p>
          <p className="text-xs text-gray-400">${usdCost.toFixed(2)} USD</p>
        </div>
      </div>

      {/* 프롬프트 입력 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">영상 설명</h3>
          <span className="text-xs text-gray-400">한국어 또는 영어</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="예: 헬스장에서 바벨 스쿼트를 하는 트레이너, 전문적인 조명, 4K 화질"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 추천 프롬프트 */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-2">추천 프롬프트</p>
        <div className="flex flex-wrap gap-2">
          {FITNESS_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => setPrompt(p)}
              className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
            >
              {p.slice(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={generate}
        disabled={generating}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-base hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> AI 영상 생성 중... (30초~2분 소요)
          </span>
        ) : (
          `🎬 영상 생성하기 · ${krwCost.toLocaleString()}원`
        )}
      </button>

      {/* 결과 */}
      {result && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">✅ 영상 생성 완료!</h3>
          <video
            src={result.videoUrl}
            controls
            className="w-full rounded-lg mb-4 max-h-96 object-contain bg-black"
          />
          <div className="flex gap-3">
            <a
              href={result.videoUrl}
              download
              className="flex-1 text-center py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              📥 다운로드
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.videoUrl);
                alert("영상 URL이 복사됐습니다. 릴스 업로드에 사용하세요.");
              }}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              📸 릴스로 업로드
            </button>
          </div>
        </div>
      )}

      {/* API 키 안내 */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">⚠️ API 키 필요</p>
        <p className="text-xs leading-relaxed">
          실제 영상 생성을 위해 선택한 서비스의 API 키를 Vercel 환경변수에 추가해야 합니다.
          <br />
          <span className="font-mono">KLING_ACCESS_KEY</span> · <span className="font-mono">KLING_SECRET_KEY</span> · <span className="font-mono">RUNWAY_API_KEY</span> · <span className="font-mono">LUMA_API_KEY</span>
        </p>
      </div>
    </div>
  );
}
