import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-2xl font-semibold text-slate-900">Page not found</div>
          <div className="mt-2 text-sm text-slate-600">The page you are looking for does not exist.</div>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

