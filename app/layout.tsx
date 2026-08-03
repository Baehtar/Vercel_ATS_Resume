import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConsoleFlare Career Readiness Platform",
  description: "Resume builder, job listings, and interview preparation for students.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
