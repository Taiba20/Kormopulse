import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { reviewService } from "../services/reviewService";
import { useI18n } from "../i18n/I18nContext";

function BreakdownTable({ title, rows, unit = "", fmt, translateKey }) {
  const { t, formatNumber } = useI18n();
  if (!rows?.length) return null;
  return (
    <div className="bg-background border border-neutral-200 rounded-xl p-4">
      <p className="font-semibold text-text-primary mb-3">{title}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-secondary border-b border-neutral-200">
            <th className="py-1.5 pr-3">{unit}</th>
            <th className="py-1.5 pr-3">{t("insights.jobs")}</th>
            <th className="py-1.5">{t("insights.medianSalary")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-neutral-100 last:border-0">
              <td className="py-1.5 pr-3 text-text-primary capitalize">{translateKey ? translateKey(r.key) : r.key}</td>
              <td className="py-1.5 pr-3 text-text-secondary">{formatNumber(r.count)}</td>
              <td className="py-1.5 text-text-secondary">{fmt(r.median)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalaryInsights() {
  const { t, tOr, formatNumber } = useI18n();
  const fmt = (n) => `৳${formatNumber(Number(n || 0))}`;
  const [filters, setFilters] = useState({ title: "", location: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      reviewService
        .getSalaryInsights(filters)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const chartData = data
    ? [
        { name: t("insights.p25Short"), value: data.overall.p25 },
        { name: t("insights.medianShort"), value: data.overall.median },
        { name: t("insights.p75Short"), value: data.overall.p75 },
      ]
    : [];

  return (
    <div className="mt-16 min-h-screen bg-background-secondary py-8 px-5 md:px-10">
      <h1 className="text-2xl font-bold text-text-primary mb-1">{t("insights.title")}</h1>
      <p className="text-text-secondary text-sm mb-6">
        {t("insights.subtitle")}
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={filters.title}
          onChange={(e) => setFilters((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("insights.titlePlaceholder")}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background w-64"
        />
        <input
          value={filters.location}
          onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          placeholder={t("insights.locationPlaceholder")}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background w-48"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !data || data.sampleSize === 0 ? (
        <p className="text-text-secondary py-10">{t("insights.noData")}</p>
      ) : (
        <div className="flex flex-col gap-6 max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              [t("insights.sampleSize"), formatNumber(data.sampleSize)],
              [t("insights.p25"), fmt(data.overall.p25)],
              [t("insights.median"), fmt(data.overall.median)],
              [t("insights.p75"), fmt(data.overall.p75)],
            ].map(([label, value]) => (
              <div key={label} className="bg-background border border-neutral-200 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-secondary mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-background border border-neutral-200 rounded-xl p-4">
            <p className="font-semibold text-text-primary mb-3">{t("insights.distribution", { currency: data.currency })}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${formatNumber(Math.round(v / 1000))}k`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="value" fill="#9E0A57" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <BreakdownTable title={t("insights.byExperience")} rows={data.byExperience} unit={t("insights.level")} fmt={fmt} translateKey={(k) => tOr(`insights.bands.${k}`, k)} />
            <BreakdownTable title={t("insights.byCategory")} rows={data.byCategory} unit={t("insights.category")} fmt={fmt} />
            <BreakdownTable title={t("insights.byLocation")} rows={data.byLocation} unit={t("insights.locationCol")} fmt={fmt} />
            <BreakdownTable title={t("insights.byJobType")} rows={data.byJobType} unit={t("insights.type")} fmt={fmt} translateKey={(k) => tOr(`enums.jobType.${k}`, k)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SalaryInsights;
