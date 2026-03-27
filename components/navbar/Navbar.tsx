"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b border-[#E5E5E5] bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="font-serif text-xl tracking-wide">
          ASHWIN ENTERPRISES
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#555555]">
          <Link href="#hero" className="hover:text-[#111111] transition">
            Home
          </Link>
          <Link href="#projects" className="hover:text-[#111111] transition">
            Projects
          </Link>
          <Link href="#services" className="hover:text-[#111111] transition">
            Services
          </Link>
          <Link href="#about" className="hover:text-[#111111] transition">
            About
          </Link>
          <Link href="#contact" className="hover:text-[#111111] transition">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}