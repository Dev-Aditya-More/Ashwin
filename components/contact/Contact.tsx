"use client";

import { motion } from "framer-motion";

export default function Contact() {
  return (
    <section
      id="contact"
      className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-10 border-t border-[#E5E5E5] bg-[#fafafa]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-12 md:mb-16 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[var(--accent-gold)] mb-3 sm:mb-4"
          >
            Get in Touch
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="font-serif text-2xl sm:text-4xl md:text-6xl lg:text-7xl text-[#111111] leading-tight"
          >
            Let’s hear
            <br />
            <span className="italic text-[var(--accent-gold)]">From You</span>
          </motion.h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 sm:gap-10 md:gap-12 items-start">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {/* Phone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="mb-6 sm:mb-8 md:mb-10"
            >
              <p className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#888888] mb-2">
                Phone
              </p>

              <a
                href="tel:+919822990577"
                className="font-serif text-lg sm:text-xl md:text-2xl text-[#111111] hover:text-[var(--accent-gold)] transition"
              >
                +91 9822 990 577
              </a>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              viewport={{ once: true }}
              className="mb-6 sm:mb-8 md:mb-10"
            >
              <p className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#888888] mb-2">
                Email
              </p>

              <a
                href="mailto:vikas@ashwin.world"
                className="font-serif text-lg sm:text-xl md:text-2xl text-[#111111] hover:text-[var(--accent-gold)] transition"
              >
                vikas@ashwin.world
              </a>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="mb-6 sm:mb-8 md:mb-10"
            >
              <p className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#888888] mb-2">
                Location
              </p>

              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                Chhatrapati Sambhajinagar <br />
                Maharashtra, India
              </p>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              transition={{ delay: 0.4, duration: 0.5 }}
              viewport={{ once: true }}
              className="h-[1px] bg-[#E5E5E5] mb-6 sm:mb-8"
            />

            {/* Buttons (UNCHANGED, just wrapped) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              {/* Call */}
              <a
                href="tel:+919822990577"
                className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 border border-[#111111] group text-center w-full sm:w-auto"
              >
                <span className="absolute inset-0 w-0 bg-[var(--accent-blue)] transition-all duration-600 group-hover:w-full"></span>
                <span className="relative z-10 group-hover:text-white transition">
                  Call Now
                </span>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/919822990577?text=Hi%20Ashwin%20Interiors,%20I%20am%20interested%20in%20your%20services.%20Can%20we%20discuss%20further?"
                className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 bg-[#111111] text-white group text-center w-full sm:w-auto"
              >
                <span className="absolute inset-0 w-0 bg-[var(--accent-gold)] transition-all duration-600 group-hover:w-full"></span>
                <span className="relative z-10">Chat on WhatsApp</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full border border-[var(--accent-gold)] bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-between"
          >
            {/* Title */}
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#888888] mb-4">
                Address
              </p>

              {/* Main Address */}
              <p className="text-base sm:text-lg md:text-xl font-serif text-[#111111] leading-relaxed">
                10, Ghole Complex <br />
                Near Mhaske Petrol Pump <br />
                Beed Bypass Road
              </p>

              <p className="text-sm text-[#666666] mt-3">
                Chhatrapati Sambhajinagar - 431010
              </p>
            </div>

            {/* CTA */}
            <a
              href="https://www.google.com/maps/search/?api=1&query=Ghole+Complex+Beed+Bypass+Road+Sambhajinagar"
              target="_blank"
              className="mt-6 inline-block text-sm text-[var(--accent-gold)] underline"
            >
              Open in Google Maps →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
