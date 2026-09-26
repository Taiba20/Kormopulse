import React, { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";

function WorkExperienceCard({
  exp,
  setShowAddWorkExperience,
  setWorkExperienceFormData,
}) {
  const { t, formatDate } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const { jobTitle, company, startMonth, description, endMonth } = exp;

  const monthFormat = { year: "numeric", month: "long" };
  const formattedStartMonth = startMonth ? formatDate(startMonth, monthFormat) : t("profile.work.notAvailable");
  const formattedEndMonth = endMonth ? formatDate(endMonth, monthFormat) : t("profile.work.present");

  const openEditForm = () => {
    setShowAddWorkExperience(true);
    setWorkExperienceFormData(exp);
  };
  return (
    <div className="border border-neutral-200 p-4 bg-neutral-50 flex flex-col gap-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between">
        <div className="flex gap-6 text-sm">
          <div className="h-12 w-12 overflow-hidden border-2 border-neutral-300 rounded-md p-1 bg-white">
            <img src={company.logoUrl} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-text-primary">{company.name}</p>
            <p className="text-primary font-medium">{jobTitle}</p>
            {startMonth && (
              <p className="text-text-secondary text-xs">
                {t("profile.work.to", { start: formattedStartMonth, end: formattedEndMonth })}
              </p>
            )}
          </div>
        </div>
        <div>
          <span
            className="text-sm text-primary hover:text-primary-dark hover:cursor-pointer font-medium transition-colors duration-200"
            onClick={openEditForm}
          >
            {t("profile.edit")}
          </span>
        </div>
      </div>
      <div className="text-[.8rem] ml-10">
        <p
          className={`leading-5 text-left text-text-primary ${isExpanded ? "" : "line-clamp-3 "}`}
        >
          {description?.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </p>

        {description && (
          <span
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-medium text-primary hover:text-primary-dark cursor-pointer transition-colors duration-200"
          >
            {isExpanded ? t("profile.work.readLess") : t("profile.work.readMore")}
          </span>
        )}
      </div>
    </div>
  );
}

export default WorkExperienceCard;
