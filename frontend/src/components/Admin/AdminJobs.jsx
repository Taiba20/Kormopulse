import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { useI18n } from "../../i18n/I18nContext";

function AdminJobs() {
  const { t, tError, formatNumber } = useI18n();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listJobs({ search, status, page, limit: 15 });
      setJobs(data.jobs || []);
      setPagination(data.pagination || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page]);

  const toggleStatus = async (job) => {
    try {
      await adminService.setJobStatus(job._id, !job.isActive);
      load();
    } catch (err) {
      alert(tError(err, "admin.actionFailed"));
    }
  };

  const remove = async (job) => {
    if (!window.confirm(t("admin.jobs.confirmDelete", { title: job.title }))) return;
    try {
      await adminService.deleteJob(job._id);
      load();
    } catch (err) {
      alert(tError(err, "admin.actionFailed"));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-4">{t("admin.jobs.title")}</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder={t("admin.jobs.search")}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background w-64"
        />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
          <option value="">{t("admin.jobs.allStatuses")}</option>
          <option value="active">{t("admin.jobs.active")}</option>
          <option value="inactive">{t("admin.jobs.inactive")}</option>
        </select>
      </div>

      <div className="bg-background border border-neutral-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-neutral-200">
              <th className="py-2.5 px-4">{t("admin.jobs.colTitle")}</th>
              <th className="py-2.5 px-4">{t("admin.jobs.colCompany")}</th>
              <th className="py-2.5 px-4">{t("admin.jobs.postedBy")}</th>
              <th className="py-2.5 px-4">{t("admin.jobs.applications")}</th>
              <th className="py-2.5 px-4">{t("admin.jobs.status")}</th>
              <th className="py-2.5 px-4">{t("admin.jobs.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-text-secondary">{t("admin.loading")}</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-text-secondary">{t("admin.jobs.none")}</td></tr>
            ) : (
              jobs.map((job) => (
                <tr key={job._id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2.5 px-4 text-text-primary font-medium">{job.title}</td>
                  <td className="py-2.5 px-4 text-text-secondary">{job.company?.companyName}</td>
                  <td className="py-2.5 px-4 text-text-secondary">{job.postedBy?.email}</td>
                  <td className="py-2.5 px-4 text-text-secondary">{formatNumber(job.applicationCount || 0)}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${job.isActive ? "bg-success/10 text-success" : "bg-neutral-200 text-text-secondary"}`}>
                      {job.isActive ? t("admin.jobs.active") : t("admin.jobs.inactive")}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => toggleStatus(job)} className="text-xs text-primary hover:underline">
                        {job.isActive ? t("admin.jobs.deactivate") : t("admin.jobs.activate")}
                      </button>
                      <button onClick={() => remove(job)} className="text-xs text-error hover:underline">
                        {t("admin.jobs.delete")}
                      </button>
                    </div>
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
          <span className="text-text-secondary">{t("admin.pageOf", { page: formatNumber(pagination.page), total: formatNumber(pagination.totalPages) })}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-neutral-300 rounded disabled:opacity-50">
            {t("admin.next")}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminJobs;
