import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { savedSearchService } from "../services/savedSearchService";
import { useI18n } from "../i18n/I18nContext";

/** One-line summary of a saved search's filters, e.g. "\"react\" in Dhaka · 2 job types". */
const describeFilters = (filters, t, tOr) => {
  const f = filters || {};
  const parts = [];
  if (f.search) parts.push(t("savedSearches.summary.keyword", { keyword: f.search }));
  if (f.location) parts.push(t("savedSearches.summary.location", { location: f.location }));
  if (f.jobTypes?.length) parts.push(t("savedSearches.summary.jobType", { count: f.jobTypes.length }));
  if (f.workMode?.length) parts.push(t("savedSearches.summary.workMode", { count: f.workMode.length }));
  if (f.company) parts.push(f.company);
  return parts.length ? parts.join(" · ") : tOr("alerts.noFilters", "No filters");
};

function SavedSearches() {
  const { t, tOr, tError, formatDate } = useI18n();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await savedSearchService.list();
      setSearches(data.searches || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const run = (search) => {
    navigate("/jobs", { state: { savedSearch: search } });
  };

  const rename = async (search) => {
    const name = window.prompt(t("savedSearches.renamePrompt"), search.name);
    if (!name || name === search.name) return;
    setSearches((prev) => prev.map((s) => (s._id === search._id ? { ...s, name } : s)));
    try {
      await savedSearchService.rename(search._id, name);
    } catch (error) {
      alert(tError(error, "common.somethingWrong"));
      load();
    }
  };

  const remove = async (search) => {
    if (!window.confirm(t("savedSearches.confirmDelete", { name: search.name }))) return;
    setSearches((prev) => prev.filter((s) => s._id !== search._id));
    await savedSearchService.remove(search._id).catch(() => load());
  };

  return (
    <div className="mt-16 min-h-screen bg-background-secondary py-8 px-5 md:px-10">
      <h1 className="text-2xl font-bold text-text-primary mb-1">{t("savedSearches.pageTitle")}</h1>
      <p className="text-text-secondary text-sm mb-6">{t("savedSearches.pageSubtitle")}</p>

      <div className="flex flex-col gap-3 max-w-3xl">
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary self-center mt-10" />
        ) : searches.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text-secondary mb-1">{t("savedSearches.none")}</p>
            <p className="text-text-muted text-sm mb-4">{t("savedSearches.noneHint")}</p>
            <button
              onClick={() => navigate("/jobs")}
              className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t("savedSearches.browseJobs")}
            </button>
          </div>
        ) : (
          searches.map((search) => (
            <div key={search._id} className="bg-background border border-neutral-200 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-text-primary truncate">{search.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">{describeFilters(search.filters, t, tOr)}</p>
                <p className="text-[11px] text-text-muted mt-1">{t("savedSearches.savedOn", { date: formatDate(search.createdAt) })}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <button onClick={() => run(search)} className="text-xs text-primary hover:underline">
                  {t("savedSearches.run")}
                </button>
                <button onClick={() => rename(search)} className="text-xs text-text-secondary hover:underline">
                  {t("savedSearches.rename")}
                </button>
                <button onClick={() => remove(search)} className="text-xs text-error hover:underline">
                  {t("savedSearches.delete")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SavedSearches;
