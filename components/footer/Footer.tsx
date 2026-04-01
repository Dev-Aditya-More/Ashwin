export default function Footer() {
  return (
    <footer className="w-full border-t border-[#E5E5E5] py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-4 text-sm">
        
        <p className="text-[#111111]">
          &copy; {new Date().getFullYear()} Ashwin Interiors. All rights reserved.
        </p>

        <p className="text-[#555555]">
          Chhatrapati Sambhajinagar, Maharashtra
        </p>

      </div>
    </footer>
  );
}