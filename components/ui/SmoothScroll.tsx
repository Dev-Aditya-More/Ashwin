"use client";

import { useEffect } from "react";

export default function SmoothScroll() {
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash) {
        const id = window.location.hash.replace("#", "");
        const element = document.getElementById(id);

        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth" });
          }, 100); // slight delay for layout
        }
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes (e.g., when navigating from portfolio page)
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return null;
}