import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth/AuthContext.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        ` px-3 py-2 text-sm font-medium ${
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col text-slate-900 w-full">
      <div className="hidden md:flex mx-auto  w-full bg-white shadow ">
        <div className="flex items-center justify-between  w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="min-w-0">
              <Link to={"/"} className="truncate text-sm font-semibold">
                ASSIGNMENT
              </Link>
            </div>
          </div>
          <nav className="flex items-center justify-center gap-2">
            <NavItem to="/upload">Upload</NavItem>
            <NavItem to="/search">Search</NavItem>
            <NavItem to="/admin/users">Admin Users</NavItem>
            <button
              type="button"
              onClick={onLogout}
              className=" bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
      <div className="flex md:hidden mx-auto  w-full bg-white shadow ">
        <div className="flex flex-col items-center justify-between  w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="min-w-0">
              <Link to={"/"} className="truncate text-sm font-semibold">
                ASSIGNMENT
              </Link>
            </div>
          </div>
          <nav className="flex items-center justify-center gap-2 pb-4">
            <NavItem to="/upload">Upload</NavItem>
            <NavItem to="/search">Search</NavItem>
            <NavItem to="/admin/users">Admin Users</NavItem>
            <button
              type="button"
              onClick={onLogout}
              className=" bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
      <main className="flex-1 px-5 md:max-w-7xl mx-auto pt-4">
        <Outlet />
      </main>
    </div>
  );
}
