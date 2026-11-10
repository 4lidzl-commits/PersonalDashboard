import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaptan — Kişisel Kontrol Merkezi",
  description:
    "Gününü planla, odaklan, gelir-giderini ve tersane yevmiyeni tek yerden yönet.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kaptan",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" style={{ colorScheme: "dark" }}>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
