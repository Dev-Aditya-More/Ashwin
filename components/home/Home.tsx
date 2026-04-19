"use client";

import { motion } from "framer-motion";
import SocialLinks from "../ui/SocialLinks";
import Image from "next/image";

export default function Home() {
  return (
    <section
      id="home"
      className="relative w-full min-h-[85vh] md:h-[90vh] flex items-center justify-center"
    >
      {/* Background */}
      <Image
        src="/project/6.jpeg"
        alt="Modern bedroom interior design in Sambhajinagar"
        fill
        priority
        className="object-cover z-0"
      />

      <div className="absolute inset-0 bg-black/20 z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex justify-center px-4 sm:px-6 md:px-10">
        <div className="text-center px-6 py-8 rounded-xl bg-white max-w-3xl w-full">
          {/* ✅ SEO Heading (invisible visually if needed) */}
          <h1 className="sr-only">
            Interior and Architectural Design in Sambhajinagar
          </h1>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex justify-center"
          >
            <Image
              src="/ashwinLogo.png"
              alt="Ashwin Logo"
              width={220}
              height={120}
              priority
              className="object-contain"
            />
          </motion.div>

          <p className="mt-5 text-sm sm:text-base text-black/70 max-w-md mx-auto leading-relaxed tracking-[0.02em]">
            Civil planning, architectural design & interior solutions in
              Chhatrapati Sambhajinagar
          </p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="tel:+919822990577"
              className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 text-white border bg-[var(--accent-blue)] group text-center w-full sm:w-auto"
            >
              <span className="absolute inset-0 w-0 bg-[var(--accent-blue)] transition-all duration-300 group-hover:w-full"></span>
              <span className="relative z-10 group-hover:text-black transition">
                Call Now
              </span>
            </a>

            <a
              href="https://wa.me/919822990577?text=Hi%20Ashwin,%20I%20am%20interested%20in%20your%20services.%20Can%20we%20discuss%20further?"
              className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 bg-[#111111] text-white group text-center w-full sm:w-auto"
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
