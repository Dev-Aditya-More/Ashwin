"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Portfolio() {
  const [active, setActive] = useState<number | null>(null);

  const projects = [
    { title: "Living Room Interior", image: "/project/1.jpeg" },
    { title: "Bedroom Design", image: "/project/3.jpeg" },
    { title: "Modern Kitchen", image: "/project/4.jpeg" },
    { title: "TV Unit Design", image: "/project/5.jpeg" },
    { title: "Wardrobe & Storage", image: "/project/6.jpeg" },
    { title: "Lighting & Ceiling", image: "/project/7.jpeg" },
  ];

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section id="projects" className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-10 border-t border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
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

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
        >
          {projects.map((project, index) => {
            const isActive = active === index;

            return (
              <motion.div
                key={index}
                variants={item}
                transition={{ duration: 0.5 }}
                onClick={() => setActive(isActive ? null : index)}
                className="group relative overflow-hidden cursor-pointer"
              >

                {/* Image with subtle zoom animation */}
                <motion.img
                  src={project.image}
                  alt={project.title}
                  initial={{ scale: 1.1 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="w-full h-[200px] sm:h-[240px] md:h-[300px] object-cover group-hover:scale-105 transition"
                />

                {/* Overlay */}
                <div
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center transition duration-300 ${
                    isActive ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                  }`}
                >
                  <p className="text-white text-xs sm:text-sm text-center px-2">
                    {project.title}
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