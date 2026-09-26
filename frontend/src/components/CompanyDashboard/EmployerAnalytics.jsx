import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { companyService } from "../../services/companyService";

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
    <p className="text-sm text-text-secondary">{label}</p>
    <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
    {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
  </div>
);

function EmployerAnalytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    companyService
      .getAnalytics(days)
      .then(setData)
      .catch((error) => console.error("Failed to load analytics", error))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const { summary, funnel, applicationsOverTime, topJobs, statusBreakdown } = data;

  return (
    <div className="p-6 pt-20 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Recruitment Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-neutral-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active jobs" value={summary.activeJobs} sub={`${summary.totalJobs} total`} />
        <StatCard label="Applications" value={summary.totalApplications} sub={`${summary.trendPercent >= 0 ? "+" : ""}${summary.trendPercent}% vs previous period`} />
        <StatCard label="Hires" value={summary.hires} sub={`${summary.avgTimeToHireDays}d avg. time to hire`} />
        <StatCard label="Conversion" value={`${summary.conversionPercent}%`} sub="views to applications" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <p className="font-semibold text-text-primary mb-3">Applications over time</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={applicationsOverTime}>
              <defs>
                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9E0A57" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#9E0A57" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} minTickGap={20} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#9E0A57" fill="url(#colorApps)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <p className="font-semibold text-text-primary mb-3">Hiring funnel</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#BD134F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
        <p className="font-semibold text-text-primary mb-3">Top performing jobs</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-neutral-200">
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">Views</th>
                <th className="py-2 pr-4">Applications</th>
                <th className="py-2 pr-4">Conversion</th>
                <th className="py-2 pr-4">Hires</th>
              </tr>
            </thead>
            <tbody>
              {topJobs.map((job) => (
                <tr key={job._id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2 pr-4 text-text-primary font-medium">{job.title}</td>
                  <td className="py-2 pr-4 text-text-secondary">{job.views}</td>
                  <td className="py-2 pr-4 text-text-secondary">{job.applications}</td>
                  <td className="py-2 pr-4 text-text-secondary">{job.conversionPercent}%</td>
                  <td className="py-2 pr-4 text-text-secondary">{job.hires}</td>
                </tr>
              ))}
              {topJobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-text-muted">
                    No jobs posted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <p className="font-semibold text-text-primary mb-3">Applications by status</p>
        <div className="flex flex-wrap gap-3">
          {statusBreakdown.map((s) => (
            <div key={s.status} className="flex-1 min-w-[100px] rounded-lg bg-neutral-50 px-3 py-2 text-center">
              <p className="text-xl font-bold text-text-primary">{s.count}</p>
              <p className="text-xs text-text-secondary capitalize">{s.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EmployerAnalytics;
