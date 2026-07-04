import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { services, getServiceBySlug } from "@/lib/services-data";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  const url = `https://ashwin.world/services/${service.slug}`;

  return {
    title: service.title,
    description: service.metaDescription,
    keywords: service.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${service.title} | Ashwin Interiors`,
      description: service.metaDescription,
      url,
      images: [
        {
          url: "/ashwinLogo.png",
          width: 1200,
          height: 630,
          alt: `${service.title} | Ashwin Interiors`,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const url = `https://ashwin.world/services/${service.slug}`;
  const otherServices = services.filter((s) => s.slug !== service.slug);

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 md:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.metaDescription,
            provider: {
              "@type": "LocalBusiness",
              name: "Ashwin Interiors",
              url: "https://ashwin.world",
              telephone: "+919822990577",
            },
            areaServed: {
              "@type": "Country",
              name: "India",
            },
            url,
          }),
        }}
      />
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
              {
                "@type": "ListItem",
                position: 3,
                name: service.title,
                item: url,
              },
            ],
          }),
        }}
      />

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#888888] mb-8">
          <Link href="/" className="hover:text-[var(--accent-gold)]">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/services" className="hover:text-[var(--accent-gold)]">
            Services
          </Link>{" "}
          / <span className="text-[#111111]">{service.title}</span>
        </nav>

        {/* Header */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#111111]">
          {service.title}
        </h1>
        <span className="block w-12 h-[2px] bg-[var(--accent-gold)] mt-5 mb-8"></span>

        {/* Intro */}
        <div className="space-y-4">
          {service.intro.map((paragraph, i) => (
            <p
              key={i}
              className="text-sm sm:text-base text-[#555555] leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* What's included */}
        <div className="mt-10">
          <h2 className="font-serif text-xl sm:text-2xl text-[#111111] mb-4">
            What&apos;s Included
          </h2>
          <ul className="space-y-3">
            {service.included.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-[#555555]">
                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-[var(--accent-gold)] shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-12 border border-[var(--accent-gold)] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm sm:text-base text-[#111111]">
            Interested in {service.title.toLowerCase()} for your project?
          </p>
          <div className="flex gap-3 shrink-0">
            <a
              href="tel:+919822990577"
              className="text-xs sm:text-sm px-5 py-2.5 border border-[#111111] hover:bg-[#111111] hover:text-white transition text-center"
            >
              Call Now
            </a>
            <a
              href={`https://wa.me/919822990577?text=${encodeURIComponent(
                `Hi Ashwin, I'm interested in your ${service.title} service. Can we discuss further?`
              )}`}
              className="text-xs sm:text-sm px-5 py-2.5 bg-[#111111] text-white hover:bg-[var(--accent-gold)] transition text-center"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Related services */}
        <div className="mt-16">
          <h2 className="font-serif text-xl sm:text-2xl text-[#111111] mb-4">
            Other Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherServices.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="text-sm text-[#555555] hover:text-[var(--accent-gold)] border-b border-[var(--border)] py-3 transition-colors"
              >
                {s.title} &rarr;
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/portfolio"
            className="text-sm text-[var(--accent-gold)] underline underline-offset-4"
          >
            See examples of our work in the portfolio &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
