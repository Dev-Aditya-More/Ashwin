import HomeSection from "@/components/home/Home";
import Services from "@/components/services/Services";
import About from "@/components/about/About";
import Contact from "@/components/contact/Contact";
import Portfolio from "@/components/projects/Projects";
import type { Metadata } from "next";

// Home page inherits title/description from layout.tsx
// but we explicitly set canonical here to prevent any duplicate issues
export const metadata: Metadata = {
  alternates: {
    canonical: "https://ashwin.world",
  },
};

export default function Home() {
  return (
    <main className="bg-white text-[#111111] isolate">
      <HomeSection />
      <Portfolio />
      <Services />
      <About />
      <Contact />
    </main>
  );
}