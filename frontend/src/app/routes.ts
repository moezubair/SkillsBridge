import { createBrowserRouter } from "react-router";
import { Landing } from "./screens/landing";
import { UserTypeSelection } from "./screens/user-type-selection";
import { SchoolWizard } from "./screens/school-wizard";
import { JobSeekerWizard } from "./screens/job-seeker-wizard";
import { Processing } from "./screens/processing";
import { ResultsDashboard } from "./screens/results-dashboard";
import { ProgramDetail } from "./screens/program-detail";
import { StudyPlan } from "./screens/study-plan";
import { PdfUploadScreen } from "./screens/pdf-upload";
import { SchoolPdfUploadScreen } from "./screens/school-pdf-upload";
import { JobMatchScreen } from "./screens/job-match";
import { HarvardMatchScreen } from "./screens/harvard-match";
import { Profile } from "./screens/profile";
import { Portfolio } from "./screens/portfolio";
import { Settings } from "./screens/settings";
import { NotFound } from "./screens/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/choose",
    Component: UserTypeSelection,
  },
  {
    path: "/school-wizard",
    Component: SchoolWizard,
  },
  {
    path: "/job-seeker",
    Component: JobSeekerWizard,
  },
  {
    path: "/processing",
    Component: Processing,
  },
  {
    path: "/results",
    Component: ResultsDashboard,
  },
  {
    path: "/program/:id",
    Component: ProgramDetail,
  },
  {
    path: "/study-plan",
    Component: StudyPlan,
  },
  {
    path: "/upload",
    Component: PdfUploadScreen,
  },
  {
    path: "/upload/school",
    Component: SchoolPdfUploadScreen,
  },
  {
    path: "/jobs",
    Component: JobMatchScreen,
  },
  {
    path: "/harvard",
    Component: HarvardMatchScreen,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/portfolio",
    Component: Portfolio,
  },
  {
    path: "/settings",
    Component: Settings,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
