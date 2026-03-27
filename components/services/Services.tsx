export default function Services() {
  const services = [
    "Aluminium Windows",
    "Sliding Doors",
    "Glass Partitions",
    "Office Cabins",
    "Facade Work",
  ];

  return (
    <section id="services" className="w-full py-24 px-6 border-t border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
        
        {/* Left Side */}
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#111111]">
            Services
          </h2>
          <p className="text-[#555555] text-sm mt-3 max-w-sm">
            We provide high-quality aluminium and glass solutions for residential and commercial spaces.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex flex-col divide-y divide-[#E5E5E5]">
          {services.map((service, index) => (
            <div
              key={index}
              className="py-5 flex items-center justify-between group cursor-pointer"
            >
              <span className="text-[#111111] text-sm">
                {service}
              </span>

              {/* subtle arrow */}
              <span className="text-[#C0C0C0] group-hover:text-[#333333] transition">
                →
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}