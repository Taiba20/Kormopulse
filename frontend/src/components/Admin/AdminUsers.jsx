import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listUsers({ search, role, status, page, limit: 15 });
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, status, page]);

  const suspend = async (user) => {
    const suspended = !user.isSuspended;
    const reason = suspended ? window.prompt("Reason for suspension (shown to nobody but you):") : undefined;
    if (suspended && reason === null) return;
    try {
      await adminService.suspendUser(user._id, suspended, reason);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Permanently delete ${user.email} and all their data? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(user._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Users</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name or email..."
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background w-64"
        />
        <select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} className="border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
          <option value="">All roles</option>
          <option value="jobSeeker">Job seekers</option>
          <option value="employer">Employers</option>
          <option value="admin">Admins</option>
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="unverified">Unverified email</option>
        </select>
      </div>

      <div className="bg-background border border-neutral-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-neutral-200">
              <th className="py-2.5 px-4">Name</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Role</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Joined</th>
              <th className="py-2.5 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-secondary">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2.5 px-4 text-text-primary font-medium">{u.name}</td>
                  <td className="py-2.5 px-4 text-text-secondary">{u.email}</td>
                  <td className="py-2.5 px-4 text-text-secondary capitalize">{u.role}</td>
                  <td className="py-2.5 px-4">
                    {u.isSuspended ? (
                      <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">Suspended</span>
                    ) : u.emailVerified === false ? (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">Unverified</span>
                    ) : (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5 px-4">
                    {u.role !== "admin" && (
                      <div className="flex gap-2">
                        <button onClick={() => suspend(u)} className="text-xs text-primary hover:underline">
                          {u.isSuspended ? "Reinstate" : "Suspend"}
                        </button>
                        <button onClick={() => remove(u)} className="text-xs text-error hover:underline">
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-neutral-300 rounded disabled:opacity-50">
            Previous
          </button>
          <span className="text-text-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-neutral-300 rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
