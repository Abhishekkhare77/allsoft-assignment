import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import Protected from "../routes/Protected.jsx";
import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Upload from "../pages/Upload.jsx";
import Search from "../pages/Search.jsx";
import AdminUsers from "../pages/AdminUsers.jsx";
import NotFound from "../pages/NotFound.jsx";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <Protected>
        <AppLayout />
      </Protected>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "upload", element: <Upload /> },
      { path: "search", element: <Search /> },
      { path: "admin/users", element: <AdminUsers /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

