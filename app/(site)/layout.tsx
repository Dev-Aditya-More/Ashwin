import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import WhatsAppFloat from "@/components/ui/WhatsappFloat";
import SmoothScroll from "@/components/ui/SmoothScroll";
import JsonLd from "@/components/seo/JsonLd";
import LeadClickTracker from "@/components/seo/LeadClickTracker";
import {
  SITE_URL,
  BUSINESS,
  OG_IMAGE,
  businessJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import type { Metadata, Viewport } from "next";

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const DEFAULT_TITLE =
  "Interior Designer & Architect in Sambhajinagar (Aurangabad) | Ashwin";
const DEFAULT_DESCRIPTION =
  "Ashwin — interior design, architecture, civil planning, glass work and site execution in Chhatrapati Sambhajinagar (Aurangabad) since 2016. Call +91 98229 90577.";

/* ✅ VIEWPORT — must be separate from metadata in Next.js 14+ */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

/* ✅ PRODUCTION-READY SEO METADATA */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${BUSINESS.name}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: BUSINESS.name,

  /* ✅ CANONICAL */
  alternates: {
    canonical: SITE_URL,
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
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: BUSINESS.name,
    images: [{ ...OG_IMAGE, type: "image/jpeg" }],
    locale: "en_IN",
    type: "website",
  },

  /* ✅ TWITTER CARD */
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <body className={`${serif.variable} ${sans.variable} font-sans`}>

        {/* ✅ LOCAL BUSINESS + WEBSITE STRUCTURED DATA */}
        <JsonLd data={businessJsonLd} />
        <JsonLd data={websiteJsonLd} />

        {/* Microsoft Clarity */}
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","wyog74qx74");`}
        </Script>

        {/* Google Analytics 4 — only loads once NEXT_PUBLIC_GA_ID is set */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());
              gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}

        <LeadClickTracker />
        <Navbar />
        <SmoothScroll />
        {children}
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
