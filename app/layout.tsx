import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/navbar/Navbar";
import WhatsAppFloat from "@/components/ui/WhatsappFloat";
import SmoothScroll from "@/components/ui/SmoothScroll";

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans`}>
        <Navbar />
        <SmoothScroll />
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
