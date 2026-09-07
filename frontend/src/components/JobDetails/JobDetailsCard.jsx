import React, { useState, useEffect } from "react";
import { userService } from "../../services/userService";
import { useSelector } from "react-redux";

function JobDetailsCard({ jobData }) {
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

  console.log('JobDetailsCard received jobData:', jobData);

  // Use createdAt from backend
  const datePosted = new Date(createdAt);
  
  // Calculate time ago properly
  const now = new Date();
  const diffTime = Math.abs(now - datePosted);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));

  let timeAgo = "Just now";
  if (diffMinutes < 60) {
    timeAgo = diffMinutes > 0 ? `${diffMinutes} minutes ago` : "Just now";
  } else if (diffHours < 24) {
    timeAgo = `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    timeAgo = `${diffDays} days ago`;
  } else {
    timeAgo = `${diffMonths} months ago`;
  }

  // Get company info from proper backend structure
  const companyName = company?.companyName || "Company Name Not Available";
  const companyLogo = company?.companyLogo || "https://via.placeholder.com/80x80?text=C";
  
  // Get salary info
  const salaryMin = salary?.min;
  const salaryMax = salary?.max;
  const salaryDisplay = salaryMin && salaryMax 
    ? `৳${salaryMin.toLocaleString()} - ৳${salaryMax.toLocaleString()}`
    : "Salary not disclosed";

  // Get experience range
  const experienceMin = experience?.min || 0;
  const experienceMax = experience?.max || 0;
  const experienceDisplay = experienceMax > experienceMin 
    ? `${experienceMin}-${experienceMax} Years`
    : `${experienceMin}+ Years`;

  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [showAppliedMessage, setShowAppliedMessage] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

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
        alert("You have already saved this job. Please check your saved jobs.");
      } else {
        alert(error.response?.data?.message || "Failed to save job. Please try again.");
      }
    }
    setSaving(false);
  };

  const applyForJob = async () => {
    if (hasApplied) {
      return;
    }
    
    const confirmApply = window.confirm("Are you sure you want to apply for this job?");
    if (!confirmApply) {
      return;
    }

    setApplying(true);
    try {
      await userService.applyForJob(jobData._id);
      setHasApplied(true);
      setShowAppliedMessage(true);
      setTimeout(() => setShowAppliedMessage(false), 5000);
    } catch (error) {
      if (error.response?.data?.message === "Job has already been applied for") {
        setHasApplied(true);
        alert("You have already applied for this job. Your profile has been shared with the recruiter.");
      } else {
        alert(error.response?.data?.message || "Failed to apply for job. Please try again.");
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
            <h4 className="font-semibold text-green-800 mb-1">Application Successful!</h4>
            <p className="text-green-700 text-sm">Your application has been submitted successfully. Your profile has been shared with the recruiter.</p>
          </div>
          <button 
            onClick={handleAppliedOkay}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            Okay
          </button>
        </div>
      )}
      
      {showSavedMessage && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 animate-in slide-in-from-top duration-300">
          <h4 className="font-semibold text-primary mb-1">Job Saved Successfully!</h4>
          <p className="text-primary/80 text-sm">The job has been saved successfully. You can view it in your saved jobs.</p>
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
            <img src={companyLogo} alt="Company Logo" />
          </div>
        </div>
      </div>
      {/* Job Stats */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="font-light text-text-secondary">
            Posted: <span className="font-medium text-text-primary">{timeAgo}</span>
          </div>
          <div className="font-light text-text-secondary">
            Openings: <span className="font-medium text-text-primary">{numberOfOpenings}</span>
          </div>
          <div className="font-light text-text-secondary">
            Applicants: <span className="font-medium text-text-primary">{numberOfApplicants}</span>
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
                ? "Please login to save job"
                : userData?.role === "employer"
                ? "Employers are not allowed to save jobs"
                : hasSaved
                ? "Job already saved"
                : ""
            }
          >
            <i className={`mr-2 ${hasSaved ? "fas fa-bookmark" : "far fa-bookmark"}`}></i>
            {saving ? "Saving..." : hasSaved ? "Saved" : "Save"}
          </button>
          <button
            className={`h-11 px-8 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-md ${
              userData?.role === "jobSeeker"
                ? hasApplied
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-primary text-white hover:bg-primary-dark hover:shadow-lg"
                : "bg-neutral-400 text-white cursor-not-allowed"
            }`}
            onClick={applyForJob}
            disabled={userData?.role !== "jobSeeker" || applying || hasApplied}
            title={
              !userData
                ? "Please login to apply for job"
                : userData?.role === "employer"
                ? "Employers are not allowed to apply"
                : hasApplied
                ? "Already applied for this job"
                : ""
            }
          >
            <i className={`mr-2 ${hasApplied ? "fas fa-paper-plane" : "far fa-paper-plane"}`}></i>
            {applying ? "Applying..." : hasApplied ? "Applied" : "Apply Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobDetailsCard;
