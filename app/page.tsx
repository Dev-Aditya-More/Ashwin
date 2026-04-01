import Hero from "@/components/hero/Hero";
import Projects from "@/components/projects/Projects";
import Services from "@/components/services/Services";
import About from "@/components/about/About";
import Contact from "@/components/contact/Contact";
import Footer from "@/components/footer/Footer";

export default function Home() {
  return (
    <main className="bg-white text-[#111111] isolate">
      <Hero />
      <Projects />
      <Services />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}