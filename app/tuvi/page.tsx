"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  solarToLunar,
  getCanChiNam,
  getBanMenh,
  getCungMenh,
  getDiemHomNay,
  NGU_HANH_INFO,
  CON_GIAP_INFO,
} from "@/lib/tuvi";

interface Profile {
  hoTen: string;
  ngaySinh: string;
  gioSinh: string;
  gioiTinh: string;
}

interface TuviData {
  canChiNam: string;
  conGiap: string;
  banMenh: { nguHanh: string; tenGoi: string };
  cungMenh: string;
  diemHomNay: { mayMan: number; taiLoc: number; tinhDuyen: number };
  thangAm: number;
  namAm: number;
}

function tinhTuvi(profile: Profile): TuviData {
  const date = new Date(profile.ngaySinh);
  const ngay = date.getDate();
  const thang = date.getMonth() + 1;
  const nam = date.getFullYear();

  // Chuyển dương lịch → âm lịch
  const [, thangAm, namAm] = solarToLunar(ngay, thang, nam);

  const { canChi, chi } = getCanChiNam(namAm);
  const banMenh = getBanMenh(namAm);
  const cungMenh = getCungMenh(thangAm, profile.gioSinh);
  const diemHomNay = getDiemHomNay(profile.ngaySinh, banMenh.nguHanh);

  return {
    canChiNam: canChi,
    conGiap: chi,
    banMenh,
    cungMenh,
    diemHomNay,
    thangAm,
    namAm,
  };
}

const SCORE_COLOR = (score: number) =>
  score >= 8 ? '#4ade80' : score >= 6 ? '#facc15' : '#f87171';

export default function TuviPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tuvi, setTuvi] = useState<TuviData | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("tuvi_profile");
    if (!data) { router.push("/"); return; }
    const p: Profile = JSON.parse(data);
    setProfile(p);
    setTuvi(tinhTuvi(p));
  }, [router]);

  if (!profile || !tuvi) return null;

  const date = new Date(profile.ngaySinh);
  const nguHanhInfo = NGU_HANH_INFO[tuvi.banMenh.nguHanh];
  const conGiapInfo = CON_GIAP_INFO[tuvi.conGiap];
  const { mayMan, taiLoc, tinhDuyen } = tuvi.diemHomNay;

  const today = new Date();
  const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0a0a1e 100%)" }}
    >
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <button onClick={() => router.push("/")} style={{ color: "#9b7fc7" }}>← Quay lại</button>
        <span className="text-lg font-bold" style={{ color: "#d4a8ff" }}>☯️ Tử Vi</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Profile card */}
      <div className="w-full max-w-md rounded-2xl p-5 mb-4"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,168,255,0.2)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{ background: "rgba(212,168,255,0.2)" }}>
            {profile.gioiTinh === "nam" ? "👨" : "👩"}
          </div>
          <div>
            <p className="font-bold text-lg text-white">{profile.hoTen}</p>
            <p className="text-sm" style={{ color: "#9b7fc7" }}>
              {date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()} • {profile.gioSinh}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#d4a8ff" }}>
              {tuvi.canChiNam} • {conGiapInfo?.emoji} {tuvi.conGiap}
            </p>
          </div>
        </div>
      </div>

      {/* Bản mệnh */}
      <div className="w-full max-w-md rounded-2xl p-5 mb-4"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,168,255,0.2)" }}>
        <h2 className="font-bold mb-3" style={{ color: "#d4a8ff" }}>
          {nguHanhInfo?.emoji} Bản mệnh: {tuvi.banMenh.nguHanh} ({tuvi.banMenh.tenGoi})
        </h2>
        <p className="text-sm leading-6" style={{ color: "#c4b0e0" }}>
          {nguHanhInfo?.moTa}
        </p>
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(212,168,255,0.1)" }}>
          <p className="text-xs" style={{ color: "#9b7fc7" }}>
            Cung mệnh: <span style={{ color: "#d4a8ff" }}>{tuvi.cungMenh}</span>
            {"  •  "}
            Âm lịch: <span style={{ color: "#d4a8ff" }}>tháng {tuvi.thangAm} năm {tuvi.namAm}</span>
          </p>
        </div>
      </div>

      {/* Con giáp */}
      <div className="w-full max-w-md rounded-2xl p-5 mb-4"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,168,255,0.2)" }}>
        <h2 className="font-bold mb-3" style={{ color: "#d4a8ff" }}>
          {conGiapInfo?.emoji} Con giáp: {tuvi.conGiap}
        </h2>
        <p className="text-sm leading-6" style={{ color: "#c4b0e0" }}>
          {conGiapInfo?.moTa}
        </p>
      </div>

      {/* Tử vi hôm nay */}
      <div className="w-full max-w-md rounded-2xl p-5 mb-4"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,168,255,0.2)" }}>
        <h2 className="font-bold mb-1" style={{ color: "#d4a8ff" }}>⭐ Tử vi hôm nay</h2>
        <p className="text-xs mb-3" style={{ color: "#6b4f8a" }}>{todayStr}</p>
        <div className="flex gap-3 mb-4">
          {([
            ['🍀', 'May mắn', mayMan],
            ['💰', 'Tài lộc', taiLoc],
            ['❤️', 'Tình duyên', tinhDuyen],
          ] as [string, string, number][]).map(([icon, label, score]) => (
            <div key={label} className="flex-1 text-center rounded-xl py-3"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="text-xl">{icon}</div>
              <div className="text-xs mt-1" style={{ color: "#9b7fc7" }}>{label}</div>
              <div className="text-sm font-bold mt-1" style={{ color: SCORE_COLOR(score) }}>
                {score}/10
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm leading-6" style={{ color: "#c4b0e0" }}>
          {mayMan >= 7
            ? "Hôm nay là ngày thuận lợi, năng lượng tích cực bao quanh bạn. Hãy mạnh dạn thực hiện các kế hoạch đã ấp ủ."
            : "Hôm nay nên giữ thái độ bình tĩnh, tránh các quyết định lớn. Tập trung vào công việc ổn định và chăm sóc bản thân."}
        </p>
      </div>

      {/* Nút chỉnh sửa thông tin */}
      <button
        onClick={() => router.push("/")}
        className="w-full max-w-md py-3 rounded-xl text-sm"
        style={{ border: "1px solid rgba(212,168,255,0.3)", color: "#9b7fc7" }}
      >
        ✏️ Chỉnh sửa thông tin
      </button>
    </main>
  );
}
