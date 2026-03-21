import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { CustomScrollbar } from "./components/custom-scrollbar";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
      <CustomScrollbar />
    </>
  );
}