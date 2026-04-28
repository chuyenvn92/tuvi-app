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
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(168,85,247,0.25)",
    borderRadius: 12,
    padding: "10px 14px",
    color: "white",
    outline: "none",
    width: "100%",
    fontSize: 16,
  };

  const canSubmit = p1.ten && p1.ngaySinh && p2.ten && p2.ngaySinh;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 pb-10"
      style={{ background: "linear-gradient(160deg, #0d0820 0%, #150d2e 60%, #0a0818 100%)" }}>

      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between py-5">
        <button onClick={() => router.back()} className="text-sm px-3 py-1.5 rounded-xl"
          style={{ color: "#9b7fc7", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
          ← Quay lại
        </button>
        <span className="font-bold" style={{ color: "#d8b4fe" }}>💑 Tương Hợp</span>
        <div style={{ width: 72 }} />
      </div>

      <p className="text-xs mb-5 text-center" style={{ color: "#7c5fa8" }}>
        Xem quan hệ địa chi giữa hai người dựa trên năm sinh
      </p>

      {/* Form 2 người — xếp dọc thay vì ngang để thoáng hơn trên mobile */}
      <div className="w-full max-w-md flex flex-col gap-3 mb-4">
        {[
          { p: p1, setP: setP1, label: "Người thứ nhất", emoji: "👤" },
          { p: p2, setP: setP2, label: "Người thứ hai", emoji: "👤" },
        ].map(({ p, setP, label, emoji }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "#a78bfa" }}>{emoji} {label}</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Tên"
                value={p.ten}
                onChange={e => setP({ ...p, ten: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <div className="flex gap-1">
                {["nam", "nu"].map(gt => (
                  <button key={gt} type="button" onClick={() => setP({ ...p, gioiTinh: gt })}
                    className="px-3 rounded-xl text-sm transition-all"
                    style={{
                      background: p.gioiTinh === gt ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${p.gioiTinh === gt ? "#a855f7" : "rgba(168,85,247,0.15)"}`,
                      color: p.gioiTinh === gt ? "#e9d5ff" : "#7c5fa8",
                      whiteSpace: "nowrap",
                    }}>
                    {gt === "nam" ? "Nam" : "Nữ"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6b4f8a" }}>Ngày sinh</label>
              <input
                type="date"
                value={p.ngaySinh}
                onChange={e => setP({ ...p, ngaySinh: e.target.value })}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={tinh}
        disabled={!canSubmit}
        className="w-full max-w-md py-4 rounded-2xl font-bold text-base mb-5 transition-all active:scale-95"
        style={{
          background: "linear-gradient(135deg, #6d28d9, #a855f7)",
          color: "white",
          opacity: canSubmit ? 1 : 0.4,
        }}>
        Xem tương hợp
      </button>

      {/* Kết quả */}
      {ketQua && (
        <div className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ketQua.mauSac}33` }}>
          <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${ketQua.mauSac}, transparent)` }} />
          <div className="p-5">
            <div className="flex items-center justify-center gap-6 mb-5">
              <div className="text-center">
                <div className="text-5xl mb-2">{ketQua.emoji1}</div>
                <p className="text-sm font-medium" style={{ color: "#d8b4fe" }}>{p1.ten}</p>
                <p className="text-xs mt-0.5" style={{ color: "#7c5fa8" }}>Tuổi {ketQua.chi1}</p>
              </div>
              <div className="text-3xl">💕</div>
              <div className="text-center">
                <div className="text-5xl mb-2">{ketQua.emoji2}</div>
                <p className="text-sm font-medium" style={{ color: "#d8b4fe" }}>{p2.ten}</p>
                <p className="text-xs mt-0.5" style={{ color: "#7c5fa8" }}>Tuổi {ketQua.chi2}</p>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <span className="text-sm font-semibold px-4 py-1.5 rounded-full"
                style={{ color: ketQua.mauSac, background: `${ketQua.mauSac}22`, border: `1px solid ${ketQua.mauSac}44` }}>
                {ketQua.xepLoai}
              </span>
            </div>
            <p className="text-sm leading-6 text-center" style={{ color: "#c4b0e0" }}>{ketQua.moTa}</p>
            <p className="text-xs leading-5 text-center mt-4" style={{ color: "#7c5fa8" }}>
              Kết quả dựa trên nhóm địa chi cơ bản — không quy đổi thành phần trăm và không phản ánh đầy đủ một mối quan hệ.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
