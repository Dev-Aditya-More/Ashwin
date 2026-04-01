"use client";

import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-10 border-t border-[#E5E5E5] bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative group"
        >
          <div className="absolute -top-3 -left-3 right-3 bottom-3 sm:-top-5 sm:-left-5 sm:right-5 sm:bottom-5 border border-[var(--accent-gold)] pointer-events-none" />

          <div className="w-full aspect-[4/5] overflow-hidden">
            <motion.img
              src="/project/3.jpeg"
              alt="Work"
              initial={{ scale: 1.1 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 1 }}
              className="w-full h-full object-cover grayscale-[20%] brightness-90 group-hover:scale-105 transition duration-700"
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          viewport={{ once: true }}
        >

          {/* Label */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[var(--accent-gold)] flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4"
          >
            <span className="w-5 sm:w-6 h-[1px] bg-[var(--accent-gold)]" />
            About Us
          </motion.p>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="font-serif text-2xl sm:text-3xl md:text-5xl text-[#111111] leading-tight"
          >
            Crafting Spaces
            <br />
            <span className="italic text-[var(--accent-gold)]">With Purpose</span>
          </motion.h2>

          {/* Divider */}
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "2.5rem" }}
            transition={{ delay: 0.4, duration: 0.5 }}
            viewport={{ once: true }}
            className="h-[1px] bg-[var(--accent-gold)] my-4 sm:my-6"
          />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm text-[#555555] leading-relaxed mb-3 sm:mb-4 max-w-md"
          >
            Established in 2016, we bring years of experience in civil, architectural, landscape, and interior design, delivering thoughtful solutions for residential and commercial spaces.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm text-[#555555] leading-relaxed mb-6 sm:mb-8 max-w-md"
          >
            From concept to execution, every project is handled with attention to detail, ensuring quality, precision, and a seamless experience.
          </motion.p>

          {/* Points (staggered) */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.12,
                },
              },
            }}
            className="space-y-3 sm:space-y-4"
          >
            {[
              {
                title: "Design Expertise",
                desc: "Strong focus on planning, aesthetics, and spatial balance.",
              },
              {
                title: "Quality Execution",
                desc: "Clean finishes and reliable on-site workmanship.",
              },
              {
                title: "On-Time Delivery",
                desc: "Structured workflow ensuring timely completion.",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                className="flex gap-2 sm:gap-3"
              >
                <div className="w-2 h-2 bg-[var(--accent-gold)] mt-2 rounded-full" />
                <div>
                  <p className="text-xs sm:text-sm text-[#111111]">{item.title}</p>
                  <p className="text-[11px] sm:text-xs text-[#777777]">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}