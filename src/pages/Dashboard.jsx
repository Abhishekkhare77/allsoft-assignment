import { Link } from "react-router-dom";

function Card({ to, title, description }) {
  return (
    <Link
      to={to}
      className="group border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
    >
      <div className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">
        {title}
      </div>
      <div className="mt-1 text-sm text-slate-600">{description}</div>
      <div className="mt-4 text-xs font-semibold text-slate-700">Open</div>
    </Link>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold text-slate-900">Dashboard</div>
        <div className="mt-1 text-sm text-slate-600">
          Upload, search, preview, and download documents.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          to="/upload"
          title="Upload"
          description="Add PDF/images with category, owner, date, tags, and remarks."
        />
        <Card
          to="/search"
          title="Search"
          description="Filter documents by category, tags, and date range."
        />
        <Card
          to="/admin/users"
          title="Admin Users"
          description="Static user creation interface (local only)."
        />
      </div>
    </div>
  );
}
