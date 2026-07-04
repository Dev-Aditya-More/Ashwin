import Link from "next/link";
import type { Metadata } from "next";
import { services } from "@/lib/services-data";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Civil planning, architectural design, interior design, landscape design, space planning, and site execution — services offered by Ashwin Interiors across India.",
  alternates: {
    canonical: "https://ashwin.world/services",
  },
  openGraph: {
    title: "Services | Ashwin Interiors",
    description:
      "Civil planning, architectural design, interior design, landscape design, space planning, and site execution services by Ashwin Interiors.",
    url: "https://ashwin.world/services",
    images: [
      {
        url: "/ashwinLogo.png",
        width: 1200,
        height: 630,
        alt: "Ashwin Interiors Services",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ServicesPage() {
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
                name: "Services",
                item: "https://ashwin.world/services",
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
            "@type": "ItemList",
            itemListElement: services.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://ashwin.world/services/${s.slug}`,
              name: s.title,
            })),
          }),
        }}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#111]">
          Our Services
        </h1>
        <p className="mt-4 text-sm sm:text-base text-[#555] max-w-xl mx-auto">
          Civil, architectural, landscape, and interior design services for
          residential and commercial spaces — for clients across India.
        </p>
        <span className="block w-12 h-[2px] bg-[var(--accent-gold)] mx-auto mt-5"></span>
      </div>

      {/* Services grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="group block border border-[var(--border)] p-6 md:p-8 hover:border-[var(--accent-gold)] transition-colors"
          >
            <h2 className="font-serif text-xl md:text-2xl text-[#111111] group-hover:text-[var(--accent-gold)] transition-colors">
              {service.title}
            </h2>
            <p className="mt-3 text-sm text-[#555555] leading-relaxed">
              {service.shortDescription}
            </p>
            <span className="mt-4 inline-block text-xs tracking-widest uppercase text-[var(--accent-gold)]">
              Learn more &rarr;
            </span>
          </Link>
        ))}
      </div>

      {/* Cross-links */}
      <div className="max-w-7xl mx-auto mt-16 text-center">
        <p className="text-sm text-[#555555]">
          Want to see this work in practice?{" "}
          <Link
            href="/portfolio"
            className="text-[var(--accent-gold)] underline underline-offset-4"
          >
            View our portfolio
          </Link>{" "}
          or{" "}
          <Link
            href="/#contact"
            className="text-[var(--accent-gold)] underline underline-offset-4"
          >
            get in touch
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
