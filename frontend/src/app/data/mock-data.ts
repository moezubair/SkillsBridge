export interface Program {
  id: string;
  universityName: string;
  programName: string;
  country: string;
  countryFlag: string;
  degree: "bachelor" | "master" | "phd";
  qsRank?: number;
  tuition: string;
  matchPercentage: number;
  status: "eligible" | "almost";
  gap?: string;
  duration: string;
  language: string;
  deadline: string;
  requirements: {
    gpa: { required: string; yours: string; met: boolean };
    english: { required: string; yours: string; met: boolean };
    prerequisites: { required: string; yours: string; met: boolean };
    degree: { required: string; yours: string; met: boolean };
  };
  courses: string[];
  about: string;
}

export const eligiblePrograms: Program[] = [
  {
    id: "1",
    universityName: "Technical University of Munich",
    programName: "Computer Science",
    country: "Germany",
    countryFlag: "🇩🇪",
    degree: "master",
    qsRank: 37,
    tuition: "€0/year",
    matchPercentage: 95,
    status: "eligible",
    duration: "2 years",
    language: "English",
    deadline: "2026-07-15",
    requirements: {
      gpa: { required: "3.0/4.0", yours: "3.5/4.0", met: true },
      english: { required: "IELTS 6.5", yours: "IELTS 7.0", met: true },
      prerequisites: { required: "CS or related", yours: "CS", met: true },
      degree: { required: "Bachelor's", yours: "Bachelor's", met: true },
    },
    courses: ["Advanced Algorithms", "Machine Learning", "Distributed Systems", "Computer Vision"],
    about: "TUM is one of Europe's leading research universities with a strong focus on engineering and technology.",
  },
  {
    id: "2",
    universityName: "University of Amsterdam",
    programName: "Artificial Intelligence",
    country: "Netherlands",
    countryFlag: "🇳🇱",
    degree: "master",
    qsRank: 53,
    tuition: "€2,168/year",
    matchPercentage: 92,
    status: "eligible",
    duration: "2 years",
    language: "English",
    deadline: "2026-05-01",
    requirements: {
      gpa: { required: "3.0/4.0", yours: "3.5/4.0", met: true },
      english: { required: "IELTS 6.5", yours: "IELTS 7.0", met: true },
      prerequisites: { required: "CS, Math, or related", yours: "CS", met: true },
      degree: { required: "Bachelor's", yours: "Bachelor's", met: true },
    },
    courses: ["Deep Learning", "Natural Language Processing", "Robotics", "AI Ethics"],
    about: "UvA offers a comprehensive AI program combining theory with practical applications.",
  },
  {
    id: "3",
    universityName: "KTH Royal Institute of Technology",
    programName: "Machine Learning",
    country: "Sweden",
    countryFlag: "🇸🇪",
    degree: "master",
    qsRank: 73,
    tuition: "€0/year",
    matchPercentage: 90,
    status: "eligible",
    duration: "2 years",
    language: "English",
    deadline: "2026-01-15",
    requirements: {
      gpa: { required: "3.0/4.0", yours: "3.5/4.0", met: true },
      english: { required: "IELTS 6.5", yours: "IELTS 7.0", met: true },
      prerequisites: { required: "CS, Math, or Engineering", yours: "CS", met: true },
      degree: { required: "Bachelor's", yours: "Bachelor's", met: true },
    },
    courses: ["Statistical Learning", "Neural Networks", "Computer Vision", "Reinforcement Learning"],
    about: "KTH is Sweden's largest technical university known for world-class engineering education.",
  },
];

export const almostTherePrograms: Program[] = [
  {
    id: "4",
    universityName: "ETH Zurich",
    programName: "Computer Science",
    country: "Switzerland",
    countryFlag: "🇨🇭",
    degree: "master",
    qsRank: 7,
    tuition: "CHF 1,460/year",
    matchPercentage: 85,
    status: "almost",
    gap: "IELTS +0.5 needed",
    duration: "2 years",
    language: "English",
    deadline: "2026-04-30",
    requirements: {
      gpa: { required: "3.3/4.0", yours: "3.5/4.0", met: true },
      english: { required: "IELTS 7.5", yours: "IELTS 7.0", met: false },
      prerequisites: { required: "CS or related", yours: "CS", met: true },
      degree: { required: "Bachelor's", yours: "Bachelor's", met: true },
    },
    courses: ["Advanced Algorithms", "Machine Learning", "Computer Systems", "Theory of Computation"],
    about: "ETH Zurich is one of the world's leading universities in science and technology.",
  },
  {
    id: "5",
    universityName: "Imperial College London",
    programName: "Computing (AI)",
    country: "United Kingdom",
    countryFlag: "🇬🇧",
    degree: "master",
    qsRank: 6,
    tuition: "£36,000/year",
    matchPercentage: 82,
    status: "almost",
    gap: "Missing: Linear Algebra course",
    duration: "1 year",
    language: "English",
    deadline: "2026-03-31",
    requirements: {
      gpa: { required: "3.3/4.0", yours: "3.5/4.0", met: true },
      english: { required: "IELTS 7.0", yours: "IELTS 7.0", met: true },
      prerequisites: { required: "CS + Linear Algebra", yours: "CS only", met: false },
      degree: { required: "Bachelor's", yours: "Bachelor's", met: true },
    },
    courses: ["Machine Learning", "Deep Learning", "Computer Vision", "NLP"],
    about: "Imperial College London is a world-class university with a focus on science, engineering, medicine and business.",
  },
  {
    id: "6",
    universityName: "EPFL",
    programName: "Data Science",
    country: "Switzerland",
    countryFlag: "🇨🇭",
    degree: "master",
    qsRank: 16,
    tuition: "CHF 1,266/year",
    matchPercentage: 88,
    status: "almost",
    gap: "GRE required (not submitted)",
    duration: "2 years",
    language: "English",
    deadline: "2026-04-15",
    requirements: {
      gpa: { required: "3.2/4.0", yours: "3.5/4.0", met: true },
      english: { required: "IELTS 7.0", yours: "IELTS 7.0", met: true },
      prerequisites: { required: "CS/Math + GRE", yours: "CS (no GRE)", met: false },
      degree: { required: "Bachelor's", yours: "Bachelor's", met: true },
    },
    courses: ["Statistical Learning", "Data Mining", "Optimization", "Big Data"],
    about: "EPFL is a research institute and university in Lausanne, Switzerland, that specializes in natural sciences and engineering.",
  },
];

export const allPrograms = [...eligiblePrograms, ...almostTherePrograms];

export const studyPlanGaps = [
  {
    priority: 1,
    title: "Improve IELTS to 7.5",
    current: "7.0",
    target: "7.5",
    impactCount: 15,
    timeEstimate: "2-3 months",
    resources: [
      { label: "IELTS Prep Course", url: "#" },
      { label: "Practice Tests", url: "#" },
    ],
    programs: [
      "ETH Zurich - Computer Science",
      "University of Cambridge - Computer Science",
      "UCL - Machine Learning",
    ],
  },
  {
    priority: 2,
    title: "Complete Linear Algebra Course",
    current: "Not taken",
    target: "Course completed",
    impactCount: 12,
    timeEstimate: "3-4 months",
    resources: [
      { label: "MIT OpenCourseWare", url: "#" },
      { label: "Coursera Linear Algebra", url: "#" },
    ],
    programs: [
      "Imperial College London - Computing (AI)",
      "Stanford - Computer Science",
      "MIT - EECS",
    ],
  },
  {
    priority: 3,
    title: "Take GRE Exam",
    current: "Not taken",
    target: "GRE 320+",
    impactCount: 8,
    timeEstimate: "2-3 months",
    resources: [
      { label: "GRE Official Guide", url: "#" },
      { label: "Magoosh GRE", url: "#" },
    ],
    programs: [
      "EPFL - Data Science",
      "Carnegie Mellon - ML",
      "Georgia Tech - CS",
    ],
  },
];
