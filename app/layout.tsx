import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "../components/navbar/Navbar";
import WhatsAppFloat from "@/components/ui/WhatsappFloat";
import SmoothScroll from "@/components/ui/SmoothScroll";
import type { Metadata, Viewport } from "next";

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const BASE_URL = "https://ashwin.world";

/* ✅ VIEWPORT — must be separate from metadata in Next.js 14+ */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

/* ✅ PRODUCTION-READY SEO METADATA */
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Ashwin | Interior & Architectural Design – Sambhajinagar",
    template: "%s | Ashwin Interiors",
  },
  description:
    "Ashwin Interiors offers civil planning, architectural design, interior design, and site execution services in Chhatrapati Sambhajinagar, Maharashtra, India.",
  keywords: [
    "interior designer Sambhajinagar",
    "architect Sambhajinagar",
    "civil planning Maharashtra",
    "home interior design India",
    "Ashwin Interiors",
    "interior design Aurangabad",
    "architectural design Maharashtra",
  ],

  /* ✅ CANONICAL */
  alternates: {
    canonical: BASE_URL,
  },

  /* ✅ ROBOTS — explicitly tell Google to index */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  /* ✅ OPEN GRAPH — absolute URLs via metadataBase */
  openGraph: {
    title: "Ashwin | Interior & Architectural Design",
    description:
      "Interior, architectural, and civil design solutions in Chhatrapati Sambhajinagar, Maharashtra.",
    url: BASE_URL,
    siteName: "Ashwin Interiors",
    images: [
      {
        url: "/ashwinLogo.png", // resolved to https://ashwin.world/ashwinLogo.png via metadataBase
        width: 1200,
        height: 630,
        alt: "Ashwin Interiors – Interior & Architectural Design",
        type: "image/png",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  /* ✅ TWITTER CARD */
  twitter: {
    card: "summary_large_image",
    title: "Ashwin | Interior & Architectural Design",
    description:
      "Interior & architectural design services in Chhatrapati Sambhajinagar, Maharashtra.",
    images: ["/ashwinLogo.png"],
  },

  /* ✅ VERIFICATION — add your Search Console verification token here */
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_TOKEN",
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans`}>

        {/* ✅ LOCAL BUSINESS STRUCTURED DATA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Ashwin Interiors",
              url: "https://ashwin.world",
              telephone: "+919822990577",
              image: "https://ashwin.world/ashwinLogo.png",
              priceRange: "₹₹₹",
              description:
                "Civil planning, architectural design, interior design, and site execution services in Chhatrapati Sambhajinagar, Maharashtra.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Chhatrapati Sambhajinagar",
                addressRegion: "Maharashtra",
                postalCode: "431001",
                addressCountry: "IN",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 19.8762,
                longitude: 75.3433,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ],
                  opens: "09:00",
                  closes: "18:00",
                },
              ],
              sameAs: [
                "https://instagram.com/ashwin_design",
                "https://www.facebook.com/share/1BFHGWXmxF/",
              ],
              hasMap: `https://www.google.com/maps/search/Chhatrapati+Sambhajinagar+interior+designer`,
            }),
          }}
        />

        {/* Microsoft Clarity */}
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","wyog74qx74");`}
        </Script>

        <Navbar />
        <SmoothScroll />
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}