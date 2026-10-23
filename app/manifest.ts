import type { MetadataRoute } from "next";

// Makes the admin portal installable (Windows / Android / iOS "Add to Home Screen") like the
// original ASHWIN PWA. Data stays in the cloud, so every installed device sees the same records.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ASHWIN Enterprises — Business Control Center",
    short_name: "ASHWIN",
    description: "ASHWIN business management dashboard and ledgers",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#f4f5fa",
    theme_color: "#171b4b",
    icons: [
      { src: "/ashwin-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/ashwin-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
