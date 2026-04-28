import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(ip, "chat", 15, 60_000); // 15 req/phút/IP
  if (!allowed) {
    return NextResponse.json(
      { error: "Bạn đang gửi quá nhiều tin nhắn. Vui lòng chờ một chút rồi thử lại." },
      { status: 429 }
    );
  }

  const { messages, profile } = await req.json();

  const systemPrompt = `Bạn là trợ lý tử vi AI, chuyên tư vấn dựa trên hệ thống Tứ Trụ và Ngũ Hành của người dùng.

Thông tin người dùng:
- Họ tên: ${profile.hoTen}
- Ngày sinh dương lịch: ${profile.ngaySinh}
- Giờ sinh: ${profile.gioSinh}
- Giới tính: ${profile.gioiTinh === "nam" ? "Nam" : "Nữ"}
- Con giáp: Tuổi ${profile.conGiap}
- Bản mệnh: ${profile.banMenh} (${profile.banMenhTen})
- Cung mệnh: ${profile.cungMenh}
- Tứ Trụ:
  + Năm: ${profile.tuTru.nam.can} ${profile.tuTru.nam.chi}
  + Tháng: ${profile.tuTru.thang.can} ${profile.tuTru.thang.chi}
  + Ngày: ${profile.tuTru.ngay.can} ${profile.tuTru.ngay.chi}
  + Giờ: ${profile.tuTru.gio.can} ${profile.tuTru.gio.chi}

Nguyên tắc trả lời:
1. Trả lời bằng tiếng Việt, ngắn gọn và thực tế (2-5 câu).
2. Luôn dựa trên dữ liệu Tứ Trụ của người dùng ở trên.
3. Nhắc nhở rằng đây chỉ là tham khảo, không phải dự đoán tuyệt đối.
4. Không phán xét hay dùng ngôn ngữ tiêu cực.
5. Nếu câu hỏi không liên quan đến tử vi/phong thủy, hướng lại chủ đề một cách nhẹ nhàng.`;

  const contents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Gemini error");

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Xin lỗi, tôi không thể trả lời lúc này.";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Chat AI error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
