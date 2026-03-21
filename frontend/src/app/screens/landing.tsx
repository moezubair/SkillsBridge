import { useEffect, useState } from "react";
import { ArrowRight, Linkedin, Trophy, Briefcase, Award, Star, GraduationCap } from "lucide-react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { NavBar } from "../components/nav-bar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const heroSlides = [
  {
    tagline: "2,400+ programs, across 50+ countries",
    headline: "Find every program you can get into",
    description:
      "Upload your marks, pick a career direction. We show you every matching program worldwide — and what to improve to unlock more.",
    cta: "Get started for free",
    image:
      "https://images.unsplash.com/photo-1632834380561-d1e05839a33a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwc3R1ZGVudHN8ZW58MXx8fHwxNzczOTM0OTc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    imageAlt: "University campus with students",
  },
  {
    tagline: "10,000+ jobs, from top companies worldwide",
    headline: "Land any job you want",
    description:
      "Upload your resume, tell us your dream role. We match you to jobs you're qualified for — and show you exactly how to get the ones you're not.",
    cta: "Get started for free",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGVhbSUyMG9mZmljZSUyMHdvcmt8ZW58MHx8fHwxNzE2NTAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    imageAlt: "Professionals collaborating in modern office",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload your profile",
    description:
      "Drop your transcript or resume. We parse grades, skills, and experience from any format.",
  },
  {
    number: "02",
    title: "See your matches",
    description:
      "Instantly discover programs you qualify for or jobs that fit your skillset — across 35 countries.",
  },
  {
    number: "03",
    title: "Close the gaps",
    description:
      "See exactly what skills or grades to improve, with a personalized plan to unlock more opportunities.",
  },
];

const dataSources = [
  { name: "LinkedIn", subtitle: "Job postings", Icon: Linkedin },
  { name: "QS Rankings", subtitle: "University rankings", Icon: Trophy },
  { name: "Indeed", subtitle: "Job postings", Icon: Briefcase },
  { name: "Times Higher Education", subtitle: "University rankings", Icon: Award },
  { name: "Glassdoor", subtitle: "Reviews & salaries", Icon: Star },
  { name: "Google Scholar", subtitle: "Academic research", Icon: GraduationCap },
];

export function Landing() {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[slideIndex];

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <p className="text-primary font-semibold tracking-wide text-sm uppercase mb-4">
                  {slide.tagline}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                  {slide.headline}
                </h1>
                <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-lg">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>
            <Link
              to="/choose"
              className="group inline-flex items-center gap-3 bg-[#9B1B30] text-white pl-8 pr-6 py-4 rounded-full font-semibold hover:bg-[#7A1420] transition-all text-base"
            >
              {slide.cta}
              <span className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            {/* Slide indicators */}
            <div className="flex gap-2 mt-8">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    i === slideIndex
                      ? "w-8 bg-[#9B1B30]"
                      : "w-4 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <ImageWithFallback
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="rounded-2xl shadow-2xl w-full"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Powered by data from */}
      <section className="border-t border-gray-100 bg-gray-50/60 py-12 sm:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center text-sm font-medium uppercase tracking-wider text-gray-400 mb-8"
          >
            Powered by data from
          </motion.p>

          <div className="flex flex-wrap justify-between items-center gap-y-6">
            {dataSources.map((source, i) => (
              <motion.div
                key={source.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="group flex items-center gap-2.5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default"
              >
                <source.Icon className="w-5 h-5 text-gray-500 group-hover:text-[#9B1B30] transition-colors duration-300" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300 leading-tight">
                    {source.name}
                  </span>
                  <span className="text-[11px] text-gray-400 group-hover:text-gray-500 transition-colors duration-300 leading-tight">
                    {source.subtitle}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#9B1B30] py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Continuous pipeline line */}
            <div className="hidden md:block absolute right-4 top-[3.5rem] bottom-[3.5rem] w-px bg-white/30" />

            {steps.map((step) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.7,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="relative grid md:grid-cols-[80px_1fr] gap-4 md:gap-8 items-baseline py-12 sm:py-16"
              >
                <span className="text-6xl sm:text-7xl font-black text-white select-none leading-none">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-white/70 text-lg leading-relaxed max-w-md">
                    {step.description}
                  </p>
                </div>

                {/* Pipeline dot */}
                <div className="hidden md:block absolute right-[0.6875rem] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-white shadow-[0_0_0_4px_rgba(255,255,255,0.15)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Ready to find your path?
          </h2>
          <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto">
            It takes two minutes. Upload your transcript and see what's
            possible.
          </p>
          <Link
            to="/choose"
            className="group inline-flex items-center gap-3 bg-[#9B1B30] text-white pl-8 pr-6 py-4 rounded-full font-semibold hover:bg-[#7A1420] transition-all text-base"
          >
            Start now — it's free
            <span className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
