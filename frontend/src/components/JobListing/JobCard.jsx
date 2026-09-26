import React from "react";
import Dot from "../Dot";
import MatchBadge from "../Common/MatchBadge";
import { useI18n } from "../../i18n/I18nContext";

function JobCard({ job, redirectToDetail, match }) {
  const { t, tOr, timeAgo: formatTimeAgo, formatNumber } = useI18n();

  const {
    title,
    salary,
    location,
    jobType,
    responsibilities = [],
    company,
    _id,
    createdAt,
  } = job;

  // Standardize company data access
  const companyLogo = company?.companyLogo || company?.logo || "https://via.placeholder.com/44x44?text=C";
  const companyName = company?.companyName || company?.name || t("jobs.companyUnavailable");
  
  // Standardize salary data access
  const salaryRange = salary;
  
  // Standardize job type
  const type = jobType;
  
  // Standardize date
  const rawDatePosted = createdAt;

  const timeAgo = formatTimeAgo(rawDatePosted);

  let color, bgColor;
  switch (type) {
    case "full-time":
    case "Full-time":
      color = "text-primary";
      bgColor = "bg-primary/10";
      break;
    case "part-time":
    case "Part-time":
      color = "text-accent";
      bgColor = "bg-accent/10";
      break;
    case "internship":
    case "Internship":
      color = "text-secondary";
      bgColor = "bg-secondary/10";
      break;
    case "freelance":
    case "Freelance":
      color = "text-success";
      bgColor = "bg-success/10";
      break;
    case "contract":
    case "Contract":
      color = "text-warning";
      bgColor = "bg-warning/10";
      break;
    default:
      color = "text-neutral-700";
      bgColor = "bg-neutral-200";
  }

  return (
    <div
      className="my-4 hover:cursor-pointer"
      onClick={() => redirectToDetail(_id)}
    >
      <div className="border p-3.5 shadow rounded-lg">
        {/* Top */}
        <div className="mb-2 md:mb-5 flex flex-col md:flex-row justify-between gap-5 md:gap-1">
          {/* right */}
          <div className="flex  gap-3">
            <div className="imgdiv h-11 w-11 rounded-lg overflow-hidden flex justify-center items-center border">
              <img src={companyLogo} />
            </div>
            <div className="flex flex-col mb-2 md:mb-0">
              <div className="title flex items-center gap-2 flex-wrap">
                <p className="font-bold text-text-primary">{title}</p>
                <MatchBadge match={match} />
              </div>
              <div className="flex flex-col md:flex-row gap-2 text-[.9rem] mt-1">
                <div className="company">
                  <p className="text-text-secondary font-medium text-sm">
                    {companyName}
                  </p>
                </div>
                <div className="hidden md:flex justify-center items-center">
                  <Dot />
                </div>

                <div className="flex gap-3 items-center  md:flex-row text-xs md:text-sm">
                  <div className={`tag py-px px-2.5 rounded-xl ${bgColor}`}>
                    <span className={color}>
                      {tOr(`enums.jobType.${String(type || "").toLowerCase()}`, type || t("enums.jobType.full-time"))}
                    </span>
                  </div>
                  <Dot />
                  <div className="strippend">
                    <span className="text-text-secondary">
                      {salaryRange ? (
                        `৳${formatNumber(salaryRange.min || 0)} - ৳${formatNumber(salaryRange.max || 0)}`
                      ) : (
                        t("jobs.salaryNotSpecified")
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* left */}
          <div className="">
            <div className="flex  gap-5 md:flex-col text-left md:text-right md:gap-1 text-xs md:text-base">
              <div className="flex gap-3 justify-start md:justify-center items-center">
                <i className="fa-solid fa-location-dot text-text-secondary"></i>
                <p className="font-medium text-text-primary">{location}</p>
              </div>
              <div className="text-text-secondary">
                <p>{timeAgo}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom */}
        <div className="ml-5 md:ml-10 text-text-secondary text-[.9rem]">
          <ul className="list-disc">
            {responsibilities.length > 0 ? (
              <>
                <li>{responsibilities[0]}</li>
                {responsibilities[1] && <li>{responsibilities[1]}</li>}
              </>
            ) : (
              <li>{t("jobs.clickToView")}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default JobCard;
