"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { solarToLunar, getCanChiNam, CON_GIAP_INFO, getTuongHop } from "@/lib/tuvi";

interface Person { ten: string; ngaySinh: string; gioiTinh: string; }
interface KetQua {
  chi1: string; chi2: string;
  emoji1: string; emoji2: string;
  loai: string; xepLoai: string; moTa: string; mauSac: string;
}

function getChiFromDate(ngaySinh: string): string {
  const d = new Date(ngaySinh);
  const [, , namAm] = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
  return getCanChiNam(namAm).chi;
}

export default function TuongHopPage() {
  const router = useRouter();
  const [p1, setP1] = useState<Person>({ ten: "", ngaySinh: "", gioiTinh: "nam" });
  const [p2, setP2] = useState<Person>({ ten: "", ngaySinh: "", gioiTinh: "nu" });
  const [ketQua, setKetQua] = useState<KetQua | null>(null);

  function tinh() {
    if (!p1.ten || !p1.ngaySinh || !p2.ten || !p2.ngaySinh) return;
    const chi1 = getChiFromDate(p1.ngaySinh);
    const chi2 = getChiFromDate(p2.ngaySinh);
    const tuongHop = getTuongHop(chi1, chi2);
    setKetQua({
      chi1, chi2,
      emoji1: CON_GIAP_INFO[chi1]?.emoji ?? "🐾",
      emoji2: CON_GIAP_INFO[chi2]?.emoji ?? "🐾",
      ...tuongHop,
    });
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(168,85,247,0.25)",
    borderRadius: 12, padding: "10px 14px", color: "white", outline: "none", width: "100%", fontSize: 14,
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 pb-10"
      style={{ background: "linear-gradient(160deg, #0d0820 0%, #150d2e 60%, #0a0818 100%)" }}>
      <div className="w-full max-w-md flex items-center justify-between py-5">
        <button onClick={() => router.back()} className="text-sm px-3 py-1.5 rounded-xl"
          style={{ color: "#9b7fc7", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
          ← Quay lại
        </button>
        <span className="font-bold" style={{ color: "#d8b4fe" }}>💑 Quan Hệ Địa Chi</span>
        <div style={{ width: 72 }} />
      </div>

      {/* Form 2 người */}
      <div className="w-full max-w-md flex gap-3 mb-4">
        {[{ p: p1, setP: setP1, label: "Người 1", emoji: "👨" }, { p: p2, setP: setP2, label: "Người 2", emoji: "👩" }].map(({ p, setP, label, emoji }) => (
          <div key={label} className="flex-1 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <p className="text-xs font-medium mb-3 text-center" style={{ color: "#a78bfa" }}>{emoji} {label}</p>
            <div className="flex flex-col gap-2">
              <input type="text" placeholder="Tên" value={p.ten}
                onChange={e => setP({ ...p, ten: e.target.value })} style={inputStyle} />
              <input type="date" value={p.ngaySinh}
                onChange={e => setP({ ...p, ngaySinh: e.target.value })}
                style={{ ...inputStyle, colorScheme: "dark" }} />
              <div className="flex gap-1">
                {["nam", "nu"].map(gt => (
                  <button key={gt} type="button" onClick={() => setP({ ...p, gioiTinh: gt })}
                    className="flex-1 py-1.5 rounded-xl text-xs transition-all"
                    style={{
                      background: p.gioiTinh === gt ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${p.gioiTinh === gt ? "#a855f7" : "rgba(168,85,247,0.15)"}`,
                      color: p.gioiTinh === gt ? "#e9d5ff" : "#7c5fa8",
                    }}>
                    {gt === "nam" ? "Nam" : "Nữ"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={tinh} disabled={!p1.ten || !p1.ngaySinh || !p2.ten || !p2.ngaySinh}
        className="w-full max-w-md py-4 rounded-2xl font-bold text-base mb-5 transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg, #6d28d9, #a855f7)", color: "white", opacity: (!p1.ten || !p1.ngaySinh || !p2.ten || !p2.ngaySinh) ? 0.5 : 1 }}>
        Xem quan hệ địa chi
      </button>

      {/* Kết quả */}
      {ketQua && (
        <div className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ketQua.mauSac}33` }}>
          <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${ketQua.mauSac}, transparent)` }} />
          <div className="p-5">
            {/* Con giáp 2 người */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-4xl mb-1">{ketQua.emoji1}</div>
                <p className="text-xs" style={{ color: "#9b7fc7" }}>{p1.ten}</p>
                <p className="text-xs font-medium" style={{ color: "#d8b4fe" }}>Tuổi {ketQua.chi1}</p>
              </div>
              <div className="text-2xl">💕</div>
              <div className="text-center">
                <div className="text-4xl mb-1">{ketQua.emoji2}</div>
                <p className="text-xs" style={{ color: "#9b7fc7" }}>{p2.ten}</p>
                <p className="text-xs font-medium" style={{ color: "#d8b4fe" }}>Tuổi {ketQua.chi2}</p>
              </div>
            </div>

            <div className="flex justify-center mb-3">
              <span className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ color: ketQua.mauSac, background: `${ketQua.mauSac}22` }}>
                {ketQua.xepLoai}
              </span>
            </div>
            <p className="text-sm leading-6 text-center" style={{ color: "#c4b0e0" }}>{ketQua.moTa}</p>
            <p className="text-xs leading-5 text-center mt-3" style={{ color: "#7c5fa8" }}>
              Kết quả dựa trên nhóm địa chi cơ bản — không quy đổi thành phần trăm và không phản ánh đầy đủ một mối quan hệ.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
