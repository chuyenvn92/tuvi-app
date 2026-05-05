import { NextRequest, NextResponse } from "next/server";
import { generateTuviAI } from "@/lib/ai-tuvi";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(ip, "tuvi", 10, 5 * 60_000); // 10 req/5 phút/IP
  if (!allowed) {
    return NextResponse.json(
      { error: "Vui lòng chờ vài phút trước khi tải lại." },
      { status: 429 }
    );
  }

  const { hoTen, tuTru, banMenh, conGiap, cungMenh, loai } = await req.json();

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' };

  try {
    const result = await generateTuviAI(
      { hoTen, tuTru, banMenh, conGiap, cungMenh, loai },
    );
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (e) {
    console.error("AI error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
  });
}
