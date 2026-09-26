import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { reviewService } from "../services/reviewService";

const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

function BreakdownTable({ title, rows, unit = "" }) {
  if (!rows?.length) return null;
  return (
    <div className="bg-background border border-neutral-200 rounded-xl p-4">
      <p className="font-semibold text-text-primary mb-3">{title}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-secondary border-b border-neutral-200">
            <th className="py-1.5 pr-3">{unit}</th>
            <th className="py-1.5 pr-3">Jobs</th>
            <th className="py-1.5">Median salary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-neutral-100 last:border-0">
              <td className="py-1.5 pr-3 text-text-primary capitalize">{r.key}</td>
              <td className="py-1.5 pr-3 text-text-secondary">{r.count}</td>
              <td className="py-1.5 text-text-secondary">{fmt(r.median)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalaryInsights() {
  const [filters, setFilters] = useState({ title: "", location: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      reviewService
        .getSalaryInsights(filters)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  const chartData = data
    ? [
        { name: "P25", value: data.overall.p25 },
        { name: "Median", value: data.overall.median },
        { name: "P75", value: data.overall.p75 },
      ]
    : [];

  return (
    <div className="mt-16 min-h-screen bg-background-secondary py-8 px-5 md:px-10">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Salary Insights</h1>
      <p className="text-text-secondary text-sm mb-6">
        Based on salary ranges published in job listings on Kormopulse — not individual pay slips.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={filters.title}
          onChange={(e) => setFilters((f) => ({ ...f, title: e.target.value }))}
          placeholder="Job title (e.g. Frontend Developer)"
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background w-64"
        />
        <input
          value={filters.location}
          onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          placeholder="Location (e.g. Dhaka)"
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background w-48"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !data || data.sampleSize === 0 ? (
        <p className="text-text-secondary py-10">No matching salary data yet. Try broadening your search.</p>
      ) : (
        <div className="flex flex-col gap-6 max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["Sample size", data.sampleSize],
              ["25th percentile", fmt(data.overall.p25)],
              ["Median", fmt(data.overall.median)],
              ["75th percentile", fmt(data.overall.p75)],
            ].map(([label, value]) => (
              <div key={label} className="bg-background border border-neutral-200 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-secondary mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-background border border-neutral-200 rounded-xl p-4">
            <p className="font-semibold text-text-primary mb-3">Salary distribution ({data.currency})</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="value" fill="#9E0A57" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <BreakdownTable title="By experience level" rows={data.byExperience} unit="Level" />
            <BreakdownTable title="By category" rows={data.byCategory} unit="Category" />
            <BreakdownTable title="By location" rows={data.byLocation} unit="Location" />
            <BreakdownTable title="By job type" rows={data.byJobType} unit="Type" />
          </div>
        </div>
      )}
    </div>
  );
}

export default SalaryInsights;
