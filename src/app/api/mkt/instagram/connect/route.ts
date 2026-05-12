import { NextResponse } from "next/server";

export async function GET() {
  const appId       = process.env.META_APP_ID;
  const redirectUri = process.env.NEXT_PUBLIC_BASE_URL + "/api/mkt/instagram/callback";

  if (!appId) {
    return NextResponse.json({ error: "META_APP_ID 환경변수가 설정되지 않았습니다" }, { status: 500 });
  }

  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",");

  const oauthUrl =
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_type=code`;

  return NextResponse.redirect(oauthUrl);
}
