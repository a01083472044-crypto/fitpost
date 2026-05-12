import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  const base        = process.env.NEXT_PUBLIC_BASE_URL!;
  const appId       = process.env.META_APP_ID!;
  const appSecret   = process.env.META_APP_SECRET!;
  const redirectUri = base + "/api/mkt/instagram/callback";

  if (error || !code) {
    return NextResponse.redirect(`${base}/mkt/connect?error=${error ?? "no_code"}`);
  }

  // 1. code → access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token` +
    `?client_id=${appId}` +
    `&client_secret=${appSecret}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code=${code}`
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${base}/mkt/connect?error=token_failed`);
  }
  const shortToken: string = tokenData.access_token;

  // 2. short-lived → long-lived token
  const longRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${appId}` +
    `&client_secret=${appSecret}` +
    `&fb_exchange_token=${shortToken}`
  );
  const longData = await longRes.json();
  const longToken: string = longData.access_token ?? shortToken;

  // 3. 연결된 Facebook 페이지 목록
  const pagesRes  = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`);
  const pagesData = await pagesRes.json();
  const page      = pagesData.data?.[0];

  if (!page) {
    return NextResponse.redirect(`${base}/mkt/connect?error=no_page`);
  }

  const pageToken: string = page.access_token;
  const pageId:    string = page.id;

  // 4. 페이지에 연결된 Instagram 비즈니스 계정
  const igRes  = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
  );
  const igData = await igRes.json();
  const igId: string | undefined = igData.instagram_business_account?.id;

  if (!igId) {
    return NextResponse.redirect(`${base}/mkt/connect?error=no_instagram`);
  }

  // 5. 인스타 사용자명 조회
  const igUserRes  = await fetch(
    `https://graph.facebook.com/v18.0/${igId}?fields=username&access_token=${pageToken}`
  );
  const igUserData = await igUserRes.json();
  const username: string = igUserData.username ?? "unknown";

  // 6. 연결 정보를 쿼리 파라미터로 /mkt/connect 페이지에 전달 (클라이언트에서 localStorage 저장)
  const params = new URLSearchParams({
    success: "1",
    igId,
    username,
    pageId,
    token: pageToken,
  });

  return NextResponse.redirect(`${base}/mkt/connect?${params}`);
}
