import { NextRequest, NextResponse } from "next/server";

type PublishBody = {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
};

export async function POST(req: NextRequest) {
  const body: PublishBody = await req.json();
  const { igUserId, accessToken, imageUrl, caption } = body;

  if (!igUserId || !accessToken || !imageUrl) {
    return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
  }

  // 1. 미디어 컨테이너 생성
  const containerRes = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    }
  );
  const containerData = await containerRes.json();

  if (!containerData.id) {
    return NextResponse.json(
      { error: "미디어 컨테이너 생성 실패", detail: containerData },
      { status: 500 }
    );
  }

  // 2. 게시
  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
    }
  );
  const publishData = await publishRes.json();

  if (!publishData.id) {
    return NextResponse.json(
      { error: "게시 실패", detail: publishData },
      { status: 500 }
    );
  }

  return NextResponse.json({ mediaId: publishData.id });
}
