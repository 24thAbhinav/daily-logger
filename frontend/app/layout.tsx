import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Daily Logger — High-Velocity Daily Notes for Builders",
  description:
    "The private, keyboard-driven daily log for developers and founders. Capture insights, architecture decisions, and wins without friction.",
  openGraph: {
    title: "Daily Logger — High-Velocity Daily Notes for Builders",
    description:
      "The private, keyboard-driven daily log for developers and founders. Capture insights, architecture decisions, and wins without friction.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
