import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./state/auth/AuthContext.jsx";
import { router } from "./routes/router.jsx";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
