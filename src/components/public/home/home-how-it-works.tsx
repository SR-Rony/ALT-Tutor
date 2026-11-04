const STEPS = [
  {
    step: "1",
    title: "Create Account",
    description:
      "Sign up in seconds for free. Set your class, board, and target subjects to get a personalized study path.",
  },
  {
    step: "2",
    title: "Choose & Practice",
    description:
      "Pick your topic from thousands of questions. Take custom practice exams and watch video solutions.",
  },
  {
    step: "3",
    title: "Ace Your Exams",
    description:
      "Review instant mark schemes, master challenging concepts, and walk into your exam hall with full confidence.",
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section className="w-full border-t border-slate-200 bg-[#F8FAFC] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How Alt Tutor Works
          </h2>
          <p className="mt-2 text-base text-slate-500 sm:text-lg mb-12">
            Start your journey to better grades in three simple steps.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-200 hover:border-[#1D4ED8] hover:shadow-md"
            >
              {/* Large number in circle */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-2xl font-bold text-[#1D4ED8] transition-colors group-hover:bg-[#1D4ED8] group-hover:text-white">
                {item.step}
              </div>

              {/* Step Title */}
              <h3 className="mt-5 text-xl font-semibold text-slate-900 transition-colors group-hover:text-[#1D4ED8]">
                {item.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

