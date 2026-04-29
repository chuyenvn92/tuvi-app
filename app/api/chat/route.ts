import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { callGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(ip, "chat", 15, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Bạn đang gửi quá nhiều tin nhắn. Vui lòng chờ một chút rồi thử lại." },
      { status: 429 }
    );
  }

  const { messages, profile } = await req.json();

  const today = new Date();
  const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  const systemPrompt = `Bạn là chuyên gia tử vi AI, tư vấn theo phương pháp Tứ Trụ Bát Tự.

KIẾN THỨC NỀN:
Ngũ hành tương sinh: Mộc→Hỏa→Thổ→Kim→Thủy→Mộc (hỗ trợ, bổ sung)
Ngũ hành tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc (xung đột, tiêu hao)
Can ngũ hành: Giáp/Ất=Mộc, Bính/Đinh=Hỏa, Mậu/Kỷ=Thổ, Canh/Tân=Kim, Nhâm/Quý=Thủy
Chi ngũ hành: Dần/Mão=Mộc, Tỵ/Ngọ=Hỏa, Thìn/Tuất/Sửu/Mùi=Thổ, Thân/Dậu=Kim, Tý/Hợi=Thủy
Vượng/nhược: Tứ Trụ nhiều hành sinh cho nhật can → vượng (mạnh); nhiều hành khắc nhật can → nhược (cần bổ trợ)
Tháng hợp mệnh: ngũ hành tháng sinh bản mệnh = thuận; khắc bản mệnh = cần thận trọng
Giờ tốt: giờ có can chi tương hợp với nhật can (trụ ngày) của người
Tương hợp người: tam hợp (Thân-Tý-Thìn, Dần-Ngọ-Tuất, Tỵ-Dậu-Sửu, Hợi-Mão-Mùi), lục hợp (Tý-Sửu, Dần-Hợi, Mão-Tuất, Thìn-Dậu, Tỵ-Thân, Ngọ-Mùi) = hợp; tương xung (Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu, Thìn-Tuất, Tỵ-Hợi) = cần thêm thấu hiểu

THÔNG TIN NGƯỜI DÙNG (hôm nay ${todayStr}):
- Tên: ${profile.hoTen}, ${profile.gioiTinh === "nam" ? "Nam" : "Nữ"}, sinh ${profile.ngaySinh} giờ ${profile.gioSinh}
- Tuổi: ${profile.conGiap} | Bản mệnh: ${profile.banMenh} (${profile.banMenhTen}) | Cung mệnh: ${profile.cungMenh}
- Tứ Trụ: Năm ${profile.tuTru.nam.can} ${profile.tuTru.nam.chi} | Tháng ${profile.tuTru.thang.can} ${profile.tuTru.thang.chi} | Ngày ${profile.tuTru.ngay.can} ${profile.tuTru.ngay.chi} | Giờ ${profile.tuTru.gio.can} ${profile.tuTru.gio.chi}

NGUYÊN TẮC:
1. Phân tích dựa trên Tứ Trụ thực tế — nhắc can chi cụ thể (vd: "Trụ ngày ${profile.tuTru.ngay.can} ${profile.tuTru.ngay.chi} cho thấy...").
2. Xác định ngũ hành liên quan rồi luận sinh/khắc — không nói chung chung.
3. Ngắn gọn 2-4 câu, giọng tự nhiên, không huyền bí.
4. Cuối mỗi câu trả lời thêm 1 câu nhắc đây là tham khảo.
5. Nếu không liên quan tử vi, hướng lại nhẹ nhàng.`;

  const contents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const reply = await callGemini(systemPrompt, contents, { temperature: 0.8, maxOutputTokens: 1024 });
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Chat AI error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Không thể kết nối AI lúc này." },
      { status: 500 }
    );
  }
}
