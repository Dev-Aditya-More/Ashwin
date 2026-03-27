export default function Hero() {
  return (
    <section id="hero" className="relative w-full h-[90vh] flex items-center justify-center">
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1503387762-592deb58ef4e"
        alt="Glass Work"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay (important for readability) */}
      <div className="absolute inset-0 bg-white/60" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <h1 className="font-serif text-4xl md:text-6xl text-[#111111] leading-tight">
          Aluminium & Glass Solutions
        </h1>

        <p className="mt-4 text-[#555555] text-sm md:text-base">
          Windows | Sliding Doors | Partitions | Facade Work
        </p>

        {/* Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
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
            href="https://wa.me/+919822990577"
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
    </section>
  );
}
