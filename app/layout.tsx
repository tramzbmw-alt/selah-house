import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { StaysProvider } from "@/context/StaysContext";
import { PeopleProvider } from "@/context/PeopleContext";
import { MaintenanceProvider } from "@/context/MaintenanceContext";
import { ExpensesProvider } from "@/context/ExpensesContext";
import { RevenueProvider } from "@/context/RevenueContext";
import { VendorsProvider } from "@/context/VendorsContext";
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
      <body><VendorsProvider><ExpensesProvider><RevenueProvider><MaintenanceProvider><PeopleProvider><StaysProvider>{children}</StaysProvider></PeopleProvider></MaintenanceProvider></RevenueProvider></ExpensesProvider></VendorsProvider></body>
    </html>
  );
}
