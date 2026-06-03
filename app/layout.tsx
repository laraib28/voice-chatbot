import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khawaja Bot — Tanzeem-e-Khawajgan",
  description: "AI-powered educational assistant for Tanzeem-e-Khawajgan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
