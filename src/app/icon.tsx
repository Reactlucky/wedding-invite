import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Browser-tab mark: Tofik & Sana. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
          borderRadius: 32,
          color: "#ffffff",
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        TS
      </div>
    ),
    { ...size },
  );
}
