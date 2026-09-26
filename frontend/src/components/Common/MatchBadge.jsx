import React from "react";
import { useI18n } from "../../i18n/I18nContext";

const styleFor = (score) => {
  if (score >= 80) return "bg-success/10 text-success";
  if (score >= 60) return "bg-primary/10 text-primary";
  if (score >= 40) return "bg-warning/10 text-warning";
  return "bg-neutral-200 text-text-secondary";
};

/** Small "82% match" pill. Renders nothing until a score is available. */
function MatchBadge({ match, className = "" }) {
  const { t, tOr, formatNumber } = useI18n();
  if (!match || typeof match.score !== "number") return null;

  return (
    <span
      title={tOr(`enums.matchLabel.${match.label}`, match.label)}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styleFor(match.score)} ${className}`}
    >
      <i className="fa-solid fa-bullseye text-[10px]"></i>
      {t("jobs.match.matchPill", { score: formatNumber(match.score) })}
    </span>
  );
}

export default MatchBadge;
