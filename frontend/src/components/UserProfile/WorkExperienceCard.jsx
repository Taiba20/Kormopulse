import React, { useState } from "react";

function WorkExperienceCard({
  exp,
  setShowAddWorkExperience,
  setWorkExperienceFormData,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { jobTitle, company, startMonth, description, endMonth } = exp;

  let formattedStartMonth = startMonth
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
      }).format(new Date(startMonth))
    : "N/A";
  let formattedEndMonth = endMonth
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
      }).format(new Date(endMonth))
    : "Present";

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
                {formattedStartMonth} to {formattedEndMonth}
              </p>
            )}
          </div>
        </div>
        <div>
          <span
            className="text-sm text-primary hover:text-primary-dark hover:cursor-pointer font-medium transition-colors duration-200"
            onClick={openEditForm}
          >
            Edit
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
            {isExpanded ? "Read less" : "Read more"}
          </span>
        )}
      </div>
    </div>
  );
}

export default WorkExperienceCard;
