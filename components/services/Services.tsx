"use client";
import { useState } from "react";
import { motion } from "framer-motion";

const services = [
  {
    title: "Landscape Design",
    description:
      "Creating harmonious outdoor spaces that blend nature, functionality, and aesthetics for a serene living experience.",
  },
  {
    title: "Civil Planning",
    description:
      "Thoughtful planning and design that balances structure, aesthetics, and functionality for modern living spaces.",
  },
  {
    title: "Architectural Design",
    description:
      "Creative architectural solutions that blend form and function, creating visually striking and livable spaces.",
  },
  {
    title: "Interior Design",
    description:
      "End-to-end interior solutions focused on comfort, material harmony, and refined visual appeal.",
  },
  {
    title: "Space Planning",
    description:
      "Efficient layouts that maximize usability while maintaining openness, flow, and elegance.",
  },
  {
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
      className="w-full pt-10 sm:pt-12 md:pt-14 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 md:px-10 bg-[var(--bg-2)] border-t border-[var(--border)]"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* ✅ FIXED HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8 md:mb-10 pb-4 md:pb-6 border-b border-[var(--border)]"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-[var(--text-primary)]">
            What We <br />
            <span className="italic text-[var(--gold-light)]">Offer</span>
          </h2>

          <p className="mt-4 max-w-lg text-sm text-[var(--text-secondary)] leading-relaxed">
            Comprehensive civil, architectural, landscape, and interior design solutions tailored for residential and commercial spaces.
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
            const isActive = hovered === i;

            return (
              <motion.div
                key={i}
                variants={item}
                transition={{ duration: 0.5 }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setHovered(isActive ? null : i)}
                className={`grid grid-cols-[20px_1fr] gap-4 md:gap-6 py-5 md:py-7 border-b border-[var(--border)] cursor-pointer transition ${
                  isActive ? "bg-[rgba(193,155,81,0.05)]" : ""
                }`}
              >
                {/* Bullet */}
                <div className="flex items-start justify-center mt-2">
                  <span
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-[var(--gold)] scale-125"
                        : "bg-[var(--text-muted)]"
                    }`}
                  />
                </div>

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