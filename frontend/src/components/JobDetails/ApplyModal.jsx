import React, { useState } from "react";
import { aiService } from "../../services/aiService";
import { useI18n } from "../../i18n/I18nContext";

const TONES = ["professional", "enthusiastic", "concise"];

/** Apply-for-job dialog with an optional AI-drafted cover letter. */
function ApplyModal({ job, onClose, onSubmit, submitting }) {
  const { t, tError, lang, formatNumber } = useI18n();
  const [coverLetter, setCoverLetter] = useState("");
  const [tone, setTone] = useState("professional");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [source, setSource] = useState(null);

  const draftWithAi = async () => {
    setDrafting(true);
    setDraftError("");
    try {
      const result = await aiService.generateCoverLetter(job.jobId, tone, lang);
      setCoverLetter(result.coverLetter);
      setSource(result.source);
    } catch (error) {
      setDraftError(tError(error, "jobs.apply.draftFailed"));
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h3 className="font-semibold text-text-primary">{t("jobs.apply.title", { title: job.title })}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="text-sm font-medium text-text-primary">{t("jobs.apply.coverLetter")}</label>
            <div className="flex items-center gap-2">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="text-xs border border-neutral-300 rounded-md px-2 py-1 bg-background"
              >
                {TONES.map((toneValue) => (
                  <option key={toneValue} value={toneValue}>
                    {t(`enums.tone.${toneValue}`)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={draftWithAi}
                disabled={drafting}
                className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
              >
                <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>
                {drafting ? t("jobs.apply.drafting") : t("jobs.apply.draft")}
              </button>
            </div>
          </div>

          {draftError && <p className="text-xs text-error">{draftError}</p>}
          {source === "template" && (
            <p className="text-xs text-text-muted">
              {t("jobs.apply.templateNote")}
            </p>
          )}

          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={9}
            maxLength={1000}
            placeholder={t("jobs.apply.placeholder")}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary bg-background text-text-primary"
          />
          <p className="text-right text-xs text-text-muted">{formatNumber(coverLetter.length)}/{formatNumber(1000)}</p>

          <div className="flex gap-3 justify-end mt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-neutral-300 rounded-lg text-text-secondary hover:bg-neutral-50">
              {t("common.cancel")}
            </button>
            <button
              onClick={() => onSubmit(coverLetter)}
              disabled={submitting}
              className="px-5 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? t("jobs.apply.submitting") : t("jobs.apply.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplyModal;
