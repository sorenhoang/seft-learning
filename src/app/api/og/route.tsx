import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// NOTE: request.nextUrl.searchParams is synchronous URLSearchParams (Web API).
// This is NOT the async searchParams page prop — the validator flag is a false positive.
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "Soren Learning";
  const type = searchParams.get("type") ?? "page";
  const category = searchParams.get("category") ?? "";

  const TYPE_COLOR: Record<string, string> = {
    category: "#818cf8",
    book: "#60a5fa",
    post: "#34d399",
    chapter: "#fb923c",
    page: "#a1a1aa",
  };

  const accentColor = TYPE_COLOR[type] ?? TYPE_COLOR.page;

  try {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#09090b",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "64px 72px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Gradient blob */}
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -120,
              width: 480,
              height: 480,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)",
            }}
          />

          {/* Site name */}
          <div
            style={{
              color: "#52525b",
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "auto",
            }}
          >
            Soren Learning
          </div>

          {/* Type + category badge */}
          {type !== "page" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div
                style={{
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}44`,
                  color: accentColor,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: 6,
                  textTransform: "capitalize",
                }}
              >
                {type}
              </div>
              {category && (
                <div style={{ color: "#52525b", fontSize: 14 }}>{category}</div>
              )}
            </div>
          )}

          {/* Title */}
          <div
            style={{
              color: "#fafafa",
              fontSize: title.length > 40 ? 52 : 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 900,
            }}
          >
            {title}
          </div>

          {/* Accent line */}
          <div
            style={{
              marginTop: 48,
              height: 3,
              width: 80,
              background: accentColor,
              borderRadius: 2,
            }}
          />
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (err) {
    console.error("[og] ImageResponse failed:", err);
    return new Response("Failed to generate image", { status: 500 });
  }
}
