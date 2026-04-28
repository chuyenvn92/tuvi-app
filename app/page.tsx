"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GIO_SINH = [
  "Tý (23h-1h)", "Sửu (1h-3h)", "Dần (3h-5h)", "Mão (5h-7h)",
  "Thìn (7h-9h)", "Tỵ (9h-11h)", "Ngọ (11h-13h)", "Mùi (13h-15h)",
  "Thân (15h-17h)", "Dậu (17h-19h)", "Tuất (19h-21h)", "Hợi (21h-23h)",
];

export default function Onboarding() {
  const router = useRouter();
  const [form, setForm] = useState({
    hoTen: "",
    ngaySinh: "",
    gioSinh: "",
    gioiTinh: "nam",
  });
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

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0a0a1e 100%)" }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-2">☯️</div>
        <h1 className="text-3xl font-bold" style={{ color: "#d4a8ff" }}>Tử Vi</h1>
        <p className="text-sm mt-1" style={{ color: "#9b7fc7" }}>Khám phá vận mệnh của bạn</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,168,255,0.2)" }}
      >
        <h2 className="text-xl font-semibold text-center mb-2" style={{ color: "#d4a8ff" }}>
          Nhập thông tin của bạn
        </h2>

        {/* Họ tên */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: "#9b7fc7" }}>Họ và tên</label>
          <input
            type="text"
            name="hoTen"
            placeholder="Nguyễn Văn A"
            value={form.hoTen}
            onChange={handleChange}
            className="rounded-xl px-4 py-3 outline-none text-white placeholder-gray-500"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(212,168,255,0.2)" }}
          />
        </div>

        {/* Giới tính */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: "#9b7fc7" }}>Giới tính</label>
          <div className="flex gap-3">
            {["nam", "nữ"].map((gt) => (
              <button
                key={gt}
                type="button"
                onClick={() => setForm({ ...form, gioiTinh: gt })}
                className="flex-1 py-3 rounded-xl font-medium capitalize transition-all"
                style={{
                  background: form.gioiTinh === gt ? "rgba(212,168,255,0.3)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${form.gioiTinh === gt ? "#d4a8ff" : "rgba(212,168,255,0.2)"}`,
                  color: form.gioiTinh === gt ? "#d4a8ff" : "#9b7fc7",
                }}
              >
                {gt === "nam" ? "👨 Nam" : "👩 Nữ"}
              </button>
            ))}
          </div>
        </div>

        {/* Ngày sinh */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: "#9b7fc7" }}>Ngày sinh</label>
          <input
            type="date"
            name="ngaySinh"
            value={form.ngaySinh}
            onChange={handleChange}
            className="rounded-xl px-4 py-3 outline-none text-white"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(212,168,255,0.2)",
              colorScheme: "dark",
            }}
          />
        </div>

        {/* Giờ sinh */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: "#9b7fc7" }}>Giờ sinh</label>
          <select
            name="gioSinh"
            value={form.gioSinh}
            onChange={handleChange}
            className="rounded-xl px-4 py-3 outline-none text-white"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(212,168,255,0.2)",
              colorScheme: "dark",
            }}
          >
            <option value="">-- Chọn giờ sinh --</option>
            {GIO_SINH.map((gio) => (
              <option key={gio} value={gio}>{gio}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          className="mt-2 py-4 rounded-xl font-bold text-lg transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white" }}
        >
          Xem tử vi của tôi ✨
        </button>
      </form>

      <p className="mt-4 text-xs text-center" style={{ color: "#6b4f8a" }}>
        Thông tin chỉ lưu trên thiết bị của bạn
      </p>
    </main>
  );
}
