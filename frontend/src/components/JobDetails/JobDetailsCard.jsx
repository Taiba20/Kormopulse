import React, { useState, useEffect } from "react";
import { userService } from "../../services/userService";
import { useSelector } from "react-redux";
import ApplyModal from "./ApplyModal";
import InterviewPrepModal from "./InterviewPrepModal";
import MatchBreakdown from "../Common/MatchBreakdown";
import { useI18n } from "../../i18n/I18nContext";

function JobDetailsCard({ jobData }) {
  const { t, tError, timeAgo: formatTimeAgo, formatNumber } = useI18n();
  const { userData } = useSelector((store) => store.auth);

  // Handle backend data structure properly
  const {
    title,
    salary = {},
    location,
    company = {},
    experience = {},
    numberOfOpenings,
    numberOfApplicants,
    _id,
    createdAt,
  } = jobData;

  const timeAgo = formatTimeAgo(createdAt);

  // Get company info from proper backend structure
  const companyName = company?.companyName || t("jobs.companyUnavailable");
  const companyLogo = company?.companyLogo || "https://via.placeholder.com/80x80?text=C";
  
  // Get salary info
  const salaryMin = salary?.min;
  const salaryMax = salary?.max;
  const salaryDisplay = salaryMin && salaryMax 
    ? `৳${formatNumber(salaryMin)} - ৳${formatNumber(salaryMax)}`
    : t("jobs.details.salaryNotDisclosed");

  // Get experience range
  const experienceMin = experience?.min || 0;
  const experienceMax = experience?.max || 0;
  const experienceDisplay = experienceMax > experienceMin 
    ? t("jobs.details.years", { min: formatNumber(experienceMin), max: formatNumber(experienceMax) })
    : t("jobs.details.yearsPlus", { min: formatNumber(experienceMin) });

  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [showAppliedMessage, setShowAppliedMessage] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showPrepModal, setShowPrepModal] = useState(false);

  // Check application status when component mounts and user/job data is available
  useEffect(() => {
    const checkUserApplicationStatus = async () => {
      if (userData?.role === 'jobSeeker' && jobData._id) {
        try {
          const status = await userService.checkApplicationStatus(jobData._id);
          setHasApplied(status.hasApplied || false);
          setHasSaved(status.hasSaved || false);
        } catch (error) {
          console.error('Error checking application status:', error);
          // If there's an error, assume not applied/saved
          setHasApplied(false);
          setHasSaved(false);
        }
      }
    };

    checkUserApplicationStatus();
  }, [userData, jobData._id]);

  const saveJob = async () => {
    setSaving(true);
    try {
      await userService.saveJob(jobData._id);
      setHasSaved(true);
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 3000);
    } catch (error) {
      if (error.response?.data?.message === "Job is already saved") {
        alert(t("jobs.details.alreadySavedAlert"));
      } else {
        alert(tError(error, "jobs.details.saveFailed"));
      }
    }
    setSaving(false);
  };

  const submitApplication = async (coverLetter) => {
    setApplying(true);
    try {
      await userService.applyForJob(jobData._id, { coverLetter });
      setHasApplied(true);
      setShowApplyModal(false);
      setShowAppliedMessage(true);
      setTimeout(() => setShowAppliedMessage(false), 5000);
    } catch (error) {
      if (error.response?.data?.message === "You have already applied for this job") {
        setHasApplied(true);
        setShowApplyModal(false);
        alert(t("jobs.details.alreadyAppliedAlert"));
      } else {
        alert(tError(error, "jobs.details.applyFailed"));
      }
    }
    setApplying(false);
  };

  const handleAppliedOkay = () => {
    setShowAppliedMessage(false);
  };

  return (
    <div className="flex flex-col gap-6 border border-neutral-200 bg-background p-6 rounded-3xl shadow-lg">
      {/* Success Messages */}
      {showAppliedMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center animate-in slide-in-from-top duration-300">
          <div>
            <h4 className="font-semibold text-green-800 mb-1">{t("jobs.details.applicationSuccess")}</h4>
            <p className="text-green-700 text-sm">{t("jobs.details.applicationSuccessText")}</p>
          </div>
          <button 
            onClick={handleAppliedOkay}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            {t("jobs.details.okay")}
          </button>
        </div>
      )}
      
      {showSavedMessage && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 animate-in slide-in-from-top duration-300">
          <h4 className="font-semibold text-primary mb-1">{t("jobs.details.jobSaved")}</h4>
          <p className="text-primary/80 text-sm">{t("jobs.details.jobSavedText")}</p>
        </div>
      )}

      {/* Job Header */}
      <div className="flex flex-col md:flex-row md:justify-between border-b border-neutral-200 pb-6 gap-4">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1.5">
            <p className="text-xl font-medium text-text-primary">{title}</p>
            <div className="text-lg font-semibold text-text-primary">
              {companyName}
            </div>
          </div>
          <div className="text-text-secondary text-sm flex flex-col gap-2">
            <div className="flex gap-5 ">
              <div className="flex gap-3">
                <span>
                  <i className="fa-solid fa-briefcase"></i>
                </span>
                <span>{experienceDisplay}</span>
              </div>
              <div className="flex gap-3">
                <span>
                  <span className="text-lg">৳</span>{" "}
                </span>
                <span>
                  {salaryDisplay}
                </span>
              </div>
            </div>
            <div>
              <div className="flex gap-3">
                <span>
                  <i className="fa-solid fa-location-dot"></i>{" "}
                </span>
                <span>{location}</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="h-20 w-20 rounded-3xl border border-neutral-200 overflow-hidden flex justify-center items-center bg-background-secondary">
            <img src={companyLogo} alt="" />
          </div>
        </div>
      </div>
      {/* Job Stats */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="font-light text-text-secondary">
            {t("jobs.details.posted")} <span className="font-medium text-text-primary">{timeAgo}</span>
          </div>
          <div className="font-light text-text-secondary">
            {t("jobs.details.openings")} <span className="font-medium text-text-primary">{formatNumber(numberOfOpenings || 0)}</span>
          </div>
          <div className="font-light text-text-secondary">
            {t("jobs.details.applicants")} <span className="font-medium text-text-primary">{formatNumber(numberOfApplicants || 0)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className={`border h-11 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-sm ${
              userData?.role === "jobSeeker"
                ? hasSaved 
                  ? "border-green-500 text-green-500 bg-green-50 hover:bg-green-100"
                  : "border-primary text-primary hover:bg-primary hover:text-white hover:shadow-md"
                : "border-neutral-400 text-neutral-400 cursor-not-allowed bg-neutral-50"
            }`}
            onClick={saveJob}
            disabled={userData?.role !== "jobSeeker" || saving || hasSaved}
            title={
              !userData
                ? t("jobs.details.loginToSave")
                : userData?.role === "employer"
                ? t("jobs.details.employerNoSave")
                : hasSaved
                ? t("jobs.details.alreadySavedTitle")
                : ""
            }
          >
            <i className={`mr-2 ${hasSaved ? "fas fa-bookmark" : "far fa-bookmark"}`}></i>
            {saving ? t("jobs.details.saving") : hasSaved ? t("jobs.details.saved") : t("jobs.details.save")}
          </button>
          <button
            className={`h-11 px-8 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-md ${
              userData?.role === "jobSeeker"
                ? hasApplied
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-primary text-white hover:bg-primary-dark hover:shadow-lg"
                : "bg-neutral-400 text-white cursor-not-allowed"
            }`}
            onClick={() => setShowApplyModal(true)}
            disabled={userData?.role !== "jobSeeker" || applying || hasApplied}
            title={
              !userData
                ? t("jobs.details.loginToApply")
                : userData?.role === "employer"
                ? t("jobs.details.employerNoApply")
                : hasApplied
                ? t("jobs.details.alreadyAppliedTitle")
                : ""
            }
          >
            <i className={`mr-2 ${hasApplied ? "fas fa-paper-plane" : "far fa-paper-plane"}`}></i>
            {applying ? t("jobs.details.applying") : hasApplied ? t("jobs.details.applied") : t("jobs.details.applyNow")}
          </button>
          {userData?.role === "jobSeeker" && (
            <button
              onClick={() => setShowPrepModal(true)}
              className="h-11 px-6 rounded-xl font-medium border border-secondary text-secondary hover:bg-secondary hover:text-white transition-all duration-200 hover:scale-105"
            >
              <i className="fa-solid fa-graduation-cap mr-2"></i>
              {t("jobs.details.prepInterview")}
            </button>
          )}
        </div>
      </div>

      {userData?.role === "jobSeeker" && <MatchBreakdown jobId={jobData._id} />}

      {showApplyModal && (
        <ApplyModal
          job={{ jobId: jobData._id, title }}
          submitting={applying}
          onClose={() => setShowApplyModal(false)}
          onSubmit={submitApplication}
        />
      )}
      {showPrepModal && (
        <InterviewPrepModal jobId={jobData._id} jobTitle={title} onClose={() => setShowPrepModal(false)} />
      )}
    </div>
  );
}

export default JobDetailsCard;
