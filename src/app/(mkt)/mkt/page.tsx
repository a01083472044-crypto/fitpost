"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMktAccounts, getMktPosts, type MktAccount, type MktPost } from "../../lib/mkt";

export default function MktDashboard() {
  const [accounts, setAccounts] = useState<MktAccount[]>([]);
  const [posts, setPosts] = useState<MktPost[]>([]);

  useEffect(() => {
    setAccounts(getMktAccounts());
    setPosts(getMktPosts());
  }, []);

  const scheduled = posts.filter((p) => p.status === "scheduled");
  const published = posts.filter((p) => p.status === "published");
  const drafts    = posts.filter((p) => p.status === "draft");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
        <p className="text-sm text-gray-500 mt-1">
          연결된 계정과 콘텐츠 현황을 확인하세요
        </p>
      </div>

      {/* 연결 계정 없을 때 안내 */}
      {accounts.length === 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
          <span className="text-2xl">🔗</span>
          <div>
            <p className="font-medium text-amber-800">아직 연결된 계정이 없습니다</p>
            <p className="text-sm text-amber-700 mt-1">
              인스타그램 비즈니스 계정을 연결하면 자동 발송을 시작할 수 있습니다
            </p>
            <Link
              href="/mkt/connect"
              className="inline-block mt-3 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
            >
              계정 연결하기
            </Link>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "연결 계정", value: accounts.length, icon: "🔗", color: "bg-indigo-50 text-indigo-700" },
          { label: "예약 발송", value: scheduled.length, icon: "📅", color: "bg-blue-50 text-blue-700" },
          { label: "발행 완료", value: published.length, icon: "✅", color: "bg-green-50 text-green-700" },
          { label: "임시 저장", value: drafts.length, icon: "📝", color: "bg-gray-100 text-gray-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium ${stat.color} mb-3`}>
              <span>{stat.icon}</span>
              {stat.label}
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 빠른 실행 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/mkt/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-6 transition-colors"
        >
          <div className="text-3xl mb-3">✏️</div>
          <div className="font-semibold text-lg">콘텐츠 생성</div>
          <p className="text-indigo-200 text-sm mt-1">
            AI가 인스타 캡션 + 해시태그 + 블로그 초안을 자동 생성
          </p>
        </Link>
        <Link
          href="/mkt/schedule"
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-6 transition-colors"
        >
          <div className="text-3xl mb-3">📅</div>
          <div className="font-semibold text-lg text-gray-900">예약 관리</div>
          <p className="text-gray-500 text-sm mt-1">
            예약된 포스트 확인 및 즉시 발송
          </p>
        </Link>
      </div>

      {/* 최근 포스트 */}
      {posts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 font-semibold text-gray-800">
            최근 포스트
          </div>
          <div className="divide-y divide-gray-100">
            {posts.slice(-5).reverse().map((post) => (
              <div key={post.id} className="p-5 flex items-start gap-4">
                {post.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">
                    📷
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2">{post.caption || "(캡션 없음)"}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.status === "published" ? "bg-green-100 text-green-700" :
                      post.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                      post.status === "failed"    ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {post.status === "published" ? "발행됨" :
                       post.status === "scheduled" ? "예약됨" :
                       post.status === "failed"    ? "실패" : "임시저장"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
