"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  solarToLunar, getCanChiNam, getBanMenh, getCungMenh, getTuTru,
  getThongDiepHomNay, getGioTotXau, getVanHanThang,
  NGU_HANH_INFO, CON_GIAP_INFO, MAY_MAN_INFO,
  type DanhGiaThamKhao, type VanHanThangInfo, type TruCanChi,
} from "@/lib/tuvi";
import type { AIHomNay, AIThang, TuviLoai, TuviPayload } from "@/lib/ai-tuvi";
import { supabase, signInWithGoogle, signOut, saveProfileToCloud, loadProfileFromCloud } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface Profile { hoTen: string; ngaySinh: string; gioSinh: string; gioiTinh: string; }
interface TuviData {
  canChiNam: string; conGiap: string;
  banMenh: { nguHanh: string; tenGoi: string };
  cungMenh: string;
  tuTru: { nam: TruCanChi; thang: TruCanChi; ngay: TruCanChi; gio: TruCanChi };
  thongDiepHomNay: DanhGiaThamKhao;
  thangAm: number; namAm: number;
  gioTot: string[]; gioXau: string[]; chiNgay: string;
  vanHan: VanHanThangInfo;
}

interface TuviAICache {
  homNay: AIHomNay | null;
  thang: AIThang | null;
}

const NGU_HANH_COLOR: Record<string, string> = {
  Kim: "#FFD700", Mộc: "#4ade80", Thủy: "#60a5fa", Hỏa: "#f87171", Thổ: "#d97706",
};

function tinhTuvi(p: Profile): TuviData {
  const d = new Date(p.ngaySinh);
  const [, thangAm, namAm] = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
  const { canChi, chi } = getCanChiNam(namAm);
  const banMenh = getBanMenh(namAm);
  const { gioTot, gioXau, chiNgay } = getGioTotXau();
  const cungMenh = getCungMenh(thangAm, p.gioSinh);
  const tuTru = getTuTru(d.getDate(), d.getMonth() + 1, d.getFullYear(), p.gioSinh, thangAm, namAm);
  return {
    canChiNam: canChi, conGiap: chi, banMenh,
    cungMenh,
    tuTru,
    thongDiepHomNay: getThongDiepHomNay(chi, chiNgay),
    thangAm, namAm, gioTot, gioXau, chiNgay,
    vanHan: getVanHanThang(banMenh.nguHanh, thangAm),
  };
}

function StarBg() {
  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i, x: (i * 137.5) % 100, y: (i * 97.3) % 100,
    size: i % 3 === 0 ? 2 : 1, opacity: 0.1 + (i % 4) * 0.08,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map(s => (
        <div key={s.id} className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: s.opacity }} />
      ))}
    </div>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="w-full max-w-md rounded-2xl mb-4 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(10px)" }}>
      {accent && <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />}
      <div className="p-5">{children}</div>
    </div>
  );
}

// Vòng tròn điểm số SVG (dự đoán AI)
function ScoreRing({ score, label, icon }: { score: number; label: string; icon: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 10));
  const color = score >= 8 ? "#4ade80" : score >= 6 ? "#facc15" : "#f87171";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg leading-none">{icon}</span>
          <span className="text-xs font-bold leading-none mt-0.5" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs" style={{ color: "#9b7fc7" }}>{label}</span>
    </div>
  );
}

function readAICache(cacheKey: string): TuviAICache | null {
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;

  try {
    return JSON.parse(cached) as TuviAICache;
  } catch {
    localStorage.removeItem(cacheKey);
    return null;
  }
}

function getAICacheKey(profile: Profile, date: Date) {
  return [
    "tuvi_ai_pred_v1",
    profile.hoTen.trim(),
    profile.ngaySinh,
    profile.gioSinh,
    profile.gioiTinh,
    date.toDateString(),
  ].join("_");
}

async function fetchAIResult<TLoai extends TuviLoai>(
  payload: Omit<TuviPayload, "loai">,
  loai: TLoai
) {
  const res = await fetch("/api/tuvi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, loai }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `API /api/tuvi failed for ${loai}`);
  }
  return data;
}

export default function TuviPage() {
  const router = useRouter();
  const initializedRef = useRef(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tuvi, setTuvi] = useState<TuviData | null>(null);
  const [aiHomNay, setAiHomNay] = useState<AIHomNay | null>(null);
  const [aiThang, setAiThang] = useState<AIThang | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const data = localStorage.getItem("tuvi_profile");
    if (!data) { router.push("/"); return; }
    const p: Profile = JSON.parse(data);
    setProfile(p);
    const t = tinhTuvi(p);
    setTuvi(t);

    // AI dự đoán — cache theo ngày
    const today = new Date();
    const cacheKey = getAICacheKey(p, today);
    const cached = readAICache(cacheKey);
    if (cached) {
      setAiHomNay(cached.homNay);
      setAiThang(cached.thang);
      return;
    }

    setLoadingAI(true);
    setAiError(null);
    const payload: Omit<TuviPayload, "loai"> = {
      hoTen: p.hoTen,
      tuTru: t.tuTru,
      banMenh: t.banMenh,
      conGiap: t.conGiap,
      cungMenh: t.cungMenh,
    };

    Promise.allSettled([
      fetchAIResult(payload, "homNay"),
      fetchAIResult(payload, "thang"),
    ]).then(([homNayResult, thangResult]) => {
      const nextHomNay = homNayResult.status === "fulfilled" ? (homNayResult.value as AIHomNay) : null;
      const nextThang = thangResult.status === "fulfilled" ? (thangResult.value as AIThang) : null;

      if (nextHomNay) setAiHomNay(nextHomNay);
      if (nextThang) setAiThang(nextThang);

      if (nextHomNay || nextThang) {
        localStorage.setItem(cacheKey, JSON.stringify({ homNay: nextHomNay, thang: nextThang }));
      }

      const errors = [
        homNayResult.status === "rejected" ? homNayResult.reason : null,
        thangResult.status === "rejected" ? thangResult.reason : null,
      ].filter(Boolean);

      if (errors.length > 0) {
        const firstError = errors[0];
        setAiError(firstError instanceof Error ? firstError.message : "Không thể tải một phần dự đoán AI lúc này.");
      }
    }).finally(() => setLoadingAI(false));
  }, [router]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) setSynced(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (event === "SIGNED_IN" && u) {
        const p = localStorage.getItem("tuvi_profile");
        if (p) {
          const parsed = JSON.parse(p);
          await saveProfileToCloud({ ho_ten: parsed.hoTen, ngay_sinh: parsed.ngaySinh, gio_sinh: parsed.gioSinh, gioi_tinh: parsed.gioiTinh });
        }
        setSynced(true);
      }
      if (event === "SIGNED_OUT") setSynced(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!profile || !tuvi) return null;

  function handleShare() {
    if (!profile || !tuvi) return;
    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const scoreText = aiHomNay
      ? `🍀 May mắn ${aiHomNay.mayMan}/10 | 💰 Tài lộc ${aiHomNay.taiLoc}/10 | ❤️ Tình duyên ${aiHomNay.tinhDuyen}/10`
      : `Tuổi ${tuvi.conGiap} • Mệnh ${tuvi.banMenh.nguHanh}`;
    const summaryLine = aiHomNay ? `\n"${aiHomNay.tomTat}"` : "";
    const text = `✨ Tử vi của ${profile.hoTen} hôm nay (${todayStr})\n${scoreText}${summaryLine}\n\nXem tử vi của bạn: ${window.location.origin}`;
    if (typeof navigator.share === "function") {
      navigator.share({ title: "Tử Vi AI", text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const date = new Date(profile.ngaySinh);
  const nguHanhInfo = NGU_HANH_INFO[tuvi.banMenh.nguHanh];
  const conGiapInfo = CON_GIAP_INFO[tuvi.conGiap];
  const accentColor = NGU_HANH_COLOR[tuvi.banMenh.nguHanh] ?? "#a855f7";
  const today = new Date();
  const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 pb-10 relative"
      style={{ background: "linear-gradient(160deg, #0d0820 0%, #150d2e 60%, #0a0818 100%)" }}>
      <StarBg />

      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between py-5 relative z-10">
        <button onClick={() => router.push("/")}
          className="text-sm px-3 py-1.5 rounded-xl"
          style={{ color: "#9b7fc7", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
          ← Sửa
        </button>
        <span className="font-bold" style={{ color: "#d8b4fe" }}>☯️ Tử Vi</span>
        <button onClick={handleShare}
          className="text-sm px-3 py-1.5 rounded-xl transition-all"
          style={{ color: copied ? "#4ade80" : "#9b7fc7", background: "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(74,222,128,0.4)" : "rgba(168,85,247,0.2)"}` }}>
          {copied ? "✓ Đã sao chép" : "Chia sẻ"}
        </button>
      </div>

      {/* Hero card */}
      <div className="w-full max-w-md rounded-3xl mb-4 overflow-hidden relative z-10"
        style={{ background: `linear-gradient(135deg, rgba(30,15,60,0.9), rgba(20,10,40,0.9))`, border: `1px solid ${accentColor}33` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(circle at 80% 50%, ${accentColor}, transparent 60%)` }} />
        <div className="p-6 relative flex items-center gap-5">
          <div className="text-6xl leading-none" style={{ filter: `drop-shadow(0 0 16px ${accentColor}88)` }}>
            {conGiapInfo?.emoji}
          </div>
          <div className="flex-1">
            <p className="font-bold text-xl text-white">{profile.hoTen}</p>
            <p className="text-sm mt-0.5" style={{ color: "#9b7fc7" }}>
              {date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}>
                {tuvi.canChiNam}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(168,85,247,0.15)", color: "#d8b4fe", border: "1px solid rgba(168,85,247,0.3)" }}>
                {tuvi.conGiap}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${nguHanhInfo?.mauSac}22`, color: nguHanhInfo?.mauSac, border: `1px solid ${nguHanhInfo?.mauSac}44` }}>
                {nguHanhInfo?.emoji} {tuvi.banMenh.nguHanh}
              </span>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 relative">
          <p className="text-xs leading-5" style={{ color: "#9b7fc7" }}>
            Thông tin dựa trên âm lịch và Can Chi — tất cả diễn giải đều mang tính tham khảo, không phải dự đoán tuyệt đối.
          </p>
        </div>
      </div>

      {/* Sync card — chỉ hiện khi Supabase được config */}
      {supabase && (
        <div className="w-full max-w-md relative z-10 mb-4">
          {user ? (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <div className="flex items-center gap-2">
                <span className="text-sm">✅</span>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#4ade80" }}>Đã đồng bộ đám mây</p>
                  <p className="text-xs" style={{ color: "#6b4f8a" }}>{user.email}</p>
                </div>
              </div>
              <button onClick={() => signOut()}
                className="text-xs px-3 py-1.5 rounded-xl"
                style={{ color: "#6b4f8a", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}>
              <div>
                <p className="text-xs font-medium" style={{ color: "#d8b4fe" }}>☁️ Lưu hồ sơ đa thiết bị</p>
                <p className="text-xs" style={{ color: "#6b4f8a" }}>Đồng bộ giữa điện thoại và máy tính</p>
              </div>
              <button onClick={() => signInWithGoogle()}
                className="text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 flex-shrink-0"
                style={{ background: "white", color: "#1a1a1a" }}>
                <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tử vi hôm nay */}
      <div className="w-full max-w-md relative z-10">
        <Card accent={accentColor}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: "#d8b4fe" }}>⭐ Hôm nay</h2>
            <span className="text-xs" style={{ color: "#6b4f8a" }}>{todayStr}</span>
          </div>
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${tuvi.thongDiepHomNay.mauSac}33` }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${tuvi.thongDiepHomNay.mauSac}22`, color: tuvi.thongDiepHomNay.mauSac }}>
                {tuvi.thongDiepHomNay.mucDo}
              </span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#d8b4fe" }}>
                Ngày {tuvi.chiNgay}
              </span>
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: "#f3e8ff" }}>{tuvi.thongDiepHomNay.tieuDe}</p>
            <p className="text-sm leading-6" style={{ color: "#c4b0e0" }}>{tuvi.thongDiepHomNay.moTa}</p>
          </div>

          {loadingAI ? (
            <p className="text-sm text-center animate-pulse" style={{ color: "#7c5fa8" }}>
              ✨ Đang luận giải AI...
            </p>
          ) : aiError ? (
            <p className="text-sm text-center" style={{ color: "#fca5a5" }}>
              {aiError}
            </p>
          ) : aiHomNay ? (
            <div className="mt-2">
              <div className="flex justify-around mb-4">
                <ScoreRing score={aiHomNay.mayMan} label="May mắn" icon="🍀" />
                <ScoreRing score={aiHomNay.taiLoc} label="Tài lộc" icon="💰" />
                <ScoreRing score={aiHomNay.tinhDuyen} label="Tình duyên" icon="❤️" />
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#7c5fa8" }}>AI dự đoán (tham khảo)</p>
                <p className="text-sm font-medium mb-1" style={{ color: "#d8b4fe" }}>{aiHomNay.tomTat}</p>
                <p className="text-sm leading-6 mb-2" style={{ color: "#c4b0e0" }}>{aiHomNay.chiTiet}</p>
                <p className="text-xs" style={{ color: "#9b7fc7" }}>{aiHomNay.luuY}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center leading-5" style={{ color: "#7c5fa8" }}>
              Chưa có gợi ý AI. Phần trên được tính theo quan hệ địa chi.
            </p>
          )}
        </Card>

        {/* Bản mệnh */}
        <Card accent={nguHanhInfo?.mauSac}>
          <div className="flex gap-4 items-start">
            <div className="text-4xl" style={{ filter: `drop-shadow(0 0 10px ${nguHanhInfo?.mauSac}88)` }}>
              {nguHanhInfo?.emoji}
            </div>
            <div className="flex-1">
              <h2 className="font-bold mb-1" style={{ color: "#d8b4fe" }}>
                Bản mệnh {tuvi.banMenh.nguHanh}
              </h2>
              <p className="text-xs mb-2" style={{ color: nguHanhInfo?.mauSac }}>{tuvi.banMenh.tenGoi}</p>
              <p className="text-sm leading-6" style={{ color: "#c4b0e0" }}>{nguHanhInfo?.moTa}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 flex gap-4 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "#7c5fa8" }}>Âm lịch: <span style={{ color: "#d8b4fe" }}>T.{tuvi.thangAm}/{tuvi.namAm}</span></span>
            <span style={{ color: "#7c5fa8" }}>Giờ sinh: <span style={{ color: "#d8b4fe" }}>{profile.gioSinh}</span></span>
          </div>
        </Card>

        {/* Con giáp */}
        <Card accent="#a855f7">
          <div className="flex gap-4 items-start">
            <div className="text-4xl">{conGiapInfo?.emoji}</div>
            <div className="flex-1">
              <h2 className="font-bold mb-2" style={{ color: "#d8b4fe" }}>Tuổi {tuvi.conGiap}</h2>
              <p className="text-sm leading-6" style={{ color: "#c4b0e0" }}>{conGiapInfo?.moTa}</p>
            </div>
          </div>
        </Card>

        {/* Giờ tốt / xấu */}
        <Card accent="#22d3ee">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: "#d8b4fe" }}>🕐 Giờ hoàng đạo hôm nay</h2>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee" }}>
              Ngày {tuvi.chiNgay}
            </span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#4ade80" }}>✅ Giờ tốt</p>
              {tuvi.gioTot.map(g => (
                <p key={g} className="text-xs py-1" style={{ color: "#c4b0e0" }}>{g}</p>
              ))}
            </div>
            <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#f87171" }}>⚠️ Giờ xấu</p>
              {tuvi.gioXau.map(g => (
                <p key={g} className="text-xs py-1" style={{ color: "#c4b0e0" }}>{g}</p>
              ))}
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: "#7c5fa8" }}>
            Tính từ chi ngày hôm nay theo bảng hoàng đạo truyền thống — mang tính tham khảo.
          </p>
        </Card>

        {/* May mắn */}
        {MAY_MAN_INFO[tuvi.banMenh.nguHanh] && (
          <Card accent={accentColor}>
            <h2 className="font-bold mb-2" style={{ color: "#d8b4fe" }}>🍀 Gợi ý may mắn (tham khảo)</h2>
            <p className="text-xs mb-3" style={{ color: "#7c5fa8" }}>
              Gợi ý tổng quát theo ngũ hành bản mệnh — không phải dự đoán cá nhân.
            </p>
            <div className="flex flex-col gap-3">
              {/* Màu sắc */}
              <div>
                <p className="text-xs mb-2" style={{ color: "#7c5fa8" }}>Màu sắc</p>
                <div className="flex gap-2">
                  {MAY_MAN_INFO[tuvi.banMenh.nguHanh].mauSac.map(m => (
                    <div key={m.ten} className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: m.hex }} />
                      <span className="text-xs" style={{ color: "#c4b0e0" }}>{m.ten}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Con số */}
              <div>
                <p className="text-xs mb-2" style={{ color: "#7c5fa8" }}>Con số</p>
                <div className="flex gap-2">
                  {MAY_MAN_INFO[tuvi.banMenh.nguHanh].conSo.map(n => (
                    <div key={n} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}>
                      {n}
                    </div>
                  ))}
                </div>
              </div>
              {/* Hướng */}
              <div>
                <p className="text-xs mb-2" style={{ color: "#7c5fa8" }}>Hướng tốt</p>
                <div className="flex gap-2">
                  {MAY_MAN_INFO[tuvi.banMenh.nguHanh].huong.map(h => (
                    <span key={h} className="text-xs px-3 py-1 rounded-full"
                      style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}33` }}>
                      🧭 {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Vận hạn tháng */}
        <Card accent="#f59e0b">
          <h2 className="font-bold mb-3" style={{ color: "#d8b4fe" }}>
            📅 Tham khảo tháng âm {tuvi.vanHan.thang}
          </h2>
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${tuvi.vanHan.mauSac}33` }}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${tuvi.vanHan.mauSac}22`, color: tuvi.vanHan.mauSac }}>
                {tuvi.vanHan.mucDo}
              </span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#d8b4fe" }}>
                {NGU_HANH_INFO[tuvi.vanHan.nguHanhThang]?.emoji} Tháng {tuvi.vanHan.nguHanhThang}
              </span>
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: "#f3e8ff" }}>{tuvi.vanHan.tieuDe}</p>
            <p className="text-sm leading-6" style={{ color: "#c4b0e0" }}>{tuvi.vanHan.moTa}</p>
          </div>
          {loadingAI ? (
            <p className="text-sm animate-pulse" style={{ color: "#7c5fa8" }}>✨ Đang luận giải AI cho tháng...</p>
          ) : aiError ? (
            <p className="text-sm" style={{ color: "#fca5a5" }}>{aiError}</p>
          ) : aiThang ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wide" style={{ color: "#7c5fa8" }}>AI dự đoán (tham khảo)</p>
              {([
                ['💰', 'Tài lộc', aiThang.taiLoc],
                ['💪', 'Sức khỏe', aiThang.sucKhoe],
                ['❤️', 'Tình cảm', aiThang.tinhCam],
                ['🏆', 'Công danh', aiThang.congDanh],
              ] as [string, string, string][]).map(([icon, label, nd]) => (
                <div key={label} className="flex gap-3 items-start">
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "#a78bfa" }}>{label}</p>
                    <p className="text-sm leading-5" style={{ color: "#c4b0e0" }}>{nd}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5" style={{ color: "#7c5fa8" }}>
              Chưa có gợi ý AI cho tháng. Phần trên được tính theo quan hệ ngũ hành.
            </p>
          )}
        </Card>

      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center px-4 pb-4">
        <div className="flex gap-2 rounded-2xl p-2 w-full max-w-md"
          style={{ background: "rgba(15,8,30,0.95)", border: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(20px)" }}>
          {[
            { icon: "☯️", label: "Tử vi", href: "/tuvi" },
            { icon: "📅", label: "Vận hạn", href: "/van-han" },
            { icon: "💑", label: "Tương hợp", href: "/tuong-hop" },
            { icon: "💬", label: "Chat AI", href: "/chat" },
          ].map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
              style={{
                background: item.href === "/tuvi" ? "rgba(168,85,247,0.2)" : "transparent",
                color: item.href === "/tuvi" ? "#d8b4fe" : "#5a4077",
              }}>
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 80 }} />
    </main>
  );
}
