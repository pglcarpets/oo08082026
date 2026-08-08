import { ImageResponse } from "next/og";
import { SITE_BRAND } from "@/features/site/data/brand";

export const runtime = "nodejs";
export const alt = SITE_BRAND.defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #05080C 0%, #0d1b2a 60%, #1b263b 100%)",
          padding: "4.5rem",
          color: "#FFFFFF",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              width: "4rem",
              height: "64px",
              borderRadius: "0.75rem",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.25rem",
              fontWeight: 700,
              color: "#05080C",
            }}
          >
            O
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 600, letterSpacing: "-0.03125rem" }}>
            {SITE_BRAND.companyName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "4.25rem",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              maxWidth: "61.25rem",
            }}
          >
            Premium Office Solutions
          </div>
          <div style={{ fontSize: "30px", fontWeight: 400, color: "#B8C4D6", maxWidth: "56.25rem" }}>
            Ergonomic office furniture in Patna, Bihar &amp; Jharkhand.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "0.0625rem solid rgba(255,255,255,0.18)",
            paddingTop: "1.75rem",
            fontSize: "1.5rem",
            color: "#B8C4D6",
          }}
        >
          <div>oando.co.in</div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <span>Workstations</span>
            <span>·</span>
            <span>Seating</span>
            <span>·</span>
            <span>Storage</span>
            <span>·</span>
            <span>Tables</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
