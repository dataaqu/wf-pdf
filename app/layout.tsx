import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const dachiFont = localFont({
  src: "../public/fonts/Dachi the Lynx-46841546889.otf",
  variable: "--font-dachi",
});

export const metadata: Metadata = {
  title: " WEFORWARD PDF ",
  description: "შეავსე ყველა მოთხოვნილი ინფორმაცია და გადმოწერე",
  icons: {
    icon: "/logos/fav.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${dachiFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
