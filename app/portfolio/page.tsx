import Projects from "@/components/projects/Projects";

export const metadata = {
  title: "Portfolio | Ashwin Interiors",
  description:
    "Explore interior and architectural projects by Ashwin Interiors in Chhatrapati Sambhajinagar.",
};

export default function PortfolioPage() {
  return (
    <main className="pt-24 pb-16 px-4 sm:px-6 md:px-10">

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

    </main>
  );
}