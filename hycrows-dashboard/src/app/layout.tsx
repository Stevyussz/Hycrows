import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HyCrows — Decentralized Escrow Protocol",
  description:
    "Hybrid Automated Escrow with Anti-Griefing Staking on Stellar Soroban. Trustless, transparent, fast.",
  keywords: ["escrow", "stellar", "soroban", "blockchain", "defi", "hycrows"],
  openGraph: {
    title: "HyCrows Escrow",
    description: "Trustless escrow powered by Stellar Soroban",
    type: "website",
  },
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <WalletProvider>
          {children}
          <Toaster position="top-center" reverseOrder={false} />
        </WalletProvider>
      </body>
    </html>
  );
}
