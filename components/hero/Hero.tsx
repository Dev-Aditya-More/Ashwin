"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="hero" className="relative w-full min-h-[85vh] md:h-[90vh] flex items-center justify-center">

      {/* Background */}
      <img
        src="/project/6.jpeg"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      <div className="absolute inset-0 bg-white/60 z-[1]" />

      {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 md:px-10 max-w-3xl">

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#111111]"
        >
          Architecture & Interior Design
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-3 text-[#555555] text-sm"
        >
          Plan • Design • Execute
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="tel:+919822990577"
            className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 border border-[#111111] group text-center w-full sm:w-auto"
          >
            <span className="relative z-10 group-hover:text-white transition">
              Call Now
            </span>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/919822990577?text=Hi%20Ashwin%20Interiors,%20I%20am%20interested%20in%20your%20services.%20Can%20we%20discuss%20further?"
            className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 bg-[#111111] text-white group text-center w-full sm:w-auto"
          >
            <span className="absolute inset-0 w-0 bg-[var(--accent-gold)] transition-all duration-500 group-hover:w-full"></span>

            <span className="relative z-10">
              Chat on WhatsApp
            </span>
          </a>
        </motion.div>

      </div>
    </section>
  );
}