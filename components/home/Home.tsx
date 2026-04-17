"use client";

import { motion } from "framer-motion";
import SocialLinks from "../ui/SocialLinks";

export default function Home() {
  return (
    <section
      id="home"
      className="relative w-full min-h-[85vh] md:h-[90vh] flex items-center justify-center"
    >
      {/* Background */}
      <img
        src="/project/6.jpeg"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      <div className="absolute inset-0 bg-black/20 z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex justify-center px-4 sm:px-6 md:px-10">
        <div
          className="
    text-center 
    px-6 py-8 
    rounded-xl 
    bg-white max-w-3xl w-full
  "
        >
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex justify-center"
          >
            <img
              src="/ashwinLogo.png"
              alt="Ashwin Interiors"
              className="
      w-[140px] sm:w-[180px] md:w-[220px] 
      object-contain
    "
            />
          </motion.div>

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

            {/* WhatsApp */}
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
            {/* Divider */}
            <div className="w-12 h-[1px] bg-black/50 mb-4 opacity-60" />

            <SocialLinks />
          </div>

        </div>
      </div>
    </section>
  );
}
