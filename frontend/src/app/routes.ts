import { createBrowserRouter } from "react-router";
import { Landing } from "./screens/landing";
import { ProfileWizard } from "./screens/profile-wizard";
import { Processing } from "./screens/processing";
import { ResultsDashboard } from "./screens/results-dashboard";
import { ProgramDetail } from "./screens/program-detail";
import { StudyPlan } from "./screens/study-plan";
import { PdfUploadScreen } from "./screens/pdf-upload";
import { JobMatchScreen } from "./screens/job-match";
import { HarvardMatchScreen } from "./screens/harvard-match";
import { NotFound } from "./screens/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/wizard",
    Component: ProfileWizard,
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
    path: "/jobs",
    Component: JobMatchScreen,
  },
  {
    path: "/harvard",
    Component: HarvardMatchScreen,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);