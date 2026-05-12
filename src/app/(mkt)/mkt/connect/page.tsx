"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getMktAccounts, saveMktAccount, removeMktAccount, type MktAccount } from "../../../lib/mkt";

function ConnectContent() {
  const params   = useSearchParams();
  const [accounts, setAccounts] = useState<MktAccount[]>([]);
  const [toast, setToast]       = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    setAccounts(getMktAccounts());

    if (params.get("success") === "1") {
      const account: MktAccount = {
        id:              `ig_${params.get("igId")}`,
        platform:        "instagram",
        username:        params.get("username") ?? "unknown",
        instagramUserId: params.get("igId") ?? "",
        pageId:          params.get("pageId") ?? "",
        accessToken:     params.get("token") ?? "",
      };
      saveMktAccount(account);
      setAccounts(getMktAccounts());
      setToast({ ok: true, msg: `@${account.username} 연결 완료!` });
      window.history.replaceState({}, "", "/mkt/connect");
    } else if (params.get("error")) {
      const errMap: Record<string, string> = {
        no_page:      "Facebook 페이지가 없습니다. 비즈니스 페이지를 먼저 만들어주세요.",
        no_instagram: "인스타그램 비즈니스 계정이 Facebook 페이지에 연결되지 않았습니다.",
        token_failed: "인증 토큰 발급에 실패했습니다. 다시 시도해주세요.",
        no_code:      "인증이 취소됐습니다.",
      };
      setToast({ ok: false, msg: errMap[params.get("error")!] ?? "연결 실패" });
      window.history.replaceState({}, "", "/mkt/connect");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function disconnect(id: string) {
    removeMktAccount(id);
    setAccounts(getMktAccounts());
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">계정 연동</h2>
        <p className="text-sm text-gray-500 mt-1">SNS 계정을 연결해 자동 발송을 활성화하세요</p>
      </div>

      {toast && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
          toast.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mb-8 bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 font-semibold text-gray-800 text-sm">
            연결된 계정
          </div>
          <div className="divide-y divide-gray-100">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                    {acc.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">@{acc.username}</p>
                    <p className="text-xs text-gray-500">Instagram 비즈니스</p>
                  </div>
                </div>
                <button
                  onClick={() => disconnect(acc.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  연결 해제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white text-xl">
            📸
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Instagram</h3>
            <p className="text-xs text-gray-500">비즈니스 / 크리에이터 계정 필요</p>
          </div>
        </div>

        <ul className="text-sm text-gray-600 space-y-2 mb-6">
          {[
            "사진, 캐러셀, 릴스 자동 업로드",
            "예약 발송 지원",
            "캡션 + 해시태그 자동 생성",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-green-500">✓</span> {f}
            </li>
          ))}
        </ul>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5 text-xs text-amber-700">
          <strong>사전 조건:</strong> Facebook 비즈니스 페이지에 Instagram 계정이 연결되어 있어야 합니다
        </div>

        <a
          href="/api/mkt/instagram/connect"
          className="block w-full text-center py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Instagram 연결하기
        </a>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-dashed border-gray-300 p-6 opacity-60">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white text-xl">
            N
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">네이버 블로그</h3>
            <p className="text-xs text-gray-500">공식 API 미지원 — AI 초안 생성 지원</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          네이버 블로그는 직접 연동이 불가능합니다. 대신 AI가 작성한 블로그 초안을 복사해 직접 업로드할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">로딩 중...</div>}>
      <ConnectContent />
    </Suspense>
  );
}
