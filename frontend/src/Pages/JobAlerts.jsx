import React, { useEffect, useState } from "react";
import { alertService } from "../services/alertService";

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
      setError(err.response?.data?.message || "Could not create the alert.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (alert) => {
    setAlerts((prev) => prev.map((a) => (a._id === alert._id ? { ...a, isActive: !a.isActive } : a)));
    await alertService.update(alert._id, { isActive: !alert.isActive }).catch(() => load());
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
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
      <h1 className="text-2xl font-bold text-text-primary mb-1">Job Alerts</h1>
      <p className="text-text-secondary text-sm mb-6">Get emailed when new jobs match your criteria.</p>

      <div className="grid lg:grid-cols-3 gap-6 max-w-5xl">
        <form onSubmit={submit} className="lg:col-span-1 bg-background border border-neutral-200 rounded-xl p-4 h-fit flex flex-col gap-3">
          <h2 className="font-semibold text-text-primary">New alert</h2>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Alert name (optional)"
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
          />
          <input
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            placeholder="Keyword (e.g. React)"
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
          />
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Location (e.g. Dhaka)"
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
          />
          <div className="flex gap-2">
            <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className="flex-1 border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
              <option value="">Any type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
              <option value="contract">Contract</option>
            </select>
            <select value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })} className="flex-1 border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
              <option value="">Any mode</option>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <input
            type="number"
            min={0}
            value={form.minSalary}
            onChange={(e) => setForm({ ...form, minSalary: e.target.value })}
            placeholder="Minimum salary (BDT)"
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-background"
          />
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="border border-neutral-300 rounded-lg px-2 py-2 text-sm bg-background">
            <option value="instant">Instant (as soon as posted)</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </select>
          {error && <p className="text-sm text-error">{error}</p>}
          <button type="submit" disabled={creating} className="bg-primary text-white rounded-lg h-10 text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
            {creating ? "Creating..." : "Create alert"}
          </button>
        </form>

        <div className="lg:col-span-2 flex flex-col gap-3">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary self-center mt-10" />
          ) : alerts.length === 0 ? (
            <p className="text-text-secondary text-center py-10">You have no job alerts yet.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert._id} className="bg-background border border-neutral-200 rounded-xl p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary">{alert.name || alert.keyword || "All jobs"}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {[alert.keyword, alert.location, alert.jobType, alert.workMode].filter(Boolean).join(" · ") || "No filters"} &middot;{" "}
                    <span className="capitalize">{alert.frequency}</span>
                  </p>
                  {testResult[alert._id] !== undefined && (
                    <p className="text-xs text-primary mt-1">
                      {testResult[alert._id] === "error" ? "Could not run test." : `Found ${testResult[alert._id]} matching job(s) in the last 30 days.`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={alert.isActive} onChange={() => toggleActive(alert)} />
                    Active
                  </label>
                  <button onClick={() => test(alert._id)} disabled={testing === alert._id} className="text-xs text-primary hover:underline">
                    {testing === alert._id ? "Testing..." : "Test"}
                  </button>
                  <button onClick={() => remove(alert._id)} className="text-xs text-error hover:underline">
                    Delete
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
