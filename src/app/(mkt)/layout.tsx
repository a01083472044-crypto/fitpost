import type { Metadata } from "next";
import MktNav from "./MktNav";

export const metadata: Metadata = {
  title: "FitPost — 피트니스 마케팅 자동화",
  description: "헬스장/PT샵을 위한 SNS 마케팅 자동화 플랫폼",
};

export default function MktLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <MktNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
