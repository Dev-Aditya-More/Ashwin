import Link from "next/link";
import { services } from "@/lib/services-data";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#E5E5E5] py-12 px-4 sm:px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1">
          <p className="font-serif text-lg text-[#111111]">Ashwin Interiors</p>
          <p className="mt-3 text-xs text-[#777777] leading-relaxed">
            Civil, architectural, landscape, and interior design services —
            based in Chhatrapati Sambhajinagar, serving clients across India.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#888888] mb-3">
            Explore
          </p>
          <ul className="space-y-2 text-[#555555]">
            <li>
              <Link href="/" className="hover:text-[var(--accent-gold)]">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/portfolio"
                className="hover:text-[var(--accent-gold)]"
              >
                Portfolio
              </Link>
            </li>
            <li>
              <Link
                href="/services"
                className="hover:text-[var(--accent-gold)]"
              >
                Services
              </Link>
            </li>
            <li>
              <Link
                href="/#about"
                className="hover:text-[var(--accent-gold)]"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/#contact"
                className="hover:text-[var(--accent-gold)]"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#888888] mb-3">
            Services
          </p>
          <ul className="space-y-2 text-[#555555]">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="hover:text-[var(--accent-gold)]"
                >
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#888888] mb-3">
            Contact
          </p>
          <ul className="space-y-2 text-[#555555]">
            <li>
              <a
                href="tel:+919822990577"
                className="hover:text-[var(--accent-gold)]"
              >
                +91 9822 990 577
              </a>
            </li>
            <li>
              <a
                href="mailto:vikas@ashwin.world"
                className="hover:text-[var(--accent-gold)]"
              >
                vikas@ashwin.world
              </a>
            </li>
            <li className="text-xs leading-relaxed text-[#777777]">
              10, Ghole Complex, Near Mhaske Petrol Pump, Beed Bypass Road,
              Chhatrapati Sambhajinagar – 431010, Maharashtra, India
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#E5E5E5]">
        <p className="text-[#111111] text-xs">
          &copy; {new Date().getFullYear()} Ashwin Interiors. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
