"use client";

import { FaInstagram, FaFacebookF } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-6">

      <a
        href="https://instagram.com/ashwin_design"
        target="_blank"
        rel="noopener noreferrer"
        className="text-black/50 hover:text-[var(--accent-gold)] transition duration-300 transform hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(193,155,81,0.6)]"
      >
        <FaInstagram size={20} />
      </a>

      <a
        href="https://www.facebook.com/share/1BFHGWXmxF/?mibextid=wwXIfr"
        target="_blank"
        rel="noopener noreferrer"
        className="text-black/50 hover:text-[var(--accent-gold)] transition duration-300 transform hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(193,155,81,0.6)]"
      >
        <FaFacebookF size={20} />
      </a>

      <a
        href="mailto:yourmail@gmail.com"
        className="text-black/50 hover:text-[var(--accent-gold)] transition duration-300 transform hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(193,155,81,0.6)]"
      >
        <MdEmail size={20} />
      </a>

    </div>
  );
}