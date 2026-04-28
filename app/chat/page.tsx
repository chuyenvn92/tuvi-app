"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { solarToLunar, getCanChiNam, getBanMenh, getCungMenh, getTuTru, CON_GIAP_INFO } from "@/lib/tuvi";

interface Profile { hoTen: string; ngaySinh: string; gioSinh: string; gioiTinh: string; }
interface Message { role: "user" | "assistant"; content: string; }

const QUICK_QUESTIONS = [
  "Tháng này tôi hợp làm gì?",
  "Tôi hợp nghề gì theo bản mệnh?",
  "Năm nay tình duyên thế nào?",
  "Màu sắc và hướng hợp với tôi?",
  "Tôi có hợp với người tuổi Ngọ không?",
  "Giờ nào trong ngày tốt nhất cho tôi?",
];

const NGU_HANH_COLOR: Record<string, string> = {
  Kim: "#FFD700", Mộc: "#4ade80", Thủy: "#60a5fa", Hỏa: "#f87171", Thổ: "#d97706",
};

export default function ChatPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conGiap, setConGiap] = useState("");
  const [accentColor, setAccentColor] = useState("#a855f7");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = localStorage.getItem("tuvi_profile");
    if (!data) { router.push("/"); return; }
    const p: Profile = JSON.parse(data);
    setProfile(p);

    const d = new Date(p.ngaySinh);
    const [, thangAm, namAm] = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
    const { chi } = getCanChiNam(namAm);
    const banMenh = getBanMenh(namAm);
    const cungMenh = getCungMenh(thangAm, p.gioSinh);
    const tuTru = getTuTru(d.getDate(), d.getMonth() + 1, d.getFullYear(), p.gioSinh, thangAm, namAm);

    setConGiap(chi);
    setAccentColor(NGU_HANH_COLOR[banMenh.nguHanh] ?? "#a855f7");
    setProfileData({
      hoTen: p.hoTen,
      ngaySinh: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
      gioSinh: p.gioSinh,
      gioiTinh: p.gioiTinh,
      conGiap: chi,
      banMenh: banMenh.nguHanh,
      banMenhTen: banMenh.tenGoi,
      cungMenh,
      tuTru,
    });

    // Lời chào ban đầu
    setMessages([{
      role: "assistant",
      content: `Xin chào ${p.hoTen}! 👋 Tôi là trợ lý tử vi AI của bạn. Dựa trên Tứ Trụ và bản mệnh của bạn, tôi có thể giải đáp các câu hỏi về vận hạn, tình duyên, công danh hay bất kỳ điều gì bạn muốn tìm hiểu. Bạn muốn hỏi gì hôm nay?`,
    }]);
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !profileData) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, profile: profileData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Lỗi kết nối");
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Xin lỗi, tôi đang bận một chút. Bạn thử lại sau nhé 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!profile) return null;

  const conGiapEmoji = CON_GIAP_INFO[conGiap]?.emoji ?? "✨";

  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #0d0820 0%, #150d2e 60%, #0a0818 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 z-10"
        style={{ background: "rgba(13,8,32,0.95)", borderBottom: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(10px)" }}>
        <button onClick={() => router.push("/tuvi")} className="text-sm px-3 py-1.5 rounded-xl"
          style={{ color: "#9b7fc7", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
          ← Quay lại
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">{conGiapEmoji}</span>
          <span className="font-bold text-sm" style={{ color: "#d8b4fe" }}>Chat tử vi AI</span>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-2" style={{ paddingBottom: 160 }}>
        <div className="max-w-md mx-auto flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <span className="text-xl mr-2 mt-1 flex-shrink-0">{conGiapEmoji}</span>
              )}
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6"
                style={msg.role === "user" ? {
                  background: `linear-gradient(135deg, rgba(109,40,217,0.6), rgba(168,85,247,0.6))`,
                  color: "white",
                  borderBottomRightRadius: 4,
                } : {
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(168,85,247,0.15)",
                  color: "#e2d9f3",
                  borderBottomLeftRadius: 4,
                }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <span className="text-xl mr-2 mt-1">{conGiapEmoji}</span>
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(168,85,247,0.15)", borderBottomLeftRadius: 4 }}>
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: accentColor, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick questions + Input — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20"
        style={{ background: "rgba(13,8,32,0.97)", borderTop: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(10px)" }}>
        <div className="max-w-md mx-auto px-4 pt-3 pb-4">
          {/* Quick chips — chỉ hiển thị khi chưa có cuộc hội thoại nhiều */}
          {messages.length <= 2 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", color: "#c4b0e0", whiteSpace: "nowrap" }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Hỏi về vận hạn, tình duyên, công danh..."
              rows={1}
              className="flex-1 resize-none text-sm py-3 px-4 rounded-2xl outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(168,85,247,0.25)",
                color: "white",
                maxHeight: 100,
                colorScheme: "dark",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              style={{
                background: (!input.trim() || loading) ? "rgba(168,85,247,0.2)" : `linear-gradient(135deg, #6d28d9, #a855f7)`,
                opacity: (!input.trim() || loading) ? 0.5 : 1,
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
