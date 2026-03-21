import { Upload, Target, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { NavBar } from "../components/nav-bar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find every university program you can get into
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Upload your marks, pick a career. We show you every matching program
              worldwide — and what to improve to unlock more.
            </p>
            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg"
            >
              Get started — free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
              <span className="font-medium">2,400+ programs</span>
              <span>·</span>
              <span className="font-medium">35 countries</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1632834380561-d1e05839a33a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwc3R1ZGVudHN8ZW58MXx8fHwxNzczOTM0OTc1fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="University campus with students"
              className="rounded-2xl shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload transcript</h3>
              <p className="text-gray-600">
                Drag and drop your transcript or enter grades manually. We support
                all grading systems.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mb-6">
                <Target className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">See matches</h3>
              <p className="text-gray-600">
                Get instant matches with programs you qualify for across 35
                countries worldwide.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-6">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Close gaps</h3>
              <p className="text-gray-600">
                See exactly what to improve to unlock more programs. Get a
                personalized study plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-gradient-to-br from-[#9B1B30] to-[#7A1420] rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to find your perfect program?
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-white/80">
            Join thousands of students who found their dream university
          </p>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
          >
            Start now — it's free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
