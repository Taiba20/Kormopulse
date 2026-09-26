import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { applicationService } from "../../services/applicationService";
import { useI18n } from "../../i18n/I18nContext";

// The API sends the experience note as English text; map the known sentences to translations.
const experienceNoteText = (note, t, formatNumber) => {
  if (note === "Experience fits the requirement") return t("jobs.match.exp.fits");
  if (note === "More experienced than the role asks for") return t("jobs.match.exp.more");
  const below = note.match(/^([\d.]+) year\(s\) below the minimum$/);
  return below ? t("jobs.match.exp.below", { n: formatNumber(Number(below[1])) }) : note;
};

/** Full match breakdown for a job's detail page: score, matched and missing skills. */
function MatchBreakdown({ jobId }) {
  const { t, tOr, formatNumber } = useI18n();
  const { userData } = useSelector((store) => store.auth);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId || userData?.role !== "jobSeeker") return;
    let cancelled = false;
    setLoading(true);
    applicationService
      .getJobMatch(jobId)
      .then((data) => {
        if (!cancelled) setMatch(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, userData?.role]);

  if (userData?.role !== "jobSeeker") return null;
  if (loading) return <div className="animate-pulse h-24 rounded-lg bg-neutral-100" />;
  if (!match) return null;

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-text-primary">{t("jobs.match.yourMatch", { label: tOr(`enums.matchLabel.${match.label}`, match.label) })}</h3>
        <span className="text-2xl font-bold text-primary">{formatNumber(match.score)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden mb-3">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${match.score}%` }} />
      </div>

      {match.matchedSkills?.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-text-secondary mb-1">{t("jobs.match.skillsYouHave")}</p>
          <div className="flex flex-wrap gap-1.5">
            {match.matchedSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-success/10 text-success px-2 py-0.5 text-xs">
                <i className="fa-solid fa-check text-[10px] mr-1"></i>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.missingSkills?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-secondary mb-1">{t("jobs.match.skillsToLearn")}</p>
          <div className="flex flex-wrap gap-1.5">
            {match.missingSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-warning/10 text-warning px-2 py-0.5 text-xs">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.experienceNote && <p className="text-xs text-text-muted mt-2">{experienceNoteText(match.experienceNote, t, formatNumber)}</p>}
    </div>
  );
}

export default MatchBreakdown;
