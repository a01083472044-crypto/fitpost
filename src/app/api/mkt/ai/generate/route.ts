import { NextRequest, NextResponse } from "next/server";

type GenerateBody = {
  topic: string;
  tone: string;
  gymName?: string;
  specialOffer?: string;
};

export async function POST(req: NextRequest) {
  const body: GenerateBody = await req.json();
  const { topic, tone, gymName, specialOffer } = body;

  if (!topic) {
    return NextResponse.json({ error: "topic이 필요합니다" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다" }, { status: 500 });
  }

  const prompt = `당신은 한국 헬스장/PT샵 전문 SNS 마케터입니다.
아래 정보를 바탕으로 콘텐츠를 생성해주세요.

헬스장명: ${gymName || "우리 헬스장"}
오늘 주제: ${topic}
톤앤매너: ${tone || "친근하고 동기부여가 되는"}
${specialOffer ? `특별 이벤트: ${specialOffer}` : ""}

다음 형식으로 정확히 응답하세요:

===CAPTION===
인스타그램 캡션 (이모지 포함, 3-5문장, 한국어)

===HASHTAGS===
해시태그 15-20개 (# 포함, 공백으로 구분)

===BLOG===
네이버 블로그 초안 (제목 포함, 500-800자, 마크다운 형식, SEO 친화적)`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
      }),
    }
  );

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    return NextResponse.json({ error: "AI 응답 실패", detail: data }, { status: 500 });
  }

  const captionMatch  = text.match(/===CAPTION===\n([\s\S]*?)(?===HASHTAGS===)/);
  const hashtagsMatch = text.match(/===HASHTAGS===\n([\s\S]*?)(?===BLOG===)/);
  const blogMatch     = text.match(/===BLOG===\n([\s\S]*?)$/);

  const caption     = captionMatch?.[1]?.trim() ?? "";
  const hashtags    = (hashtagsMatch?.[1]?.trim() ?? "").split(/\s+/).filter((h) => h.startsWith("#"));
  const blogContent = blogMatch?.[1]?.trim() ?? "";

  return NextResponse.json({ caption, hashtags, blogContent });
}
