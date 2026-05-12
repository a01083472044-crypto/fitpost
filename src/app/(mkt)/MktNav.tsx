"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/mkt", label: "대시보드", icon: "📊" },
  { href: "/mkt/connect", label: "계정 연동", icon: "🔗" },
  { href: "/mkt/create", label: "콘텐츠 생성", icon: "✏️" },
  { href: "/mkt/schedule", label: "예약 관리", icon: "📅" },
];

export default function MktNav() {
  const pathname = usePathname();
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">FitPost</h1>
        <p className="text-xs text-gray-500 mt-0.5">피트니스 마케팅 자동화</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
        FitPost v0.1
      </div>
    </aside>
  );
}
