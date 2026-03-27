export default function Projects() {
  const projects = [
    {
      title: "2BHK Glass Installation",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    },
    {
      title: "Office Partition Work",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c",
    },
    {
      title: "Sliding Door Setup",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    },
    {
      title: "Modern Facade Design",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
    },
    {
      title: "Balcony Glass Work",
      image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae",
    },
    {
      title: "Office Cabin Build",
      image: "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
    },
  ];

  return (
    <section id="projects" className="w-full py-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Heading */}
        <div className="mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-[#111111]">
            Projects
          </h2>
          <p className="text-[#555555] text-sm mt-2">
            Selected recent work
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div
              key={index}
              className="group cursor-pointer transition-all duration-300"
            >
              {/* Image */}
              <div className="overflow-hidden border border-[#E5E5E5]">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-[200px] md:h-[260px] object-cover transition duration-300 group-hover:scale-105"
                />
              </div>

              {/* Title */}
              <h3 className="mt-3 text-sm text-[#111111]">
                {project.title}
              </h3>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}