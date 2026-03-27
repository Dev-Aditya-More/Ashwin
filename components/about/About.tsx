export default function About() {
  return (
    <section id="about" className="w-full py-24 px-6 border-t border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        
        {/* Image */}
        <div className="w-full h-[300px] md:h-[400px] overflow-hidden border border-[#E5E5E5]">
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e"
            alt="Work"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#111111]">
            About Us
          </h2>

          <p className="text-[#555555] text-sm mt-4 leading-relaxed max-w-md">
            With years of experience in aluminium and glass work, we specialize in delivering reliable and high-quality solutions for homes and commercial spaces. Our focus is on precision, durability, and clean finishes that enhance both functionality and design.
          </p>

          {/* Key points */}
          <div className="mt-6 space-y-2 text-sm text-[#111111]">
            <p>• Experienced craftsmanship</p>
            <p>• Quality materials</p>
            <p>• Timely project delivery</p>
          </div>
        </div>

      </div>
    </section>
  );
}