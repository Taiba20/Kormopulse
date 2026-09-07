import React from "react";
import { companyService } from "../../services/companyService";
import { messageService } from "../../services/messageService";
import { useNavigate } from "react-router-dom";

function ApplicantsCard({ isShortlisted, data, fetchApplications }) {
  const navigate = useNavigate();

  // Add debugging to see data structure - reduced logging
  if (!data?.applicantProfile?.userProfile?.profilePicture) {
    console.log("Missing profile picture for:", data?.applicantProfile?.name || "Unknown");
  }

  // Add safety checks for data structure
  if (!data || !data.applicantProfile) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 flex items-center justify-center shadow-lg"
           style={{ boxShadow: '4px 4px 0px #9E0A57' }}>
        <p className="text-text-secondary">No applicant data available</p>
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
    bio = "No bio available",
    education = [],
    workExperience = [],
    address = {},
    yearsOfExperience = 0,
    resume = null,
    socialProfiles = {},
    skills = [],
  } = userProfile;

  // Get name from user object directly, fallback to userProfile
  const name = applicantProfile?.name || userProfile?.name || "Unknown Applicant";

  // Remove the old enhanced debugging as we have it above now

  function formatDate(dateString) {
    const options = { year: "numeric", month: "short" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  function calculateDuration(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    return `${years} years ${months} months`;
  }

  const removeApplicant = async () => {
    try {
      await companyService.removeApplication({
        jobId: jobDetails._id,
        applicantId: applicantProfile._id,
      });
      fetchApplications();
    } catch (error) {
      console.log("Error removing application:", error);
      alert("Failed to reject applicant. Please try again.");
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
      alert("Failed to shortlist candidate. Please try again.");
    }
  };

  const hireCandidate = async () => {
    try {
      const confirmHire = window.confirm(`Are you sure you want to hire ${name}? This will delete the application.`);
      if (!confirmHire) return;
      
      await companyService.hireCandidate({
        jobId: jobDetails._id,
        applicantId: applicantProfile._id,
      });
      alert(`${name} has been hired successfully!`);
      fetchApplications();
    } catch (error) {
      console.log("Error hiring candidate:", error);
      alert("Failed to hire candidate. Please try again.");
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
      alert("Failed to remove from shortlist. Please try again.");
    }
  };

  const requestToChat = async () => {
    try {
      await messageService.sendChatRequest({
        applicantId: applicantProfile._id,
        jobId: jobDetails._id
      });
      alert(`Chat request sent to ${name}! They will be notified in their messages section.`);
    } catch (error) {
      console.log("Error sending chat request:", error);
      alert("Failed to send chat request. Please try again.");
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
              alt={`${name}'s profile`}
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
              <span>{yearsOfExperience || 0} Years Experience</span>
              {address?.country && (
                <>
                  <span>•</span>
                  <span className="capitalize">{address.country}</span>
                </>
              )}
            </div>
            <div className="mt-1">
              <span className="inline-block bg-white/20 text-white px-2 py-1 rounded-full text-xs font-medium">
                Applied {appliedAt ? formatDate(appliedAt) : 'Recently'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Information */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-briefcase text-primary"></i>
          <span className="font-semibold text-text-primary">Applied for:</span>
        </div>
        <p className="text-text-secondary font-medium">{jobDetails?.title || 'Unknown Position'}</p>
        {coverLetter && (
          <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
            <p className="text-xs text-text-secondary mb-1">Cover Letter:</p>
            <p className="text-sm text-text-primary line-clamp-2">{coverLetter}</p>
          </div>
        )}
      </div>

      {/* Bio Section */}
      {bio && (
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-user text-primary"></i>
            <span className="font-semibold text-text-primary">Bio</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{bio}</p>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-code text-primary"></i>
            <span className="font-semibold text-text-primary">Skills</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 5).map((skill, index) => (
              <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="text-text-secondary text-xs">+{skills.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Experience */}
      {workExperience && workExperience.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-building text-primary"></i>
            <span className="font-semibold text-text-primary">Recent Experience</span>
          </div>
          {workExperience.slice(0, 2).map((exp, index) => (
            <div key={index} className="flex gap-3 mb-3 last:mb-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-200 flex items-center justify-center bg-neutral-50">
                  <img
                    src={exp.company?.logoUrl || "https://via.placeholder.com/40?text=Co"}
                    alt={exp.company?.name || 'Company'}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/40?text=Co";
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary text-sm">{exp.jobTitle}</p>
                <p className="text-text-secondary text-xs">{exp.company?.name || 'Company'}</p>
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
            <span className="font-semibold text-text-primary">Education</span>
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
                title="LinkedIn Profile"
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
                title="Download Resume"
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
              View Profile
            </button>

            {isShortlisted ? (
              <>
                <button
                  onClick={hireCandidate}
                  className="py-2 px-3 bg-success text-white text-xs font-medium rounded-lg hover:bg-success/80 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-check"></i>
                  Hire
                </button>
                <button
                  onClick={removeShortlistedCandidate}
                  className="py-2 px-3 bg-error text-white text-xs font-medium rounded-lg hover:bg-error/80 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-times"></i>
                  Remove
                </button>
                <button
                  onClick={requestToChat}
                  className="py-2 px-3 bg-secondary text-white text-xs font-medium rounded-lg hover:bg-secondary-dark transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-comments"></i>
                  Chat
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={removeApplicant}
                  className="py-2 px-3 bg-neutral-300 text-text-primary text-xs font-medium rounded-lg hover:bg-neutral-400 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-times"></i>
                  Reject
                </button>
                <button
                  onClick={shortlistCandidate}
                  className="py-2 px-3 bg-warning text-white text-xs font-medium rounded-lg hover:bg-warning/80 transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-star"></i>
                  Shortlist
                </button>
                <button
                  onClick={requestToChat}
                  className="py-2 px-3 bg-secondary text-white text-xs font-medium rounded-lg hover:bg-secondary-dark transition-colors flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-comments"></i>
                  Chat
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
