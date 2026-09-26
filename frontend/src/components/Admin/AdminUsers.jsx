import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { useI18n } from "../../i18n/I18nContext";

function AdminUsers() {
  const { t, tError, formatDate, formatNumber } = useI18n();
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
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, status, page]);

  const suspend = async (user) => {
    const suspended = !user.isSuspended;
    const reason = suspended ? window.prompt(t("admin.users.reasonPrompt")) : undefined;
    if (suspended && reason === null) return;
    try {
      await adminService.suspendUser(user._id, suspended, reason);
      load();
    } catch (err) {
      alert(tError(err, "admin.actionFailed"));
    }
  };

  const remove = async (user) => {
    if (!window.confirm(t("admin.users.confirmDelete", { email: user.email }))) return;
    try {
      await adminService.deleteUser(user._id);
      load();
    } catch (err) {
      alert(tError(err, "admin.actionFailed"));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-4">{t("admin.users.title")}</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder={t("admin.users.search")}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background w-64"
        />
        <select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} className="border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
          <option value="">{t("admin.users.allRoles")}</option>
          <option value="jobSeeker">{t("admin.users.roleSeekers")}</option>
          <option value="employer">{t("admin.users.roleEmployers")}</option>
          <option value="admin">{t("admin.users.roleAdmins")}</option>
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
          <option value="">{t("admin.users.allStatuses")}</option>
          <option value="active">{t("admin.users.active")}</option>
          <option value="suspended">{t("admin.users.suspended")}</option>
          <option value="unverified">{t("admin.users.unverified")}</option>
        </select>
      </div>

      <div className="bg-background border border-neutral-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-neutral-200">
              <th className="py-2.5 px-4">{t("admin.users.name")}</th>
              <th className="py-2.5 px-4">{t("admin.users.email")}</th>
              <th className="py-2.5 px-4">{t("admin.users.role")}</th>
              <th className="py-2.5 px-4">{t("admin.users.status")}</th>
              <th className="py-2.5 px-4">{t("admin.users.joined")}</th>
              <th className="py-2.5 px-4">{t("admin.users.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-secondary">
                  {t("admin.loading")}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-secondary">
                  {t("admin.users.none")}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2.5 px-4 text-text-primary font-medium">{u.name}</td>
                  <td className="py-2.5 px-4 text-text-secondary">{u.email}</td>
                  <td className="py-2.5 px-4 text-text-secondary">{t(`admin.users.roles.${u.role}`)}</td>
                  <td className="py-2.5 px-4">
                    {u.isSuspended ? (
                      <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">{t("admin.users.suspended")}</span>
                    ) : u.emailVerified === false ? (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{t("admin.users.unverifiedShort")}</span>
                    ) : (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">{t("admin.users.active")}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-text-secondary">{formatDate(u.createdAt)}</td>
                  <td className="py-2.5 px-4">
                    {u.role !== "admin" && (
                      <div className="flex gap-2">
                        <button onClick={() => suspend(u)} className="text-xs text-primary hover:underline">
                          {u.isSuspended ? t("admin.users.reinstate") : t("admin.users.suspend")}
                        </button>
                        <button onClick={() => remove(u)} className="text-xs text-error hover:underline">
                          {t("admin.users.delete")}
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
            {t("admin.previous")}
          </button>
          <span className="text-text-secondary">
            {t("admin.pageOf", { page: formatNumber(pagination.page), total: formatNumber(pagination.totalPages) })}
          </span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-neutral-300 rounded disabled:opacity-50">
            {t("admin.next")}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
