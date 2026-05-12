import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

type GenerateBody = {
  service: "kling" | "runway" | "luma";
  prompt: string;
  duration: number;
};

function makeKlingJWT(): string {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;
  if (!accessKey || !secretKey) throw new Error("KLING_ACCESS_KEY / KLING_SECRET_KEY 환경변수가 설정되지 않았습니다");

  const header  = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: accessKey, exp: now + 1800, nbf: now - 5 })).toString("base64url");
  const sig     = crypto.createHmac("sha256", secretKey).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

// ── Kling AI ────────────────────────────────────────────────────────────────
async function generateKling(prompt: string, duration: number) {
  const token = makeKlingJWT();

  const createRes = await fetch("https://api.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      model_name: "kling-v1-6",
      prompt,
      duration,
      aspect_ratio: "9:16",
      cfg_scale: 0.5,
    }),
  });
  const createData = await createRes.json();
  if (!createData.data?.task_id) throw new Error("Kling 작업 생성 실패: " + JSON.stringify(createData));

  const taskId: string = createData.data.task_id;

  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const jwt = makeKlingJWT(); // JWT는 짧게 만료되므로 매번 재생성
    const statusRes  = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
      headers: { "Authorization": `Bearer ${jwt}` },
    });
    const statusData = await statusRes.json();
    const status     = statusData.data?.task_status;

    if (status === "succeed") {
      const videoUrl = statusData.data?.task_result?.videos?.[0]?.url;
      if (!videoUrl) throw new Error("영상 URL을 가져올 수 없습니다");
      return { videoUrl, taskId };
    }
    if (status === "failed") throw new Error("Kling 영상 생성 실패: " + statusData.data?.task_status_msg);
  }
  throw new Error("영상 생성 시간 초과 (3분)");
}

// ── Runway Gen-3 ─────────────────────────────────────────────────────────────
async function generateRunway(prompt: string, duration: number) {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) throw new Error("RUNWAY_API_KEY 환경변수가 설정되지 않았습니다");

  const createRes = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({
      model: "gen3a_turbo",
      promptText: prompt,
      duration,
      ratio: "768:1280",
    }),
  });
  const createData = await createRes.json();
  if (!createData.id) throw new Error("Runway 작업 생성 실패: " + JSON.stringify(createData));

  const taskId: string = createData.id;

  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes  = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
    });
    const statusData = await statusRes.json();

    if (statusData.status === "SUCCEEDED") {
      const videoUrl = statusData.output?.[0];
      if (!videoUrl) throw new Error("영상 URL을 가져올 수 없습니다");
      return { videoUrl, taskId };
    }
    if (statusData.status === "FAILED") throw new Error("Runway 영상 생성 실패");
  }
  throw new Error("영상 생성 시간 초과 (3분)");
}

// ── Luma Dream Machine ────────────────────────────────────────────────────────
async function generateLuma(prompt: string, duration: number) {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) throw new Error("LUMA_API_KEY 환경변수가 설정되지 않았습니다");

  const createRes = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: "9:16",
      duration: `${duration}s`,
    }),
  });
  const createData = await createRes.json();
  if (!createData.id) throw new Error("Luma 작업 생성 실패: " + JSON.stringify(createData));

  const taskId: string = createData.id;

  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes  = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    const statusData = await statusRes.json();

    if (statusData.state === "completed") {
      const videoUrl = statusData.assets?.video;
      if (!videoUrl) throw new Error("영상 URL을 가져올 수 없습니다");
      return { videoUrl, taskId };
    }
    if (statusData.state === "failed") throw new Error("Luma 영상 생성 실패: " + statusData.failure_reason);
  }
  throw new Error("영상 생성 시간 초과 (3분)");
}

// ── 라우트 핸들러 ─────────────────────────────────────────────────────────────
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body: GenerateBody = await req.json();
  const { service, prompt, duration } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt가 필요합니다" }, { status: 400 });
  }

  try {
    let result;
    if (service === "kling")       result = await generateKling(prompt, duration);
    else if (service === "runway") result = await generateRunway(prompt, duration);
    else if (service === "luma")   result = await generateLuma(prompt, duration);
    else return NextResponse.json({ error: "지원하지 않는 서비스입니다" }, { status: 400 });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
