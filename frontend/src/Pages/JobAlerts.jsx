import React, { useEffect, useState } from "react";
import { alertService } from "../services/alertService";
import { useI18n } from "../i18n/I18nContext";

const emptyForm = {
  name: "",
  keyword: "",
  location: "",
  jobType: "",
  workMode: "",
  minSalary: "",
  frequency: "daily",
};

function JobAlerts() {
  const { t, tOr, tError } = useI18n();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState({});

  const load = async () => {
    try {
      const data = await alertService.list();
      setAlerts(data.alerts || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const payload = { ...form, minSalary: form.minSalary ? Number(form.minSalary) : undefined };
      await alertService.create(payload);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(tError(err, "alerts.createFailed"));
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (alert) => {
    setAlerts((prev) => prev.map((a) => (a._id === alert._id ? { ...a, isActive: !a.isActive } : a)));
    await alertService.update(alert._id, { isActive: !alert.isActive }).catch(() => load());
  };

  const remove = async (id) => {
    if (!window.confirm(t("alerts.confirmDelete"))) return;
    setAlerts((prev) => prev.filter((a) => a._id !== id));
    await alertService.remove(id).catch(() => load());
  };

  const test = async (id) => {
    setTesting(id);
    try {
      const res = await alertService.test(id);
      setTestResult((prev) => ({ ...prev, [id]: res.jobsFound }));
    } catch {
      setTestResult((prev) => ({ ...prev, [id]: "error" }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="mt-16 min-h-screen bg-background-secondary py-8 px-5 md:px-10">
      <h1 className="text-2xl font-bold text-text-primary mb-1">{t("alerts.title")}</h1>
      <p className="text-text-secondary text-sm mb-6">{t("alerts.subtitle")}</p>

      <div className="grid lg:grid-cols-3 gap-6 max-w-5xl">
        <form onSubmit={submit} className="lg:col-span-1 bg-background border border-neutral-200 rounded-xl p-4 h-fit flex flex-col gap-3">
          <h2 className="font-semibold text-text-primary">{t("alerts.newAlert")}</h2>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("alerts.name")}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
          />
          <input
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            placeholder={t("alerts.keyword")}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
          />
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder={t("alerts.location")}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
          />
          <div className="flex gap-2">
            <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className="flex-1 border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
              <option value="">{t("alerts.anyType")}</option>
              <option value="full-time">{t("enums.jobType.full-time")}</option>
              <option value="part-time">{t("enums.jobType.part-time")}</option>
              <option value="internship">{t("enums.jobType.internship")}</option>
              <option value="freelance">{t("enums.jobType.freelance")}</option>
              <option value="contract">{t("enums.jobType.contract")}</option>
            </select>
            <select value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })} className="flex-1 border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
              <option value="">{t("alerts.anyMode")}</option>
              <option value="remote">{t("enums.workMode.remote")}</option>
              <option value="onsite">{t("enums.workMode.onsite")}</option>
              <option value="hybrid">{t("enums.workMode.hybrid")}</option>
            </select>
          </div>
          <input
            type="number"
            min={0}
            value={form.minSalary}
            onChange={(e) => setForm({ ...form, minSalary: e.target.value })}
            placeholder={t("alerts.minSalary")}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
          />
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
            <option value="instant">{t("alerts.frequency.instant")}</option>
            <option value="daily">{t("alerts.frequency.daily")}</option>
            <option value="weekly">{t("alerts.frequency.weekly")}</option>
          </select>
          {error && <p className="text-sm text-error">{error}</p>}
          <button type="submit" disabled={creating} className="bg-primary text-white rounded-lg h-10 text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
            {creating ? t("alerts.creating") : t("alerts.create")}
          </button>
        </form>

        <div className="lg:col-span-2 flex flex-col gap-3">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary self-center mt-10" />
          ) : alerts.length === 0 ? (
            <p className="text-text-secondary text-center py-10">{t("alerts.none")}</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert._id} className="bg-background border border-neutral-200 rounded-xl p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary">{alert.name || alert.keyword || t("alerts.allJobs")}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {[alert.keyword, alert.location, alert.jobType && tOr(`enums.jobType.${alert.jobType}`, alert.jobType), alert.workMode && tOr(`enums.workMode.${alert.workMode}`, alert.workMode)].filter(Boolean).join(" · ") || t("alerts.noFilters")} &middot;{" "}
                    <span>{tOr(`alerts.frequencyShort.${alert.frequency}`, alert.frequency)}</span>
                  </p>
                  {testResult[alert._id] !== undefined && (
                    <p className="text-xs text-primary mt-1">
                      {testResult[alert._id] === "error" ? t("alerts.testFailed") : t("alerts.testFound", { count: testResult[alert._id] })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={alert.isActive} onChange={() => toggleActive(alert)} />
                    {t("alerts.active")}
                  </label>
                  <button onClick={() => test(alert._id)} disabled={testing === alert._id} className="text-xs text-primary hover:underline">
                    {testing === alert._id ? t("alerts.testing") : t("alerts.test")}
                  </button>
                  <button onClick={() => remove(alert._id)} className="text-xs text-error hover:underline">
                    {t("alerts.delete")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default JobAlerts;
