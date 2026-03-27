export default function Contact() {
  return (
    <section id="contact" className="w-full py-24 px-6 border-t border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
        {/* Left */}
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#111111]">
            Contact
          </h2>

          <p className="text-[#555555] text-sm mt-3 max-w-sm">
            Get in touch for enquiries, quotations, or project discussions.
          </p>

          {/* Contact Info */}
          <div className="mt-6 space-y-3 text-sm">
            <a
              href="tel:+919822990577"
              className="block text-[#111111] hover:text-[#333333]"
            >
              +91 9822990577
            </a>

            <p className="text-[#555555]">Pune, Maharashtra, India</p>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <a
              href="tel:+919822990577"
              className="relative overflow-hidden border border-[#111111] text-[#111111] text-sm px-6 py-3 group"
            >
              {/* Fill layer */}
              <span className="absolute inset-0 w-0 bg-[var(--accent)] transition-all duration-300 ease-out group-hover:w-full"></span>

              {/* Text */}
              <span className="relative z-10 transition-colors duration-200 group-hover:text-white">
                Call Now
              </span>
            </a>

            <a
              href="https://wa.me/919999999999"
              className="relative overflow-hidden bg-[#C0C0C0] text-[#111111] text-sm px-6 py-3 group"
            >
              {/* Fill layer */}
              <span className="absolute inset-0 w-0 bg-[#111111] transition-all duration-300 ease-out group-hover:w-full"></span>

              {/* Text */}
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                Chat on WhatsApp
              </span>
            </a>
          </div>
        </div>

        {/* Right (Map Placeholder) */}
        <div className="w-full h-[300px] md:h-[400px] border border-[#E5E5E5]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3752.7616003424923!2d75.34364867512063!3d19.85003768152042!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdba2f489c3c585%3A0x952c2315ad19deb9!2sAshwin%20Enterprises!5e0!3m2!1sen!2sin!4v1774634403816!5m2!1sen!2sin"
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
