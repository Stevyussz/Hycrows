import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Pemuda Pendidikan Nusantara | Akselerasi Literasi, Mencerdaskan Bangsa",
  description: "Wadah generasi muda Indonesia untuk mengabdi dan berkontribusi nyata dalam pemerataan akses pendidikan di seluruh penjuru Nusantara.",
  keywords: ["Pemuda Pendidikan Nusantara", "Duta Persada Nusantara", "Relawan Mengajar", "Pendidikan Indonesia", "Beasiswa"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Pemuda Pendidikan Nusantara",
    title: "Pemuda Pendidikan Nusantara | Akselerasi Literasi",
    description: "Wadah generasi muda Indonesia untuk mengabdi dalam pemerataan akses pendidikan di seluruh penjuru Nusantara.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Pemuda Pendidikan Nusantara",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pemuda Pendidikan Nusantara | Akselerasi Literasi",
    description: "Wadah generasi muda Indonesia untuk mengabdi dalam pemerataan akses pendidikan di seluruh penjuru Nusantara.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
