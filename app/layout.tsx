import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CloudyInSouth - Website bán sách",
    template: "%s | CloudyInSouth",
  },

  description:
    "CloudyInSouth là website bán sách trực tuyến với nhiều đầu sách công nghệ, văn học, kinh tế và giáo dục. Giao hàng toàn quốc.",

  keywords: [
    "CloudyInSouth",
    "Website bán sách",
    "Mua sách online",
    "Sách lập trình",
    "Sách công nghệ",
    "Sách văn học",
    "Sách kinh tế",
    "Book Store",
  ],

  authors: [
    {
      name: "Nguyễn Hải Nam",
    },
  ],

  creator: "CloudyInSouth",

  openGraph: {
    title: "CloudyInSouth - Website bán sách",
    description:
      "Mua sách online chính hãng với nhiều ưu đãi hấp dẫn.",
    type: "website",
    locale: "vi_VN",
    siteName: "CloudyInSouth",

    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "CloudyInSouth Book Store",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}