"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { solarToLunar, getCanChiNam, getBanMenh, getVanHanNam, CON_GIAP_INFO, NGU_HANH_INFO, type VanHanThangInfo } from "@/lib/tuvi";

interface Profile { hoTen: string; ngaySinh: string; gioSinh: string; gioiTinh: string; }

const THANG_LABEL = ['T.1', 'T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7', 'T.8', 'T.9', 'T.10', 'T.11', 'T.12'];

export default function VanHanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vanHan, setVanHan] = useState<VanHanThangInfo[]>([]);
  const [selectedThang, setSelectedThang] = useState(new Date().getMonth() + 1);
  const [conGiap, setConGiap] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("tuvi_profile");
    if (!data) { router.push("/"); return; }
    const p: Profile = JSON.parse(data);
    setProfile(p);
    const d = new Date(p.ngaySinh);
    const [, , namAm] = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
    const { chi } = getCanChiNam(namAm);
    const banMenh = getBanMenh(namAm);
    setConGiap(chi);
    setVanHan(getVanHanNam(banMenh.nguHanh));
  }, [router]);

  if (!profile || !vanHan.length) return null;

  const selected = vanHan.find(v => v.thang === selectedThang);
  const currentMonth = solarToLunar(new Date().getDate(), new Date().getMonth() + 1, new Date().getFullYear())[1];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 pb-10"
      style={{ background: "linear-gradient(160deg, #0d0820 0%, #150d2e 60%, #0a0818 100%)" }}>
      <div className="w-full max-w-md flex items-center justify-between py-5">
        <button onClick={() => router.back()} className="text-sm px-3 py-1.5 rounded-xl"
          style={{ color: "#9b7fc7", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
          ← Quay lại
        </button>
        <span className="font-bold" style={{ color: "#d8b4fe" }}>📅 Tháng âm (tham khảo)</span>
        <div style={{ width: 72 }} />
      </div>

      {/* Profile mini */}
      <div className="w-full max-w-md rounded-2xl p-4 mb-4 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <span className="text-3xl">{CON_GIAP_INFO[conGiap]?.emoji}</span>
        <div>
          <p className="font-semibold text-white">{profile.hoTen}</p>
          <p className="text-xs" style={{ color: "#9b7fc7" }}>Tuổi {conGiap} • Gợi ý theo quan hệ ngũ hành của từng tháng âm</p>
        </div>
      </div>

      {/* Chọn tháng */}
      <div className="w-full max-w-md rounded-2xl p-4 mb-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <p className="text-sm font-medium mb-4" style={{ color: "#d8b4fe" }}>12 tháng âm theo quy tắc ngũ hành</p>
        <div className="grid grid-cols-4 gap-2">
          {vanHan.map(v => (
            <button key={v.thang} className="rounded-xl p-3 text-left transition-all"
              onClick={() => setSelectedThang(v.thang)}
              style={{
                background: v.thang === selectedThang ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${v.thang === selectedThang ? "#a855f7" : `${v.mauSac}22`}`,
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: v.thang === selectedThang ? "#e9d5ff" : "#d8b4fe" }}>
                  {THANG_LABEL[v.thang - 1]}
                </span>
                {v.thang === currentMonth && <span className="text-[10px]" style={{ color: "#a78bfa" }}>Hiện tại</span>}
              </div>
              <span className="text-[11px]" style={{ color: v.mauSac }}>{v.mucDo}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chi tiết tháng được chọn */}
      {selected && (
        <div className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${selected.mauSac}33` }}>
          <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${selected.mauSac}, transparent)` }} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: "#d8b4fe" }}>
                Tháng âm {selected.thang}
                {selected.thang === currentMonth && <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.2)", color: "#a78bfa" }}>Hiện tại</span>}
              </h3>
              <span className="text-sm font-semibold px-2 py-1 rounded-full" style={{ color: selected.mauSac, background: `${selected.mauSac}22` }}>
                {selected.mucDo}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#a78bfa" }}>
                {NGU_HANH_INFO[selected.nguHanhThang]?.emoji} Tháng {selected.nguHanhThang}
              </span>
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: "#f3e8ff" }}>{selected.tieuDe}</p>
            <p className="text-sm leading-6" style={{ color: "#c4b0e0" }}>{selected.moTa}</p>
            <p className="text-xs mt-3" style={{ color: "#7c5fa8" }}>
              Gợi ý theo quan hệ ngũ hành giữa bản mệnh và tháng âm — không phải điểm số, không phải dự đoán chắc chắn.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
