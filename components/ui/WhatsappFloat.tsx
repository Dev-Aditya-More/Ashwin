import { FaWhatsapp } from "react-icons/fa";

export default function WhatsappFloat() {
  return (
    <a
      href="https://wa.me/919822990577?text=Hi%20Ashwin,%20I%20am%20interested%20in%20your%20services.%20Can%20we%20discuss%20further?"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 w-16 h-16 
bg-[var(--accent-green)] hover:bg-[var(--accent-gold)]
text-white rounded-full flex items-center justify-center shadow-xl 
hover:scale-110 hover:shadow-[0_0_20px_rgba(193,155,81,0.6)] 
transition-all duration-300"
    >
      <FaWhatsapp size={28} />
    </a>
  );
}