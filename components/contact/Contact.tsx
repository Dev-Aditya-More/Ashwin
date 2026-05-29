"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = [
      `Hi Ashwin, I'd like to make an enquiry.`,
      `*Name:* ${form.name}`,
      form.phone ? `*Phone:* ${form.phone}` : null,
      form.email ? `*Email:* ${form.email}` : null,
      form.service ? `*Service:* ${form.service}` : null,
      form.message ? `*Message:* ${form.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/919822990577?text=${encodeURIComponent(text)}`,
      "_blank"
    );
    setSubmitted(true);
  }

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
            Let&apos;s hear
            <br />
            <span className="italic text-[var(--accent-gold)]">From You</span>
          </motion.h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 sm:gap-10 md:gap-12 items-start">
          {/* Left — contact details */}
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
                className="font-sans text-base sm:text-lg md:text-xl text-[#111111] tracking-wide hover:text-[var(--accent-gold)] transition"
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
                className="font-sans text-base sm:text-lg md:text-xl text-[#111111] tracking-wide hover:text-[var(--accent-gold)] transition"
              >
                vikas@ashwin.world
              </a>
            </motion.div>

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="mb-6 sm:mb-8 md:mb-10"
            >
              <p className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#888888] mb-2">
                Address
              </p>
              <p className="font-sans text-[14px] sm:text-[15px] md:text-[16px] text-[#111111] tracking-wide leading-relaxed">
                10, Ghole Complex, Near Mhaske Petrol Pump
                <br />
                Beed Bypass Road
                <br />
                Chhatrapati Sambhajinagar – 431010
                <br />
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

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <a
                href="tel:+919822990577"
                className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 border border-[#111111] group text-center w-full sm:w-auto"
              >
                <span className="absolute inset-0 w-0 bg-[var(--accent-blue)] transition-all duration-600 group-hover:w-full" />
                <span className="relative z-10 group-hover:text-white transition">
                  Call Now
                </span>
              </a>

              <a
                href="https://wa.me/919822990577?text=Hi%20Ashwin,%20I%20am%20interested%20in%20your%20services.%20Can%20we%20discuss%20further?"
                className="relative overflow-hidden text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 bg-[#111111] text-white group text-center w-full sm:w-auto"
              >
                <span className="absolute inset-0 w-0 bg-[var(--accent-gold)] transition-all duration-600 group-hover:w-full" />
                <span className="relative z-10">Chat on WhatsApp</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Right — Inquiry Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full border border-[var(--accent-gold)] bg-white p-6 sm:p-8 md:p-10"
          >
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#888888] mb-1">
              Enquiry
            </p>
            <h3 className="font-serif text-xl sm:text-2xl text-[#111111] mb-6">
              Send us a message
            </h3>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--accent-gold)]">
                  Message Sent
                </p>
                <p className="font-sans text-[#111111] text-base">
                  Your enquiry has been forwarded via WhatsApp.
                  <br />
                  We&apos;ll get back to you shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({
                      name: "",
                      phone: "",
                      email: "",
                      service: "",
                      message: "",
                    });
                  }}
                  className="mt-2 text-xs tracking-widest uppercase underline underline-offset-4 text-[#888888] hover:text-[var(--accent-gold)] transition"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] tracking-[0.2em] uppercase text-[#888888]">
                    Name <span className="text-[var(--accent-gold)]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full border border-[#E5E5E5] bg-[#fafafa] px-4 py-3 text-sm text-[#111111] placeholder:text-[#aaaaaa] outline-none focus:border-[var(--accent-gold)] transition"
                  />
                </div>

                {/* Phone + Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] tracking-[0.2em] uppercase text-[#888888]">
                      Phone <span className="text-[var(--accent-gold)]">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full border border-[#E5E5E5] bg-[#fafafa] px-4 py-3 text-sm text-[#111111] placeholder:text-[#aaaaaa] outline-none focus:border-[var(--accent-gold)] transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] tracking-[0.2em] uppercase text-[#888888]">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full border border-[#E5E5E5] bg-[#fafafa] px-4 py-3 text-sm text-[#111111] placeholder:text-[#aaaaaa] outline-none focus:border-[var(--accent-gold)] transition"
                    />
                  </div>
                </div>

                {/* Service */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] tracking-[0.2em] uppercase text-[#888888]">
                    Service Interested In
                  </label>
                  <select
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    className="w-full border border-[#E5E5E5] bg-[#fafafa] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[var(--accent-gold)] transition appearance-none cursor-pointer"
                  >
                    <option value="">Select a service</option>
                    <option>Civil Planning</option>
                    <option>Architectural Design</option>
                    <option>Interior Design</option>
                    <option>Site Execution</option>
                    <option>Complete Project</option>
                  </select>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] tracking-[0.2em] uppercase text-[#888888]">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your project or requirement…"
                    className="w-full border border-[#E5E5E5] bg-[#fafafa] px-4 py-3 text-sm text-[#111111] placeholder:text-[#aaaaaa] outline-none focus:border-[var(--accent-gold)] transition resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="relative overflow-hidden mt-1 text-xs sm:text-sm tracking-widest uppercase px-6 py-3 bg-[#111111] text-white group text-center w-full"
                >
                  <span className="absolute inset-0 w-0 bg-[var(--accent-gold)] transition-all duration-500 group-hover:w-full" />
                  <span className="relative z-10">Send Enquiry via WhatsApp</span>
                </button>

                <p className="text-[10px] text-[#aaaaaa] text-center mt-1">
                  Your message will open in WhatsApp for quick response.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
