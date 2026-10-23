import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RegisterServiceWorker } from "@/components/admin/RegisterServiceWorker";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Admin | Ashwin Enterprises",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "ASHWIN", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#171b4b" };

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans bg-[var(--bg-2)] antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
