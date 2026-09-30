import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iT Wash — Antrean & Status Cucian",
  description: "Pantau antrean dan progres cucian mobil, motor, dan sepatu dengan mudah.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/itwash-icon.png",
    shortcut: "/itwash-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
