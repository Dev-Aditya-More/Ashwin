import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL, BUSINESS, OG_IMAGE } from "@/lib/seo";
import { posts } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Interior Design Guides & Tips | Ashwin, Sambhajinagar",
  description:
    "Practical guides on interior design cost, planning, materials and hiring a designer in Chhatrapati Sambhajinagar (Aurangabad), from the team at Ashwin.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: `Interior Design Guides | ${BUSINESS.name}`,
    description: "Practical interior design guides for homes and offices in Sambhajinagar (Aurangabad).",
    url: `${SITE_URL}/blog`,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default function BlogPage() {
  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 md:px-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          ],
        }}
      />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#111111]">Guides &amp; Tips</h1>
        <span className="block w-12 h-[2px] bg-[var(--accent-gold)] mt-5 mb-8"></span>
        <p className="text-sm sm:text-base text-[#555555] leading-relaxed mb-10">
          Plain advice from our site experience on planning, budgeting and building interiors in Chhatrapati Sambhajinagar.
        </p>
        <div className="space-y-8">
          {posts.map((p) => (
            <article key={p.slug} className="border-b border-[var(--border)] pb-8">
              <time dateTime={p.date} className="text-xs text-[#888888]">
                {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              <h2 className="font-serif text-xl sm:text-2xl text-[#111111] mt-1">
                <Link href={`/blog/${p.slug}`} className="hover:text-[var(--accent-gold)] transition-colors">
                  {p.title}
                </Link>
              </h2>
              <p className="text-sm text-[#555555] leading-relaxed mt-2">{p.description}</p>
              <Link href={`/blog/${p.slug}`} className="text-sm text-[var(--accent-gold)] underline underline-offset-4 mt-3 inline-block">
                Read more &rarr;
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
