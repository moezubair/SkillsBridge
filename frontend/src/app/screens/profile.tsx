import { useState } from "react";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Pencil,
  Check,
  X,
  Linkedin,
  Github,
} from "lucide-react";
import { NavBar } from "../components/nav-bar";

interface ProfileData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  about: string;
  education: { school: string; degree: string; year: string }[];
  experience: { company: string; role: string; period: string }[];
  skills: string[];
}

const initialProfile: ProfileData = {
  name: "Alex Nguyen",
  headline: "Computer Science Student · Aspiring Software Engineer",
  email: "alex.nguyen@email.com",
  phone: "+1 (555) 123-4567",
  location: "Toronto, Canada",
  website: "alexnguyen.dev",
  linkedin: "linkedin.com/in/alexnguyen",
  github: "github.com/alexnguyen",
  about:
    "Third-year Computer Science student with a passion for full-stack development and machine learning. Looking to pursue graduate studies in AI/ML abroad while gaining industry experience.",
  education: [
    {
      school: "University of Toronto",
      degree: "BSc Computer Science",
      year: "2022 – 2026",
    },
    {
      school: "Northview Heights SS",
      degree: "Ontario Secondary School Diploma",
      year: "2018 – 2022",
    },
  ],
  experience: [
    {
      company: "Shopify",
      role: "Software Engineering Intern",
      period: "May 2025 – Aug 2025",
    },
    {
      company: "UofT CS Department",
      role: "Teaching Assistant – CSC148",
      period: "Sep 2024 – Apr 2025",
    },
  ],
  skills: [
    "Python",
    "TypeScript",
    "React",
    "Node.js",
    "PostgreSQL",
    "Machine Learning",
    "Git",
    "Docker",
  ],
};

function CardHeader({
  title,
  section,
  editingSection,
  onEdit,
  onSave,
  onCancel,
}: {
  title: string;
  section: string;
  editingSection: string | null;
  onEdit: (s: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEditing = editingSection === section;
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
        {title}
      </h3>
      {isEditing ? (
        <div className="flex gap-1">
          <button
            onClick={onSave}
            className="p-1.5 rounded-md hover:bg-green-50 text-green-600 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onEdit(section)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function Profile() {
  const [profile] = useState<ProfileData>(initialProfile);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const onEdit = (section: string) => setEditingSection(section);
  const onSave = () => setEditingSection(null);
  const onCancel = () => setEditingSection(null);
  const cardProps = { editingSection, onEdit, onSave, onCancel };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="My Profile" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="relative inline-block">
                <div className="w-28 h-28 rounded-full bg-[#9B1B30] mx-auto flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <h2 className="mt-4 text-lg font-bold text-gray-900">
                {profile.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{profile.headline}</p>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader title="Contact" section="contact" {...cardProps} />
              <div className="space-y-3">
                {[
                  { icon: Mail, value: profile.email },
                  { icon: Phone, value: profile.phone },
                  { icon: MapPin, value: profile.location },
                  { icon: Globe, value: profile.website },
                ].map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-3 text-sm">
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                    {editingSection === "contact" ? (
                      <input
                        defaultValue={value}
                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm text-gray-700 focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent"
                      />
                    ) : (
                      <span className="text-gray-700 truncate">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader title="Social" section="social" {...cardProps} />
              <div className="space-y-3">
                {[
                  { icon: Linkedin, value: profile.linkedin },
                  { icon: Github, value: profile.github },
                ].map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-3 text-sm">
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                    {editingSection === "social" ? (
                      <input
                        defaultValue={value}
                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm text-gray-700 focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent"
                      />
                    ) : (
                      <span className="text-gray-700 truncate">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader title="Skills" section="skills" {...cardProps} />
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-[#9B1B30]/10 text-[#9B1B30] text-xs font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* About */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader title="About" section="about" {...cardProps} />
              {editingSection === "about" ? (
                <textarea
                  defaultValue={profile.about}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent text-sm text-gray-700 resize-none"
                />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {profile.about}
                </p>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader title="Education" section="education" {...cardProps} />
              <div className="space-y-5">
                {profile.education.map((edu, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#9B1B30]/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-[#9B1B30]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {edu.school}
                      </p>
                      <p className="text-sm text-gray-600">{edu.degree}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{edu.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <CardHeader title="Experience" section="experience" {...cardProps} />
              <div className="space-y-5">
                {profile.experience.map((exp, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#D4A84C]/15 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-[#D4A84C]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {exp.role}
                      </p>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{exp.period}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
