// Single source of truth for the business's name, address and phone (NAP).
// Google cross-checks these against the Google Business Profile, so keep them
// identical to what's listed there.

export const SITE_URL = "https://ashwin.world";

export const BUSINESS = {
  name: "Ashwin",
  alternateNames: ["Ashwin Interiors", "Ashwin Enterprises", "Ashwin Glass"],
  phone: "+919822990577",
  email: "vikas@ashwin.world",
  foundingYear: "2016",
  address: {
    streetAddress:
      "10, Ghole Complex, Near Mhaske Petrol Pump, Beed Bypass Road",
    addressLocality: "Chhatrapati Sambhajinagar",
    addressRegion: "Maharashtra",
    postalCode: "431010",
    addressCountry: "IN",
  },
  // Approximate — replace with the exact pin from the Google Business Profile.
  geo: { latitude: 19.8762, longitude: 75.3433 },
  sameAs: [
    "https://instagram.com/ashwin_design",
    "https://www.facebook.com/share/1BFHGWXmxF/",
  ],
};

// Landscape project photo used for link previews (WhatsApp, Facebook, etc.)
export const OG_IMAGE = {
  url: "/project/3.jpeg",
  width: 1280,
  height: 960,
  alt: "Living room interior designed by Ashwin, Chhatrapati Sambhajinagar",
};

export const BUSINESS_ID = `${SITE_URL}/#business`;

// People still search "Aurangabad" far more than the new city name.
export const AREA_SERVED = [
  {
    "@type": "City",
    name: "Chhatrapati Sambhajinagar",
    alternateName: "Aurangabad",
  },
  { "@type": "State", name: "Maharashtra" },
];

export const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": BUSINESS_ID,
  name: BUSINESS.name,
  alternateName: BUSINESS.alternateNames,
  url: SITE_URL,
  logo: `${SITE_URL}/ashwinLogo.png`,
  image: [`${SITE_URL}${OG_IMAGE.url}`, `${SITE_URL}/project/6.jpeg`],
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  foundingDate: BUSINESS.foundingYear,
  priceRange: "₹₹₹",
  description:
    "Interior design, architectural design, civil planning, glass work and site execution in Chhatrapati Sambhajinagar (Aurangabad), Maharashtra. Established 2016.",
  address: { "@type": "PostalAddress", ...BUSINESS.address },
  geo: { "@type": "GeoCoordinates", ...BUSINESS.geo },
  areaServed: AREA_SERVED,
  knowsAbout: [
    "Interior design",
    "Architectural design",
    "Civil planning",
    "Landscape design",
    "Space planning",
    "Glass work",
    "Site execution",
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  sameAs: BUSINESS.sameAs,
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: BUSINESS.name,
  alternateName: [...BUSINESS.alternateNames, "ashwin.world"],
  url: SITE_URL,
  publisher: { "@id": BUSINESS_ID },
};
