"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { usePathname } from "next/navigation";
import ChatButton from "@/components/chat/ChatButton";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const pathname = usePathname();


  const isAdmin =
    pathname.startsWith("/admin");


  return (

    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >

      <body className="min-h-full flex flex-col">

        {children}


        {
          !isAdmin && (
            <ChatButton />
          )
        }


      </body>


    </html>

  );

}