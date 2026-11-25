import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL, BUSINESS, BUSINESS_ID, OG_IMAGE } from "@/lib/seo";
import { posts, getPost } from "@/lib/blog-data";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.description, url, type: "article", images: [OG_IMAGE] },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const more = posts.filter((p) => p.slug !== post.slug);

  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 md:px-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          mainEntityOfPage: url,
          author: { "@id": BUSINESS_ID, name: BUSINESS.name },
          publisher: { "@id": BUSINESS_ID, name: BUSINESS.name },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        }}
      />
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-[#888888] mb-8">
          <Link href="/" className="hover:text-[var(--accent-gold)]">Home</Link> /{" "}
          <Link href="/blog" className="hover:text-[var(--accent-gold)]">Blog</Link>
        </nav>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#111111]">{post.title}</h1>
        <span className="block w-12 h-[2px] bg-[var(--accent-gold)] mt-5 mb-8"></span>
        <p className="text-base text-[#555555] leading-relaxed">{post.intro}</p>

        {post.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="font-serif text-xl sm:text-2xl text-[#111111] mb-3">{s.heading}</h2>
            <div className="space-y-4">
              {s.body.map((b, i) => (
                <p key={i} className="text-sm sm:text-base text-[#555555] leading-relaxed">{b}</p>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-12 border border-[var(--accent-gold)] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm sm:text-base text-[#111111]">
            Planning a project?{" "}
            <Link href={`/services/${post.service.slug}`} className="underline underline-offset-4">
              See our {post.service.label} service
            </Link>
            .
          </p>
          <div className="flex gap-3 shrink-0">
            <a href="tel:+919822990577" className="text-xs sm:text-sm px-5 py-2.5 border border-[#111111] hover:bg-[#111111] hover:text-white transition text-center">
              Call Now
            </a>
            <a
              href={`https://wa.me/919822990577?text=${encodeURIComponent("Hi Ashwin, I read your guide and would like to discuss my project.")}`}
              className="text-xs sm:text-sm px-5 py-2.5 bg-[#111111] text-white hover:bg-[var(--accent-gold)] transition text-center"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-serif text-xl sm:text-2xl text-[#111111] mb-4">More Guides</h2>
          <div className="grid grid-cols-1 gap-1">
            {more.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="text-sm text-[#555555] hover:text-[var(--accent-gold)] border-b border-[var(--border)] py-3 transition-colors">
                {p.title} &rarr;
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
