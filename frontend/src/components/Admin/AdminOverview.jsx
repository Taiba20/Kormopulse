import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { adminService } from "../../services/adminService";

const COLORS = ["#9E0A57", "#BD134F", "#E6396B", "#731053", "#5A0A3F", "#FF9800", "#4CAF50"];

const StatCard = ({ label, value }) => (
  <div className="bg-background border border-neutral-200 rounded-lg p-4">
    <p className="text-sm text-text-secondary">{label}</p>
    <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
  </div>
);

function AdminOverview() {
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

  const { totals, applicationsByStatus, jobsByCategory, topCompanies, series } = data;

  const seriesData = series.signups.map((point, i) => ({
    date: point.date,
    signups: point.count,
    jobs: series.jobs[i]?.count || 0,
    applications: series.applications[i]?.count || 0,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Platform Overview</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-neutral-300 rounded-lg px-3 py-1.5 text-sm bg-background">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total users" value={totals.users} />
        <StatCard label="Job seekers" value={totals.jobSeekers} />
        <StatCard label="Employers" value={totals.employers} />
        <StatCard label="Suspended" value={totals.suspended} />
        <StatCard label="Jobs (active)" value={`${totals.activeJobs}/${totals.jobs}`} />
        <StatCard label="Applications" value={totals.applications} />
        <StatCard label="Interviews" value={totals.interviews} />
        <StatCard label="Reviews" value={totals.reviews} />
      </div>

      <div className="bg-background border border-neutral-200 rounded-xl p-4 mb-6">
        <p className="font-semibold text-text-primary mb-3">Signups, jobs and applications over time</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={seriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} minTickGap={25} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="signups" stroke="#9E0A57" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="jobs" stroke="#4CAF50" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="applications" stroke="#FF9800" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-background border border-neutral-200 rounded-xl p-4">
          <p className="font-semibold text-text-primary mb-3">Applications by status</p>
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
          <p className="font-semibold text-text-primary mb-3">Jobs by category</p>
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
        <p className="font-semibold text-text-primary mb-3">Top companies by applications</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-neutral-200">
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Jobs</th>
              <th className="py-2 pr-4">Applications</th>
            </tr>
          </thead>
          <tbody>
            {topCompanies.map((c, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0">
                <td className="py-2 pr-4 text-text-primary font-medium">{c.name}</td>
                <td className="py-2 pr-4 text-text-secondary">{c.jobs}</td>
                <td className="py-2 pr-4 text-text-secondary">{c.applications}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminOverview;
