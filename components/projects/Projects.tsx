"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Props = {
  isFullPage?: boolean;
};

export default function Projects({ isFullPage = false }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(isFullPage ? 12 : 6);

  const projects = Array.from({ length: 74 }, (_, i) => ({
    title: `Interior project ${i + 1}`,
    image: `/project/${i + 1}.jpeg`,
  }));

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <section
      id="portfolio"
      className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-10 border-t border-[#E5E5E5]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading (only on homepage) */}
        {!isFullPage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-[#111111]">
              Portfolio
            </h2>

            <span className="block w-10 h-[2px] bg-[var(--accent-gold)] mt-3"></span>

            <p className="text-[#555555] text-xs sm:text-sm mt-3">
              Interior and architectural work
            </p>
          </motion.div>
        )}

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
        >
          {projects.slice(0, visibleCount).map((project, index) => (
            <motion.div
              key={index}
              variants={item}
              transition={{ duration: 0.4 }}
              onClick={() => setSelected(index)}
              className="group relative overflow-hidden cursor-pointer"
            >
              <motion.div
                initial={{ scale: 1.08 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-full h-[200px] sm:h-[240px] md:h-[300px]"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </motion.div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition duration-300">
                <p className="text-white text-xs sm:text-sm text-center px-2">
                  {project.title}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ✅ Load More (only full page) */}
        {isFullPage && visibleCount < projects.length && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="px-6 py-3 border border-black text-sm hover:bg-black hover:text-white transition"
            >
              Load More
            </button>
          </div>
        )}

        {/* ✅ View All (only homepage) */}
        {!isFullPage && (
          <div className="mt-10 flex justify-center">
            <Link
              href="/portfolio"
              className="relative overflow-hidden text-xs sm:text-sm px-6 py-3 border border-[#111111] text-[#111111] group"
            >
              <span className="absolute inset-0 w-0 bg-[var(--accent-gold)] transition-all duration-300 group-hover:w-full"></span>

              <span className="relative z-10 group-hover:text-black transition">
                View All
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ✅ Modal */}
      {selected !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={projects[selected].image}
              alt={projects[selected].title}
              width={1200}
              height={800}
              className="w-full h-auto object-contain rounded-lg shadow-2xl"
              priority
            />

            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-white text-xl bg-black/60 hover:bg-black px-3 py-1 rounded transition"
            >
              ✕
            </button>

            <p className="text-white text-center mt-4 text-sm tracking-wide">
              {projects[selected].title}
            </p>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}