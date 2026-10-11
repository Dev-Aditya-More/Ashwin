import Link from "next/link";
import Projects from "@/components/projects/Projects";
import { services } from "@/lib/services-data";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL, BUSINESS, BUSINESS_ID, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Interior & Architecture Projects in Sambhajinagar (Aurangabad)",
  description:
    "Photos of completed interior and architectural projects by Ashwin in Chhatrapati Sambhajinagar (Aurangabad) — homes, flats, offices and commercial spaces since 2016.",
  alternates: {
    canonical: `${SITE_URL}/portfolio`,
  },
  openGraph: {
    title: `Portfolio | ${BUSINESS.name}`,
    description:
      "Completed interior and architectural projects by Ashwin in Chhatrapati Sambhajinagar (Aurangabad).",
    url: `${SITE_URL}/portfolio`,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PortfolioPage() {
  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 md:px-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: "Portfolio",
              item: `${SITE_URL}/portfolio`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Portfolio | ${BUSINESS.name}`,
          description:
            "Interior and architectural projects by Ashwin in Chhatrapati Sambhajinagar (Aurangabad).",
          url: `${SITE_URL}/portfolio`,
          about: { "@id": BUSINESS_ID, name: BUSINESS.name },
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