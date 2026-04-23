import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Budas del Mediterráneo — Valoración gratuita de tu propiedad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          backgroundColor: "#1B3A5C",
          padding: "72px 80px",
        }}
      >
        {/* Diagonal gradient overlay for depth */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(27,58,92,0.0) 0%, rgba(11,28,47,0.7) 100%)",
            display: "flex",
          }}
        />

        {/* Accent line + eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "2px",
              backgroundColor: "#C9A96E",
            }}
          />
          <span
            style={{
              color: "#C9A96E",
              fontSize: "15px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "Arial, sans-serif",
              fontWeight: 500,
            }}
          >
            Costa mediterránea · Valoración gratuita
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "36px",
            position: "relative",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: "66px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              fontFamily: "Georgia, serif",
            }}
          >
            Tu propiedad vale más
          </span>
          <span
            style={{
              color: "#C9A96E",
              fontSize: "66px",
              fontWeight: 700,
              fontStyle: "italic",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              fontFamily: "Georgia, serif",
            }}
          >
            de lo que imaginas.
          </span>
        </div>

        {/* Sub-text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "48px",
            position: "relative",
          }}
        >
          {["Valoración 100% gratuita", "Datos reales del registro", "Respuesta en 24 h"].map(
            (item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "rgba(255,255,255,0.60)",
                  fontSize: "18px",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "#C9A96E",
                  }}
                />
                {item}
              </div>
            )
          )}
        </div>

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              backgroundColor: "#C9A96E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: "22px",
                fontFamily: "Georgia, serif",
              }}
            >
              B
            </span>
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "19px",
              fontFamily: "Arial, sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            Budas del Mediterráneo
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
