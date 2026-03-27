"use client";

import { useEffect } from "react";

export default function SmoothScroll() {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const element = document.getElementById(id);

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100); // slight delay for layout
      }
    }
  }, []);

  return null;
}