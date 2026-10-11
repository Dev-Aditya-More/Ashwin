export type Service = {
  slug: string;
  title: string;
  /** Search-facing <title>, phrased the way local customers search. */
  seoTitle: string;
  shortDescription: string;
  metaDescription: string;
  keywords: string[];
  intro: string[];
  included: string[];
};

export const services: Service[] = [
  {
    slug: "interior-design",
    title: "Interior Design",
    seoTitle: "Interior Designer in Sambhajinagar (Aurangabad)",
    shortDescription:
      "End-to-end interior solutions focused on comfort, material harmony, and refined visual appeal.",
    metaDescription:
      "Interior designer in Chhatrapati Sambhajinagar (Aurangabad) — homes, flats, offices and shops designed and executed end-to-end by Ashwin since 2016. Call +91 98229 90577.",
    keywords: [
      "interior designer in Sambhajinagar",
      "interior designer in Aurangabad",
      "home interior design Aurangabad",
      "flat interior design Sambhajinagar",
      "office interior designer Aurangabad",
    ],
    intro: [
      "Our interior design service covers everything from initial layout and material selection to lighting, furniture, and finishing details. Whether it's a home, office, or retail space, the goal is a space that feels considered — functional first, and visually refined as a result.",
      "We work with residential and commercial clients across India, adapting the process to the scale and budget of each project while keeping the same attention to detail throughout.",
    ],
    included: [
      "Space planning and layout design",
      "Material, finish, and colour palette selection",
      "Furniture, lighting, and decor sourcing guidance",
      "2D/3D visualisation of proposed interiors",
      "Coordination with site execution for a consistent finish",
    ],
  },
  {
    slug: "architectural-design",
    title: "Architectural Design",
    seoTitle: "Architect in Sambhajinagar (Aurangabad)",
    shortDescription:
      "Creative architectural solutions that blend form and function, creating visually striking and livable spaces.",
    metaDescription:
      "Architect in Chhatrapati Sambhajinagar (Aurangabad) — bungalow, house and commercial building design, elevations and approval drawings by Ashwin. Call +91 98229 90577.",
    keywords: [
      "architect in Sambhajinagar",
      "architect in Aurangabad",
      "house design Aurangabad",
      "bungalow elevation design Sambhajinagar",
      "commercial building architect Aurangabad",
    ],
    intro: [
      "Architectural design is where a project's structure and its aesthetic intent come together. We work through massing, elevation, and layout to arrive at a building design that holds up structurally and reads well visually — for both new builds and renovations.",
      "This service is typically the starting point for larger projects, feeding directly into civil planning and, later, interior design and site execution.",
    ],
    included: [
      "Building layout and floor plan design",
      "Elevation and facade design",
      "Structural coordination with civil planning",
      "Design drawings for approvals and construction",
      "Renovation and extension planning",
    ],
  },
  {
    slug: "civil-planning",
    title: "Civil Planning",
    seoTitle: "Civil Planning & House Plans in Sambhajinagar (Aurangabad)",
    shortDescription:
      "Thoughtful planning and design that balances structure, aesthetics, and functionality for modern living spaces.",
    metaDescription:
      "Civil planning in Chhatrapati Sambhajinagar (Aurangabad) — house plans, site layout, structural coordination and approval drawings by Ashwin. Call +91 98229 90577.",
    keywords: [
      "civil planning Aurangabad",
      "house plan Sambhajinagar",
      "construction planning Aurangabad",
      "site layout planning Sambhajinagar",
    ],
    intro: [
      "Civil planning covers the structural and technical groundwork a project needs before construction begins — site layout, load planning, and coordination between architectural intent and what's actually buildable.",
      "We handle this alongside architectural design so that the visual plan for a space and its structural plan are worked out together, rather than in separate silos.",
    ],
    included: [
      "Site layout and load planning",
      "Structural coordination with architectural drawings",
      "Technical documentation for construction",
      "Compliance-aware planning for approvals",
      "On-ground feasibility checks before execution",
    ],
  },
  {
    slug: "landscape-design",
    title: "Landscape Design",
    seoTitle: "Landscape & Garden Design in Sambhajinagar (Aurangabad)",
    shortDescription:
      "Creating harmonious outdoor spaces that blend nature, functionality, and aesthetics for a serene living experience.",
    metaDescription:
      "Landscape and garden design in Chhatrapati Sambhajinagar (Aurangabad) — terraces, gardens, bungalow lawns and commercial outdoor spaces by Ashwin. Call +91 98229 90577.",
    keywords: [
      "landscape designer Aurangabad",
      "garden design Sambhajinagar",
      "terrace garden Aurangabad",
      "landscaping Sambhajinagar",
    ],
    intro: [
      "Outdoor spaces are planned with the same care as interiors — balancing greenery, hardscaping, seating, and lighting so the space is usable year-round, not just decorative.",
      "This works well as a standalone service for existing properties, or as part of a larger residential or commercial project from the ground up.",
    ],
    included: [
      "Garden and outdoor layout planning",
      "Softscape (planting) and hardscape design",
      "Outdoor lighting and seating layout",
      "Water features and pathway design",
      "Coordination with civil work for terraces and podiums",
    ],
  },
  {
    slug: "space-planning",
    title: "Space Planning",
    seoTitle: "Space Planning & Home Layout Design in Sambhajinagar (Aurangabad)",
    shortDescription:
      "Efficient layouts that maximize usability while maintaining openness, flow, and elegance.",
    metaDescription:
      "Space planning in Chhatrapati Sambhajinagar (Aurangabad) — furniture layouts and floor plans that make 1BHK–4BHK homes and offices work better. By Ashwin. Call +91 98229 90577.",
    keywords: [
      "space planning Aurangabad",
      "home layout design Sambhajinagar",
      "office space planning Aurangabad",
      "furniture layout Sambhajinagar",
    ],
    intro: [
      "Space planning is about making a floor plan work as hard as possible — getting circulation, furniture placement, and room proportions right before any material or design decisions are made.",
      "It's especially valuable for smaller homes and offices where every square foot needs to earn its place, but applies equally to larger residential and commercial layouts.",
    ],
    included: [
      "Furniture and layout planning",
      "Circulation and flow analysis",
      "Zoning for multi-use spaces",
      "Storage and utility planning",
      "Layout options compared before finalising",
    ],
  },
  {
    slug: "site-execution",
    title: "Site Execution & Supervision",
    seoTitle: "Interior & Construction Site Execution in Sambhajinagar (Aurangabad)",
    shortDescription:
      "Careful on-site coordination to ensure quality, timelines, and design accuracy are maintained.",
    metaDescription:
      "Site execution and supervision in Chhatrapati Sambhajinagar (Aurangabad) — Ashwin manages contractors, quality and timelines so your project is built as designed. Call +91 98229 90577.",
    keywords: [
      "interior contractor Aurangabad",
      "turnkey interior Sambhajinagar",
      "construction supervision Aurangabad",
      "site execution Sambhajinagar",
    ],
    intro: [
      "A design is only as good as its execution. This service covers on-site coordination between contractors, vendors, and the design team — checking work against the approved plan at each stage rather than only at the end.",
      "It's what turns drawings and material boards into a finished, livable space that actually matches what was agreed.",
    ],
    included: [
      "On-site quality checks against approved design",
      "Contractor and vendor coordination",
      "Timeline tracking and progress updates",
      "Snag identification and resolution before handover",
      "Final handover walkthrough",
    ],
  },
  {
    slug: "glass-work",
    title: "Glass Work",
    seoTitle: "Glass Work & Glass Partitions in Sambhajinagar (Aurangabad)",
    shortDescription:
      "Toughened glass partitions, doors, railings, mirrors and decorative glass — supplied, fitted and finished for homes and offices.",
    metaDescription:
      "Glass work in Chhatrapati Sambhajinagar (Aurangabad) — toughened glass partitions, glass doors, railings, mirrors and decorative glass for homes, offices and shops by Ashwin. Call +91 98229 90577.",
    keywords: [
      "glass work in Aurangabad",
      "glass partition Sambhajinagar",
      "toughened glass Aurangabad",
      "glass railing Sambhajinagar",
      "glass door installation Aurangabad",
    ],
    intro: [
      "Glass is one of the quickest ways to make a space feel larger and brighter — an office cabin that doesn't block light, a staircase railing that doesn't feel heavy, a shower area that's easy to keep clean. We handle glass work as part of our interior projects and as a standalone service for homes, offices and shops in Chhatrapati Sambhajinagar.",
      "Because the same team designs the interiors and does the glass work, measurements, fittings and finishes are planned together — so the glass fits the design instead of being added on at the end.",
    ],
    included: [
      "Toughened glass partitions for offices and cabins",
      "Glass doors and sliding systems",
      "Glass railings for staircases and balconies",
      "Mirrors, back-painted and decorative glass",
      "On-site measurement, fitting and finishing",
    ],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
