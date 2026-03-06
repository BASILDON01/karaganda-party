import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

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
          background: "hsl(340, 82%, 52%)",
          borderRadius: 8,
          fontSize: 24,
          fontWeight: "bold",
          color: "white",
        }}
      >
        F
      </div>
    ),
    { ...size }
  );
}
