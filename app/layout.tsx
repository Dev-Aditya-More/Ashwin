import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/navbar/Navbar";
import WhatsAppFloat from "@/components/ui/WhatsappFloat";
import SmoothScroll from "@/components/ui/SmoothScroll";
import Image from "next/image";

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

/* ✅ SEO METADATA */
export const metadata = {
  metadataBase: new URL("https://ashwin.world"),

  title: {
    default: "Ashwin Enterprises | Interior & Architectural Design",
    template: "%s | Ashwin Enterprises",
  },

  description:
    "Ashwin Enterprises offers civil planning, architectural design, interior design, and site execution services in Chhatrapati Sambhajinagar, Maharashtra.",

  keywords: [
    "interior designer Sambhajinagar",
    "architect Sambhajinagar",
    "civil planning Maharashtra",
    "home interior design India",
    "Ashwin Enterprises",
  ],

  openGraph: {
    title: "Ashwin Enterprises",
    description:
      "Interior, architectural, and civil design solutions in Sambhajinagar.",
    url: "https://ashwin.world",
    siteName: "Ashwin Enterprises",
    images: [
      {
        url: "/ashwinLogo.png", // make sure this exists in public
        width: 1200,
        height: 630,
        alt: "Ashwin Enterprises",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Ashwin Enterprises",
    description:
      "Interior & architectural design services in Sambhajinagar.",
    images: ["/ashwinLogo.png"],
  },

  alternates: {
    canonical: "https://ashwin.world",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans`}>
        
        {/* ✅ STRUCTURED DATA (VERY IMPORTANT) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Ashwin Enterprises",
              url: "https://ashwin.world",
              telephone: "+919822990577",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Chhatrapati Sambhajinagar",
                addressRegion: "Maharashtra",
                addressCountry: "IN",
              },
              sameAs: [
                "https://instagram.com/ashwin_design",
                "https://www.facebook.com/share/1BFHGWXmxF/",
              ],
            }),
          }}
        />

        <Navbar />
        <SmoothScroll />
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}