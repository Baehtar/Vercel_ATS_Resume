import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Console Flare — ATS Resume Builder & Interview Prep",
  description: "Your launchpad to data science careers.",
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
