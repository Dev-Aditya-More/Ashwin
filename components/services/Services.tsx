"use client";
import { useState } from "react";
import { motion } from "framer-motion";

const services = [
  {
    number: "01",
    title: "Civil Design",
    description:
      "Thoughtful planning and design that balances structure, aesthetics, and functionality for modern living spaces.",
  },
  {
    number: "02",
    title: "Interior Design",
    description:
      "End-to-end interior solutions focused on comfort, material harmony, and refined visual appeal.",
  },
  {
    number: "03",
    title: "Space Planning",
    description:
      "Efficient layouts that maximize usability while maintaining openness, flow, and elegance.",
  },
  {
    number: "06",
    title: "Site Execution & Supervision",
    description:
      "Careful on-site coordination to ensure quality, timelines, and design accuracy are maintained.",
  },
];

export default function Services() {
  const [hovered, setHovered] = useState<number | null>(null);

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section
      id="services"
      className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-10 bg-[var(--bg-2)] border-t border-[var(--border)]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-20 pb-6 md:pb-10 border-b border-[var(--border)]"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-[var(--text-primary)]">
            What We <br />
            <span className="italic text-[var(--gold-light)]">Offer</span>
          </h2>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
            Complete architecture and interior design solutions for residential
            and commercial spaces combining creativity, precision, and
            execution.
          </p>
        </motion.div>

        {/* Services list */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {services.map((s, i) => {
            const isActive = hovered === i || hovered === i;

            return (
              <motion.div
                key={i}
                variants={item}
                transition={{ duration: 0.5 }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setHovered(isActive ? null : i)}
                className={`grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-6 py-5 md:py-7 border-b border-[var(--border)] cursor-pointer transition ${
                  isActive ? "bg-[rgba(193,155,81,0.05)]" : ""
                }`}
              >
                {/* Number */}
                <span
                  className={`font-serif text-xs md:text-sm italic transition ${
                    isActive ? "text-[var(--gold)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {s.number}
                </span>

                {/* Content */}
                <div>
                  <h3
                    className={`font-serif text-lg sm:text-xl md:text-2xl transition ${
                      isActive
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {s.title}
                  </h3>

                  <p
                    className={`text-xs sm:text-sm text-[var(--text-muted)] mt-2 transition-all duration-300 ${
                      isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    } overflow-hidden`}
                  >
                    {s.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
