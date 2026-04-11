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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://dpn-pendidikan.vercel.app"
  ),
  title: "Pemuda Pendidikan Nusantara | Akselerasi Literasi, Mencerdaskan Bangsa",
  description: "Wadah generasi muda Indonesia untuk mengabdi dan berkontribusi nyata dalam pemerataan akses pendidikan di seluruh penjuru Nusantara.",
  keywords: ["Pemuda Pendidikan Nusantara", "Duta Persada Nusantara", "Pemuda Mengajar", "Pendidikan Indonesia", "Beasiswa"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Pemuda Pendidikan Nusantara",
    title: "Pemuda Pendidikan Nusantara | Akselerasi Literasi",
    description: "Wadah generasi muda Indonesia untuk mengabdi dalam pemerataan akses pendidikan di seluruh penjuru Nusantara.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Pemuda Pendidikan Nusantara",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pemuda Pendidikan Nusantara | Akselerasi Literasi",
    description: "Wadah generasi muda Indonesia untuk mengabdi dalam pemerataan akses pendidikan di seluruh penjuru Nusantara.",
    images: ["/og-default.png"],
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
