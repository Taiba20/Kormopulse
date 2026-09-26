import React, { useEffect, useState } from "react";
import { aiService } from "../../services/aiService";
import { useI18n } from "../../i18n/I18nContext";

/** Shows AI-generated (or template) interview questions and tips for a job. */
function InterviewPrepModal({ jobId, jobTitle, onClose }) {
  const { t, tError, lang } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    aiService
      .getInterviewPrep(jobId, lang)
      .then(setData)
      .catch((err) => setError(tError(err, "jobs.prep.failed")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, lang]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-background rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h3 className="font-semibold text-text-primary">{t("jobs.prep.title", { title: jobTitle })}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-5">
          {loading && <p className="text-sm text-text-secondary py-8 text-center">{t("jobs.prep.loading")}</p>}
          {error && <p className="text-sm text-error py-8 text-center">{error}</p>}

          {data && (
            <>
              {data.focusSkills?.length > 0 && (
                <div className="mb-4 rounded-lg bg-warning/10 p-3">
                  <p className="text-xs font-medium text-warning mb-1">{t("jobs.prep.brushUp")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.focusSkills.map((s) => (
                      <span key={s} className="rounded-full bg-background px-2 py-0.5 text-xs text-text-primary border border-warning/30">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 mb-5">
                {data.questions?.map((q, i) => (
                  <div key={i} className="rounded-lg border border-neutral-200 p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-text-primary text-sm">{q.question}</p>
                      <span className="flex-shrink-0 text-[10px] uppercase tracking-wide bg-neutral-100 text-text-secondary px-2 py-0.5 rounded-full">
                        {t(`jobs.prep.category.${q.category}`) === `jobs.prep.category.${q.category}` ? t("jobs.prep.category.general") : t(`jobs.prep.category.${q.category}`)}
                      </span>
                    </div>
                    {q.tip && <p className="text-xs text-text-secondary">💡 {q.tip}</p>}
                  </div>
                ))}
              </div>

              {data.preparationTips?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-2">{t("jobs.prep.before")}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                    {data.preparationTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.source === "template" && (
                <p className="text-xs text-text-muted mt-4">
                  {t("jobs.prep.templateNote")}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewPrepModal;
