"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GIO_SINH = [
  "Tý (23h-1h)", "Sửu (1h-3h)", "Dần (3h-5h)", "Mão (5h-7h)",
  "Thìn (7h-9h)", "Tỵ (9h-11h)", "Ngọ (11h-13h)", "Mùi (13h-15h)",
  "Thân (15h-17h)", "Dậu (17h-19h)", "Tuất (19h-21h)", "Hợi (21h-23h)",
];

function StarBg() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: (i * 137.5) % 100,
    y: (i * 97.3) % 100,
    size: i % 3 === 0 ? 2 : 1,
    opacity: 0.2 + (i % 5) * 0.1,
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

export default function Onboarding() {
  const router = useRouter();
  const [form, setForm] = useState({ hoTen: "", ngaySinh: "", gioSinh: "", gioiTinh: "nam" });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hoTen || !form.ngaySinh || !form.gioSinh) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    localStorage.setItem("tuvi_profile", JSON.stringify(form));
    router.push("/tuvi");
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(212,168,255,0.25)",
    borderRadius: 14,
    padding: "12px 16px",
    color: "white",
    outline: "none",
    width: "100%",
    fontSize: 15,
    boxSizing: "border-box" as const,
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      style={{ background: "linear-gradient(160deg, #0d0820 0%, #150d2e 60%, #0a0818 100%)" }}>
      <StarBg />

      {/* Logo */}
      <div className="mb-10 text-center relative z-10">
        <div className="relative inline-block">
          <div className="text-6xl mb-3" style={{ filter: "drop-shadow(0 0 20px rgba(168,85,247,0.8))" }}>☯️</div>
          <div className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
        </div>
        <h1 className="text-4xl font-bold tracking-wide"
          style={{ background: "linear-gradient(135deg, #e9d5ff, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Tử Vi
        </h1>
        <p className="text-sm mt-2" style={{ color: "#7c5fa8" }}>
          Xem âm lịch, Can Chi và một vài gợi ý tham khảo từ dữ liệu ngày sinh
        </p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm relative z-10"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 24, padding: 24, backdropFilter: "blur(10px)" }}>

        <h2 className="text-center font-semibold mb-5" style={{ color: "#d8b4fe" }}>Nhập thông tin của bạn</h2>

        {/* Họ tên */}
        <div className="mb-4">
          <label className="block text-xs mb-1.5 ml-1" style={{ color: "#9d74cc" }}>Họ và tên</label>
          <input type="text" name="hoTen" placeholder="Nguyễn Văn A"
            value={form.hoTen} onChange={handleChange} style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>

        {/* Giới tính */}
        <div className="mb-4">
          <label className="block text-xs mb-1.5 ml-1" style={{ color: "#9d74cc" }}>Giới tính</label>
          <div className="flex gap-2">
            {["nam", "nu"].map(gt => (
              <button key={gt} type="button" onClick={() => setForm({ ...form, gioiTinh: gt })}
                className="flex-1 py-3 rounded-2xl font-medium text-sm transition-all"
                style={{
                  background: form.gioiTinh === gt ? "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(168,85,247,0.5))" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${form.gioiTinh === gt ? "#a855f7" : "rgba(168,85,247,0.2)"}`,
                  color: form.gioiTinh === gt ? "#e9d5ff" : "#7c5fa8",
                }}>
                {gt === "nam" ? "👨 Nam" : "👩 Nữ"}
              </button>
            ))}
          </div>
        </div>

        {/* Ngày sinh */}
        <div className="mb-4">
          <label className="block text-xs mb-1.5 ml-1" style={{ color: "#9d74cc" }}>Ngày sinh</label>
          <div className="relative">
            <input type="date" name="ngaySinh" value={form.ngaySinh}
              onChange={handleChange}
              style={{ ...inputStyle, colorScheme: "dark", paddingRight: 40 }} />
            {!form.ngaySinh && (
              <div className="absolute inset-0 flex items-center px-4 pointer-events-none"
                style={{ color: "#6b4f8a", fontSize: 14 }}>
                📅 Chọn ngày sinh
              </div>
            )}
          </div>
        </div>

        {/* Giờ sinh */}
        <div className="mb-5">
          <label className="block text-xs mb-1.5 ml-1" style={{ color: "#9d74cc" }}>Giờ sinh</label>
          <select name="gioSinh" value={form.gioSinh} onChange={handleChange}
            style={{ ...inputStyle, colorScheme: "dark" }}>
            <option value="">-- Chọn giờ sinh --</option>
            {GIO_SINH.map(gio => <option key={gio} value={gio}>{gio}</option>)}
          </select>
        </div>

        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

        <button type="submit" className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #6d28d9, #a855f7)", color: "white", boxShadow: "0 4px 20px rgba(168,85,247,0.4)" }}>
          Xem hồ sơ tham khảo
        </button>
      </form>

      <p className="mt-5 text-xs relative z-10" style={{ color: "#4a3566" }}>
        🔒 Thông tin chỉ lưu trên thiết bị của bạn
      </p>
    </main>
  );
}
