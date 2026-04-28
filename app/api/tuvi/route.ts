import { NextRequest, NextResponse } from "next/server";
import { generateTuviAI } from "@/lib/ai-tuvi";

export async function POST(req: NextRequest) {
  const { hoTen, tuTru, banMenh, conGiap, cungMenh, loai } = await req.json();

  try {
    const result = await generateTuviAI(
      { hoTen, tuTru, banMenh, conGiap, cungMenh, loai },
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error("AI error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
