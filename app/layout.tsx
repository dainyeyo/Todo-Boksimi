import type { Metadata } from "next";
import localFont from "next/font/local";
import { Outfit, Cinzel, Noto_Sans_KR, Gowun_Batang } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700"],
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
  weight: ["300", "400", "500", "700", "900"],
});

const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  variable: "--font-gowun-batang",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "복심이와 ToDo 리스트",
  description: "A premium mindful scheduling and meditation todo application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${cinzel.variable} ${notoSansKR.variable} ${gowunBatang.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
