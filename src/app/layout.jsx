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

export const metadata = {
  title: "Sisuma",
  description: "sistem informasi surat menyurat ma'soem",
  icons: {
    icon: "/images/Logo.svg"
  },
};

export default function RootLayout({ children }) {
  return (
    <html
  lang="en"
  className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
>
  <body className="h-full overflow-hidden">{children}</body>
</html>
  );
}
