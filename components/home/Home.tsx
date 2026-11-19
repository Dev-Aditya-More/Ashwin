"use client";

import { motion } from "framer-motion";
import SocialLinks from "../ui/SocialLinks";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";

export default function Home() {
  const phoneNumber = "+919822990577";

  const handleCallClick = () => {
    if (typeof window === "undefined") return;

    const isMobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent,
      );

    if (isMobile) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      navigator.clipboard.writeText(phoneNumber);

      // optional but clean feedback
      alert(`Number copied: ${phoneNumber}`);
    }
  };

  return (
    <section
      id="home"
      className="relative w-full min-h-[88vh] md:h-[94vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <Image
        src="/project/6.jpeg"
        alt="Modern bedroom interior designed by Ashwin in Chhatrapati Sambhajinagar (Aurangabad)"
        fill
        priority
        className="object-cover object-[50%_60%] z-0 saturate-[1.1]"
      />

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/10 to-black/55" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.38)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 z-[2] bg-gradient-to-b from-transparent to-white" />

      {/* Content */}
      <div className="relative z-10 flex justify-center px-4 sm:px-6 md:px-10">
        <div className="relative text-center px-6 py-8 sm:px-12 sm:py-12 rounded-3xl bg-white/95 backdrop-blur-xl ring-1 ring-[rgba(193,155,81,0.55)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7),0_0_0_8px_rgba(255,255,255,0.12)] max-w-xl w-full">
          {/* ✅ SEO Heading (invisible visually if needed) */}
          <h1 className="sr-only">
            Ashwin — Interior Designer, Architect &amp; Glass Work in
            Chhatrapati Sambhajinagar (Aurangabad)
          </h1>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex justify-center"
          >
            <Logo contain className="aspect-[421/325] h-32 sm:h-40 w-auto" />
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-7 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleCallClick}
              data-lead="call_click"
              className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 text-white border border-transparent bg-[var(--accent-blue)] btn-depth group text-center w-full sm:w-auto"
            >
              <span className="absolute inset-0 w-0 bg-[var(--accent-blue)] transition-all duration-300 group-hover:w-full"></span>

              <span className="relative z-10 group-hover:text-black transition">
                Call Now
              </span>
            </button>

            <a
              href="https://wa.me/919822990577?text=Hi%20Ashwin,%20I%20am%20interested%20in%20your%20services.%20Can%20we%20discuss%20further?"
              className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 bg-[#111111] text-white btn-depth group text-center w-full sm:w-auto"
            >
              <span className="absolute inset-0 w-0 bg-[var(--accent-gold)] transition-all duration-500 group-hover:w-full"></span>
              <span className="relative z-10 group-hover:text-black transition">
                Chat on WhatsApp
              </span>
            </a>
          </motion.div>

          {/* Social Links */}
          <div className="mt-6 flex flex-col items-center">
            <div className="w-12 h-[1px] bg-black/50 mb-4 opacity-60" />
            <SocialLinks />
          </div>
        </div>
      </div>
    </section>
  );
}
