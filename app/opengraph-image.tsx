import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tử Vi AI — Xem âm lịch, Tứ Trụ & vận hạn";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d0820 0%, #1a0a35 50%, #0a0818 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow background */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Icon + Title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 96, marginBottom: 16, lineHeight: 1 }}>☯️</div>
          <div
            style={{
              fontSize: 86,
              fontWeight: 700,
              color: "#e9d5ff",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            Tử Vi AI
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "#9b7fc7",
            textAlign: "center",
            marginBottom: 40,
            lineHeight: 1.4,
          }}
        >
          Âm lịch · Can Chi · Tứ Trụ · Vận hạn AI
        </div>

        {/* Tag pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {["🍀 May mắn", "💰 Tài lộc", "❤️ Tình duyên", "💬 Chat AI"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(168,85,247,0.2)",
                border: "1px solid rgba(168,85,247,0.5)",
                borderRadius: 40,
                padding: "10px 24px",
                color: "#d8b4fe",
                fontSize: 26,
                display: "flex",
                alignItems: "center",
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ position: "absolute", bottom: 32, color: "#4a3566", fontSize: 22 }}>
          tuvi-app.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
