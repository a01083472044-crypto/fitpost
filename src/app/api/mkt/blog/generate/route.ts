import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { keyword, category } = await req.json();

  if (!keyword?.trim()) {
    return NextResponse.json({ error: "키워드가 필요합니다" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다" }, { status: 500 });
  }

  const systemPrompt = `당신은 네이버 블로그 SEO 전문가입니다.
네이버 검색 상위 노출에 최적화된 블로그 글을 작성해주세요.

네이버 SEO 핵심 규칙:
1. 제목에 타겟 키워드 반드시 포함 (앞부분에 위치)
2. 본문 2500-3500자 분량
3. 타겟 키워드를 자연스럽게 8-12회 반복
4. 소제목(##)을 4-6개 사용
5. 첫 문단에 키워드 포함
6. 독자에게 유익한 정보 중심 (정보성 글이 상위 노출 유리)
7. 구어체 사용 (딱딱하지 않게)
8. 해시태그 12-15개

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "제목",
  "content": "본문 전체 (마크다운 소제목 ## 사용, 줄바꿈 포함)",
  "hashtags": ["#태그1", "#태그2", ...],
  "seoScore": 85,
  "keywordCount": 10,
  "charCount": 2800,
  "tips": ["이 글에 대한 구체적인 SEO 팁 1", "팁 2", "팁 3"]
}`;

  const userPrompt = `업종: ${category}
타겟 키워드: "${keyword}"

위 키워드로 네이버 상위 노출 최적화 블로그 글을 작성해주세요.
실제 피트니스 업체 블로그처럼 자연스럽고 유익하게 작성하세요.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    );

    const data = await res.json();
    const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI 응답 파싱 실패");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
