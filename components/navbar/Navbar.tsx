"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "page" links are real routes Google can crawl directly.
  // "anchor" links only exist as sections on the homepage.
  const links: { label: string; href: string; type: "page" | "anchor" }[] = [
    { label: "Home", href: "/", type: "anchor" },
    { label: "Portfolio", href: "/portfolio", type: "page" },
    { label: "Services", href: "/services", type: "page" },
    { label: "About", href: "/#about", type: "anchor" },
    { label: "Contact", href: "/#contact", type: "anchor" },
  ];

  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const id = href === "/" ? "home" : href.replace("/#", "");

    // If we're on the home page, scroll to the section
    if (pathname === "/") {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", `#${id}`);
      }
    } else {
      // If we're on a sub-page, navigate to home with the hash
      router.push(`/#${id}`);
    }
    setMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/90 backdrop-blur-lg border-b border-white/10"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 flex items-center h-[70px] md:h-[84px] transition-all">
        {/* Empty left spacer (only for desktop centering) */}
        <div className="hidden md:block flex-1" />

        {/* Desktop Nav (centered) */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 px-6 py-2">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={
                link.type === "anchor"
                  ? (e) => handleAnchorClick(e, link.href)
                  : () => setMenuOpen(false)
              }
              className="group relative text-[11px] tracking-[0.22em] uppercase text-white/60 hover:text-white transition"
            >
              <span className="relative">
                {link.label}
                <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex-1 flex justify-end">
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg px-6 py-6 flex flex-col gap-6">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={
                link.type === "anchor"
                  ? (e) => handleAnchorClick(e, link.href)
                  : () => setMenuOpen(false)
              }
              className="text-sm uppercase tracking-widest text-white/80 hover:text-[#DDB96A] transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
