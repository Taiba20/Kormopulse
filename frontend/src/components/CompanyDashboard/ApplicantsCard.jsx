import React from "react";
import { companyService } from "../../services/companyService";
import { messageService } from "../../services/messageService";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";

function ApplicantsCard({ isShortlisted, data, fetchApplications }) {
  const navigate = useNavigate();
  const { t, formatDate: formatLocaleDate, formatNumber } = useI18n();

  // Add debugging to see data structure - reduced logging
  if (!data?.applicantProfile?.userProfile?.profilePicture) {
    console.log("Missing profile picture for:", data?.applicantProfile?.name || "Unknown");
  }

  // Add safety checks for data structure
  if (!data || !data.applicantProfile) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 flex items-center justify-center shadow-lg"
           style={{ boxShadow: '4px 4px 0px #9E0A57' }}>
        <p className="text-text-secondary">{t("applicantCard.noData")}</p>
      </div>
    );
  }

  const { applicantProfile, jobDetails, status, appliedAt, coverLetter } = data;

  // Safe destructuring with fallbacks - backend maps jobSeekerProfile to userProfile
  const userProfile = applicantProfile?.userProfile || {};
  
  // Try multiple sources for profile picture - User model first, then applicantProfile direct
  const profilePicture = applicantProfile?.profilePicture || 
                        userProfile?.profilePicture || 
                        applicantProfile?.userProfile?.profilePicture ||
                        "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

  // Enhanced debugging for profile picture - reduced logging
  console.log("Profile picture sources for", applicantProfile?.name || 'Unknown', {
    applicantProfile_profilePicture: applicantProfile?.profilePicture,
    userProfile_profilePicture: userProfile?.profilePicture,
    final_profilePicture: profilePicture
  });

  const {
    bio = "",
    education = [],
    workExperience = [],
    address = {},
    yearsOfExperience = 0,
    resume = null,
    socialProfiles = {},
    skills = [],
  } = userProfile;

  // Get name from user object directly, fallback to userProfile
  const name = applicantProfile?.name || userProfile?.name || t("applicantCard.unknownApplicant");

  // Remove the old enhanced debugging as we have it above now

  const formatDate = (dateString) => formatLocaleDate(dateString, { year: "numeric", month: "short" });

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return t("applicantCard.duration", {
      years: formatNumber(endDate.getFullYear() - startDate.getFullYear()),
      months: formatNumber(endDate.getMonth() - startDate.getMonth()),
    });
  };

  const removeApplicant = async () => {
    try {
      await companyService.removeApplication({
        jobId: jobDetails._id,
        applicantId: applicantProfile._id,
      });
      fetchApplications();
    } catch (error) {
      console.log("Error removing application:", error);
      alert(t("applicantCard.rejectFailed"));
    }
  };

  const shortlistCandidate = async () => {
    try {
      await companyService.shortlistCandidate({
        jobId: jobDetails._id,
        applicantId: applicantProfile._id,
      });
      fetchApplications();
    } catch (error) {
      console.log("Error shortlisting candidate:", error);
      alert(t("applicantCard.shortlistFailed"));
    }
  };

  const hireCandidate = async () => {
    try {
      const confirmHire = window.confirm(t("applicantCard.hireConfirm", { name }));
      if (!confirmHire) return;
      
      await companyService.hireCandidate({
        jobId: jobDetails._id,
        applicantId: applicantProfile._id,
      });
      alert(t("applicantCard.hired", { name }));
      fetchApplications();
    } catch (error) {
      console.log("Error hiring candidate:", error);
      alert(t("applicantCard.hireFailed"));
    }
  };

  const removeShortlistedCandidate = async () => {
    try {
      await companyService.removeFromShortlist({
        jobId: jobDetails._id,
        applicantId: applicantProfile._id,
      });
      fetchApplications();
    } catch (error) {
      console.log("Error removing from shortlist:", error);
      alert(t("applicantCard.removeShortlistFailed"));
    }
  };

  const requestToChat = async () => {
    try {
      await messageService.sendChatRequest({
        applicantId: applicantProfile._id,
        jobId: jobDetails._id
      });
      alert(t("applicantCard.chatSent", { name }));
    } catch (error) {
      console.log("Error sending chat request:", error);
      alert(t("applicantCard.chatFailed"));
    }
  };

  const openPublicProfile = () => {
    navigate(`/user/${applicantProfile._id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'shortlisted': return 'bg-accent text-white';
      case 'rejected': return 'bg-error text-white';
      case 'reviewed': return 'bg-warning text-white';
      case 'hired': return 'bg-success text-white';
      default: return 'bg-primary text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'shortlisted': return '⭐';
      case 'rejected': return '❌';
      case 'reviewed': return '👁️';
      case 'hired': return '🎉';
      default: return '📝';
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
         style={{ boxShadow: '4px 4px 0px #9E0A57' }}>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-white">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={profilePicture}
              alt={name}
              className="w-16 h-16 rounded-full border-4 border-white object-cover"
              onError={(e) => {
                e.target.src = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
              }}
            />
            <div className={`absolute -bottom-1 -right-1 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white">{name}</h3>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span>{t("applicantCard.yearsExperience", { n: formatNumber(Number(yearsOfExperience) || 0) })}</span>
              {address?.country && (
                <>
                  <span>•</span>
                  <span className="capitalize">{address.country}</span>
                </>
              )}
            </div>
            <div className="mt-1">
              <span className="inline-block bg-white/20 text-white px-2 py-1 rounded-full text-xs font-medium">
                {t("applicantCard.applied", { date: appliedAt ? formatDate(appliedAt) : t("applicantCard.recently") })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Information */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-briefcase text-primary"></i>
          <span className="font-semibold text-text-primary">{t("applicantCard.appliedFor")}</span>
        </div>
        <p className="text-text-secondary font-medium">{jobDetails?.title || t("applicantCard.unknownPosition")}</p>
        {coverLetter && (
          <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
            <p className="text-xs text-text-secondary mb-1">{t("applicantCard.coverLetter")}</p>
            <p className="text-sm text-text-primary line-clamp-2">{coverLetter}</p>
          </div>
        )}
      </div>

      {/* Bio Section */}
      {(
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-user text-primary"></i>
            <span className="font-semibold text-text-primary">{t("applicantCard.bio")}</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{bio || t("applicantCard.noBio")}</p>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-code text-primary"></i>
            <span className="font-semibold text-text-primary">{t("applicantCard.skills")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 5).map((skill, index) => (
              <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="text-text-secondary text-xs">{t("applicantCard.more", { n: formatNumber(skills.length - 5) })}</span>
            )}
          </div>
        </div>
      )}

      {/* Experience */}
      {workExperience && workExperience.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-building text-primary"></i>
            <span className="font-semibold text-text-primary">{t("applicantCard.recentExperience")}</span>
          </div>
          {workExperience.slice(0, 2).map((exp, index) => (
            <div key={index} className="flex gap-3 mb-3 last:mb-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-200 flex items-center justify-center bg-neutral-50">
                  <img
                    src={exp.company?.logoUrl || "https://via.placeholder.com/40?text=Co"}
                    alt={exp.company?.name || ""}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/40?text=Co";
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary text-sm">{exp.jobTitle}</p>
                <p className="text-text-secondary text-xs">{exp.company?.name || t("applicantCard.company")}</p>
                {exp.startMonth && exp.endMonth && (
                  <p className="text-text-muted text-xs">
                    {formatDate(exp.startMonth)} - {formatDate(exp.endMonth)}
                    {calculateDuration(exp.startMonth, exp.endMonth) && (
                      <span className="ml-1">• {calculateDuration(exp.startMonth, exp.endMonth)}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-graduation-cap text-primary"></i>
            <span className="font-semibold text-text-primary">{t("applicantCard.education")}</span>
          </div>
          {education.slice(0, 1).map((edu, index) => (
            <div key={index}>
              <p className="font-medium text-text-primary text-sm">
                {edu.degree}, {edu.fieldOfStudy}
              </p>
              <p className="text-text-secondary text-xs">{edu.institution}</p>
              {edu.startYear && edu.endYear && (
                <p className="text-text-muted text-xs">
                  {edu.startYear} - {edu.endYear}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 bg-neutral-50">
        <div className="flex flex-wrap gap-2">
          {/* Social Links */}
          <div className="flex gap-2 mr-4">
            {socialProfiles?.linkedin && (
              <a
                href={socialProfiles.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors"
                title={t("applicantCard.linkedin")}
              >
                <i className="fa-brands fa-linkedin-in text-xs"></i>
              </a>
            )}
            {resume && (
              <a
                href={resume}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent-dark transition-colors"
                title={t("applicantCard.resume")}
              >
                <i className="fa-solid fa-file-pdf text-xs"></i>
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-1 gap-2">
            <button
              onClick={openPublicProfile}
              className="flex-1 py-2 px-3 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-eye"></i>
              {t("applicantCard.viewProfile")}
            </button>

            {isShortlisted ? (
              <>
                <button
                  onClick={hireCandidate}
                  className="py-2 px-3 bg-success text-white text-xs font-medium rounded-lg hover:bg-success/80 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-check"></i>
                  {t("applicantCard.hire")}
                </button>
                <button
                  onClick={removeShortlistedCandidate}
                  className="py-2 px-3 bg-error text-white text-xs font-medium rounded-lg hover:bg-error/80 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-times"></i>
                  {t("applicantCard.remove")}
                </button>
                <button
                  onClick={requestToChat}
                  className="py-2 px-3 bg-secondary text-white text-xs font-medium rounded-lg hover:bg-secondary-dark transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-comments"></i>
                  {t("applicantCard.chat")}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={removeApplicant}
                  className="py-2 px-3 bg-neutral-300 text-text-primary text-xs font-medium rounded-lg hover:bg-neutral-400 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-times"></i>
                  {t("applicantCard.reject")}
                </button>
                <button
                  onClick={shortlistCandidate}
                  className="py-2 px-3 bg-warning text-white text-xs font-medium rounded-lg hover:bg-warning/80 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-star"></i>
                  {t("applicantCard.shortlist")}
                </button>
                <button
                  onClick={requestToChat}
                  className="py-2 px-3 bg-secondary text-white text-xs font-medium rounded-lg hover:bg-secondary-dark transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-comments"></i>
                  {t("applicantCard.chat")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicantsCard;
