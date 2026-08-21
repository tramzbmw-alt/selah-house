import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { StaysProvider } from "@/context/StaysContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Selah House",
  description: "Selah House · Wilmington, NC · Murrayville",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body><StaysProvider>{children}</StaysProvider></body>
    </html>
  );
}
