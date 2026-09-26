import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { adminService } from "../../services/adminService";
import { useI18n } from "../../i18n/I18nContext";

const COLORS = ["#9E0A57", "#BD134F", "#E6396B", "#731053", "#5A0A3F", "#FF9800", "#4CAF50"];

const StatCard = ({ label, value }) => (
  <div className="bg-background border border-neutral-200 rounded-lg p-4">
    <p className="text-sm text-text-secondary">{label}</p>
    <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
  </div>
);

function AdminOverview() {
  const { t, tOr, formatNumber } = useI18n();
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminService
      .getStats(days)
      .then(setData)
      .catch((error) => console.error("Failed to load admin stats", error))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const { totals, jobsByCategory, topCompanies, series } = data;
  const applicationsByStatus = data.applicationsByStatus.map((s) => ({ ...s, status: tOr(`enums.appStatus.${s.status}`, s.status) }));

  const seriesData = series.signups.map((point, i) => ({
    date: point.date,
    [t("admin.overview.signups")]: point.count,
    [t("admin.overview.jobs")]: series.jobs[i]?.count || 0,
    [t("admin.overview.applications")]: series.applications[i]?.count || 0,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-primary">{t("admin.overview.title")}</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-neutral-300 rounded-lg px-3 py-1.5 text-sm bg-background">
          <option value={7}>{t("admin.overview.last7")}</option>
          <option value={30}>{t("admin.overview.last30")}</option>
          <option value={90}>{t("admin.overview.last90")}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t("admin.overview.totalUsers")} value={formatNumber(totals.users)} />
        <StatCard label={t("admin.overview.jobSeekers")} value={formatNumber(totals.jobSeekers)} />
        <StatCard label={t("admin.overview.employers")} value={formatNumber(totals.employers)} />
        <StatCard label={t("admin.overview.suspended")} value={formatNumber(totals.suspended)} />
        <StatCard label={t("admin.overview.jobsActive")} value={`${formatNumber(totals.activeJobs)}/${formatNumber(totals.jobs)}`} />
        <StatCard label={t("admin.overview.applications")} value={formatNumber(totals.applications)} />
        <StatCard label={t("admin.overview.interviews")} value={formatNumber(totals.interviews)} />
        <StatCard label={t("admin.overview.reviews")} value={formatNumber(totals.reviews)} />
      </div>

      <div className="bg-background border border-neutral-200 rounded-xl p-4 mb-6">
        <p className="font-semibold text-text-primary mb-3">{t("admin.overview.series")}</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={seriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} minTickGap={25} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} tickFormatter={formatNumber} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey={t("admin.overview.signups")} stroke="#9E0A57" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey={t("admin.overview.jobs")} stroke="#4CAF50" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey={t("admin.overview.applications")} stroke="#FF9800" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-background border border-neutral-200 rounded-xl p-4">
          <p className="font-semibold text-text-primary mb-3">{t("admin.overview.byStatus")}</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={applicationsByStatus} dataKey="count" nameKey="status" outerRadius={80} label={({ status }) => status}>
                {applicationsByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-background border border-neutral-200 rounded-xl p-4">
          <p className="font-semibold text-text-primary mb-3">{t("admin.overview.byCategory")}</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={jobsByCategory} dataKey="count" nameKey="category" outerRadius={80} label={({ category }) => category}>
                {jobsByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-background border border-neutral-200 rounded-xl p-4">
        <p className="font-semibold text-text-primary mb-3">{t("admin.overview.topCompanies")}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-neutral-200">
              <th className="py-2 pr-4">{t("admin.overview.company")}</th>
              <th className="py-2 pr-4">{t("admin.overview.jobs")}</th>
              <th className="py-2 pr-4">{t("admin.overview.applications")}</th>
            </tr>
          </thead>
          <tbody>
            {topCompanies.map((c, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0">
                <td className="py-2 pr-4 text-text-primary font-medium">{c.name}</td>
                <td className="py-2 pr-4 text-text-secondary">{formatNumber(c.jobs)}</td>
                <td className="py-2 pr-4 text-text-secondary">{formatNumber(c.applications)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminOverview;
