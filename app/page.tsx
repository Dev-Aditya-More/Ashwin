import Hero from "@/components/hero/Hero";
import Services from "@/components/services/Services";
import About from "@/components/about/About";
import Contact from "@/components/contact/Contact";
import Footer from "@/components/footer/Footer";
import Portfolio from "@/components/projects/Projects";

export default function Home() {
  return (
    <main className="bg-white text-[#111111] isolate">
      <Hero />
      <Portfolio />
      <Services />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}