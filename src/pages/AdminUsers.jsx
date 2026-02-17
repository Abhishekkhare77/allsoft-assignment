import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

function loadUsers() {
  try {
    const raw = localStorage.getItem("admin_users");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem("admin_users", JSON.stringify(users));
}

export default function AdminUsers() {
  const [users, setUsers] = useState(loadUsers);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  const onCreate = (values) => {
    const username = values.username.trim();
    const next = [
      ...users,
      {
        id: crypto.randomUUID(),
        username,
        createdAt: new Date().toISOString(),
      },
    ];
    setUsers(next);
    reset({ username: "", password: "" });
  };

  const onDelete = (id) => setUsers(users.filter((u) => u.id !== id));

  const sorted = useMemo(
    () =>
      [...users].sort((a, b) =>
        String(b.createdAt).localeCompare(String(a.createdAt)),
      ),
    [users],
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold text-slate-900">
          Admin: Create Users
        </div>
      </div>

      <div className=" border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSubmit(onCreate)}
          className="grid gap-4 md:grid-cols-3"
        >
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-800">
              Username
            </label>
            <input
              className="w-full  border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              {...register("username")}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-800">
              Password
            </label>
            <input
              type="password"
              className="w-full  border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              {...register("password")}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full  bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create User
            </button>
          </div>
        </form>
      </div>

      <div className=" border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">
            Created Users
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {sorted.length ? (
            sorted.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {u.username}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(u.id)}
                  className=" border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-slate-600">
              No users created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
