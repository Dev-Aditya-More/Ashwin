export type BlogSection = { heading: string; body: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  /** Service page this article leads to. */
  service: { slug: string; label: string };
  intro: string;
  sections: BlogSection[];
};

export const posts: BlogPost[] = [
  {
    slug: "what-decides-interior-design-cost-sambhajinagar",
    title: "What Decides the Cost of Home Interior Design in Sambhajinagar",
    description:
      "The real factors behind interior design cost for a flat or house in Chhatrapati Sambhajinagar (Aurangabad): size, materials, carpentry, finish and timeline.",
    date: "2026-11-26",
    service: { slug: "interior-design", label: "Interior Design" },
    intro:
      "Two flats of the same size can cost very different amounts to furnish. Knowing what drives the price helps you set a sensible budget before you speak to any designer.",
    sections: [
      {
        heading: "Carpentry is usually the biggest part",
        body: [
          "Wardrobes, the TV unit, the kitchen, beds and the pooja unit are built to measure, and the running feet of carpentry usually decide most of the total. A plain wardrobe and a full-height one with a loft, internal drawers and a profile shutter are priced very differently.",
          "Ask for the carpentry to be listed room by room, with the size of each unit. This is the easiest way to compare two quotations fairly.",
        ],
      },
      {
        heading: "Material and finish",
        body: [
          "The board you choose (plywood grade, its moisture resistance) and the surface on it (laminate, acrylic, veneer, paint) change the price more than the layout does. Hardware such as channels, hinges and handles also matters, because it decides how the furniture feels after five years of daily use.",
        ],
      },
      {
        heading: "Ceiling, lighting, painting and flooring",
        body: [
          "False ceilings, cove lighting, textured walls and new flooring are separate items. They are easy to add during the project and expensive to add afterwards, so decide early which of them you want.",
        ],
      },
      {
        heading: "Design and execution under one team",
        body: [
          "When the designer and the site team are the same people, there are fewer gaps between drawing and finish, and fewer surprise charges. A written scope, a measured quotation and a clear payment schedule are the three things to ask for before you start.",
        ],
      },
    ],
  },
  {
    slug: "how-to-plan-a-home-interior-step-by-step",
    title: "How to Plan a Home Interior, Step by Step",
    description:
      "A simple order of work for planning a flat or house interior: layout, budget, materials, design approval, site work and handover.",
    date: "2026-11-27",
    service: { slug: "space-planning", label: "Space Planning" },
    intro:
      "Most interior problems come from doing things in the wrong order. This is the order we follow, and it works for a small flat as well as a full house.",
    sections: [
      {
        heading: "1. Start with how you live",
        body: [
          "List who lives in the home, what each room is used for, and what annoys you today. This shapes the layout far more than any style board.",
        ],
      },
      {
        heading: "2. Fix the layout and the budget together",
        body: [
          "Decide the furniture positions, storage needs and any wall changes first. Then agree a budget range with a margin for the things that always get added. Doing the layout first avoids paying twice for work that is later changed.",
        ],
      },
      {
        heading: "3. Choose materials and see them in a drawing",
        body: [
          "Pick the finishes, colours and lighting, and look at 2D or 3D drawings before work starts. Changing a decision on a drawing costs nothing; changing it on site costs time and money.",
        ],
      },
      {
        heading: "4. Site work in a fixed sequence",
        body: [
          "Civil and electrical work first, then false ceiling, carpentry, painting, and finally lights, hardware and cleaning. Keeping this order protects finished surfaces from damage.",
        ],
      },
      {
        heading: "5. Handover with a walk-through",
        body: [
          "Walk through every room with the list of what was agreed. Note small snags and have them fixed before the final payment.",
        ],
      },
    ],
  },
  {
    slug: "choosing-materials-for-wardrobes-and-kitchens",
    title: "Choosing Materials for Wardrobes and Modular Kitchens",
    description:
      "Plywood, laminate, acrylic and hardware: how to choose materials for wardrobes and kitchens that last in Indian homes.",
    date: "2026-11-28",
    service: { slug: "interior-design", label: "Interior Design" },
    intro:
      "Kitchens and wardrobes are used every day, so material choice matters more here than anywhere else in the home.",
    sections: [
      {
        heading: "The inside matters as much as the outside",
        body: [
          "The visible shutter finish gets all the attention, but the board underneath decides how long the unit lasts. In a kitchen, use moisture-resistant board for the base units, where water and steam are most common.",
        ],
      },
      {
        heading: "Laminate, acrylic or veneer",
        body: [
          "Laminate is practical and easy to maintain. Acrylic gives a glossy, seamless look but shows marks more easily. Veneer feels natural but needs more care. Choose based on how the room will actually be used, not only on how it looks in a sample.",
        ],
      },
      {
        heading: "Do not save on hardware",
        body: [
          "Hinges, channels and soft-close fittings are small items that you touch every day. Good hardware keeps doors aligned and drawers smooth for years, and it is a small share of the total cost.",
        ],
      },
      {
        heading: "Plan storage before you pick the finish",
        body: [
          "Decide what goes where (heavy vessels low, daily items at arm height, seasonal items up high) before selecting colours. A well-planned plain unit beats a beautiful one that does not fit your things.",
        ],
      },
    ],
  },
  {
    slug: "questions-to-ask-before-hiring-an-interior-designer",
    title: "Questions to Ask Before Hiring an Interior Designer",
    description:
      "Practical questions to ask an interior designer in Sambhajinagar (Aurangabad) before you sign: scope, quotation, timeline, payments and warranty.",
    date: "2026-11-29",
    service: { slug: "site-execution", label: "Site Execution" },
    intro:
      "A good first meeting tells you a lot. These questions help you compare designers on things that matter once work starts.",
    sections: [
      {
        heading: "About the work",
        body: [
          "Can I see finished homes of a similar size and budget? Who will be on site every day? Is the design team the same as the execution team?",
        ],
      },
      {
        heading: "About the quotation",
        body: [
          "Is the quotation measured and itemised, with sizes and materials named? What is not included? How are extra items priced if I add something later?",
        ],
      },
      {
        heading: "About time and payments",
        body: [
          "What is the start date and the finish date in writing? How are payments linked to the progress of work? What happens if the schedule slips?",
        ],
      },
      {
        heading: "About after handover",
        body: [
          "Is there a written warranty on carpentry and fittings? Who do I call if a drawer or hinge needs adjusting after six months?",
        ],
      },
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
