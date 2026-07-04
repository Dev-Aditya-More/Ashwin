import Link from "next/link";
import Projects from "@/components/projects/Projects";
import { services } from "@/lib/services-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Explore interior and architectural projects by Ashwin Interiors — residential and commercial design work based in Chhatrapati Sambhajinagar, serving clients across India.",
  alternates: {
    canonical: "https://ashwin.world/portfolio",
  },
  openGraph: {
    title: "Portfolio | Ashwin Interiors",
    description:
      "Explore interior and architectural projects by Ashwin Interiors, serving clients across India.",
    url: "https://ashwin.world/portfolio",
    images: [
      {
        url: "/ashwinLogo.png",
        width: 1200,
        height: 630,
        alt: "Ashwin Interiors Portfolio",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PortfolioPage() {
  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 md:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://ashwin.world",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Portfolio",
                item: "https://ashwin.world/portfolio",
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Portfolio | Ashwin Interiors",
            description:
              "Interior and architectural design projects by Ashwin Interiors.",
            url: "https://ashwin.world/portfolio",
            about: {
              "@type": "LocalBusiness",
              name: "Ashwin Interiors",
              url: "https://ashwin.world",
            },
          }),
        }}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#111]">
          Our Work
        </h1>
        <p className="mt-4 text-sm sm:text-base text-[#555] max-w-xl mx-auto">
          A collection of our interior and architectural projects across
          residential and commercial spaces.
        </p>
        <span className="block w-12 h-[2px] bg-[var(--accent-gold)] mx-auto mt-5"></span>
      </div>
      {/* Projects Grid */}
      <Projects isFullPage />

      {/* Cross-links */}
      <div className="max-w-7xl mx-auto mt-16 text-center">
        <p className="text-sm text-[#555555] mb-4">
          Curious how a project like this comes together?
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="text-xs sm:text-sm text-[var(--accent-gold)] underline underline-offset-4"
            >
              {service.title}
            </Link>
          ))}
        </div>
        <Link
          href="/#contact"
          className="inline-block mt-6 text-xs sm:text-sm px-6 py-3 bg-[#111111] text-white hover:bg-[var(--accent-gold)] transition"
        >
          Start Your Project
        </Link>
      </div>
    </main>
  );
}