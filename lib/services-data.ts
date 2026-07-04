export type Service = {
  slug: string;
  title: string;
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
    shortDescription:
      "End-to-end interior solutions focused on comfort, material harmony, and refined visual appeal.",
    metaDescription:
      "Interior design services by Ashwin Interiors — residential and commercial interiors planned end-to-end, from concept to execution, for clients across India.",
    keywords: [
      "interior design services India",
      "residential interior designer",
      "commercial interior design",
      "home interior design",
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
    shortDescription:
      "Creative architectural solutions that blend form and function, creating visually striking and livable spaces.",
    metaDescription:
      "Architectural design services by Ashwin Interiors — residential and commercial building design that balances structure, function, and aesthetics, for clients across India.",
    keywords: [
      "architectural design services India",
      "architect for home design",
      "commercial building design",
      "residential architecture",
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
    shortDescription:
      "Thoughtful planning and design that balances structure, aesthetics, and functionality for modern living spaces.",
    metaDescription:
      "Civil planning services by Ashwin Interiors — structural and layout planning for residential and commercial construction projects across India.",
    keywords: [
      "civil planning services",
      "civil engineering design India",
      "construction planning",
      "site layout planning",
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
    shortDescription:
      "Creating harmonious outdoor spaces that blend nature, functionality, and aesthetics for a serene living experience.",
    metaDescription:
      "Landscape design services by Ashwin Interiors — outdoor and garden spaces planned for residential and commercial properties across India.",
    keywords: [
      "landscape design services",
      "garden design India",
      "outdoor space design",
      "landscaping for homes",
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
    shortDescription:
      "Efficient layouts that maximize usability while maintaining openness, flow, and elegance.",
    metaDescription:
      "Space planning services by Ashwin Interiors — efficient, well-flowing layouts for homes and commercial spaces of any size, for clients across India.",
    keywords: [
      "space planning services",
      "home layout design",
      "office space planning",
      "furniture layout design",
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
    shortDescription:
      "Careful on-site coordination to ensure quality, timelines, and design accuracy are maintained.",
    metaDescription:
      "Site execution and supervision services by Ashwin Interiors — on-ground project management ensuring design plans are built accurately, on time, and to quality.",
    keywords: [
      "site execution services",
      "construction supervision",
      "interior fit-out execution",
      "project management interior design",
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
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
