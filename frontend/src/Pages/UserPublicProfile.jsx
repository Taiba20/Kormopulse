import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { userService } from "../services/userService";

function UserPublicProfile() {
  const { id } = useParams();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      getUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userService.getPublicProfile(id);
      console.log("Public profile response:", res);
      setUserDetails(res.data || res);
    } catch (error) {
      console.error("Error fetching public profile:", error);
      setError(error.response?.data?.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 mt-[3.5rem]">
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-secondary">Loading profile...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">😞</div>
          <h3 className="text-lg font-medium text-text-primary mb-2">Profile Not Found</h3>
          <p className="text-text-secondary">{error}</p>
        </div>
      ) : !userDetails ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No Profile Data</h3>
          <p className="text-text-secondary">This user's profile is not available.</p>
        </div>
      ) : (
      <div className="p-8 bg-white rounded-xl shadow-lg w-10/12 mt-7 border border-neutral-200">
        <img
          className="w-24 h-24 mx-auto rounded-full border-4 border-primary shadow-md"
          src={userDetails?.userProfile?.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}
          alt="Profile"
          onError={(e) => {
            e.target.src = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
          }}
        />
        <h2 className="mt-4 text-2xl font-semibold text-center text-text-primary">
          {userDetails?.userProfile?.name}
        </h2>
        <div className="text-xs font-medium text-text-secondary flex gap-1.5 items-center justify-center">
          <span>
            {userDetails?.userProfile?.yearsOfExperience || 0} Years of exp
          </span>

          <div className="h-1 w-1 bg-primary rounded-full"></div>
          {userDetails?.userProfile?.address?.country && (
            <span className="capitalize ">
              {userDetails?.userProfile?.address?.country}
            </span>
          )}
        </div>
        <span className="flex gap-3 text-primary justify-center my-2 text-lg hover:cursor-pointer">
          {userDetails?.userProfile?.socialProfiles?.github && (
            <a
              href={userDetails?.userProfile?.socialProfiles?.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-dark transition-colors duration-200"
            >
              <i className="fa-brands fa-square-github"></i>
            </a>
          )}
          {userDetails?.userProfile?.socialProfiles?.twitter && (
            <a
              href={userDetails?.userProfile?.socialProfiles?.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-dark transition-colors duration-200"
            >
              <i className="fa-brands fa-square-x-twitter"></i>
            </a>
          )}
          {userDetails?.userProfile?.socialProfiles?.portfolioWebsite && (
            <a
              href={userDetails?.userProfile?.socialProfiles?.portfolioWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-dark transition-colors duration-200"
            >
              <i className="fa-solid fa-globe"></i>
            </a>
          )}
        </span>
        <h3 className="text-center my-2 font-semibold text-primary">About</h3>
        <p className="mt-2 text-center md:px-10 my-10 text-text-primary leading-relaxed">
          {userDetails?.userProfile?.bio}
        </p>

        {userDetails?.userProfile?.workExperience.length > 0 && (
          <div>
            <h3 className="text-primary font-semibold mb-4">Work Experience</h3>

            {userDetails?.userProfile?.workExperience.map((exp, index) => (
              <div
                key={index}
                className="shadow-md rounded-lg p-4 w-full md:w-3/5 my-4 border border-neutral-200 bg-neutral-50 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex gap-5 items-center mb-5">
                  <div className="h-16 w-16 rounded-lg overflow-hidden border-2 border-neutral-300 p-1.5 flex justify-center items-center bg-white">
                    <img src={exp.company.logoUrl} alt="Company Logo" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{exp.jobTitle}</p>
                    <p className="text-sm text-primary font-medium">{exp.company.name}</p>
                    <p className="text-sm text-text-secondary font-medium">
                      {exp.startMonth && exp.endMonth
                        ? `${formatDate(exp.startMonth)} to ${formatDate(
                            exp.endMonth
                          )} - ${calculateDuration(
                            exp.startMonth,
                            exp.endMonth
                          )}`
                        : null}
                    </p>
                  </div>
                </div>
                {exp.description && (
                  <p className="text-justify text-sm text-text-primary leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {userDetails?.userProfile?.education?.length > 0 && (
          <div>
            <h3 className="text-primary font-semibold mb-4">Education</h3>
            {userDetails?.userProfile?.education.map((edu) => (
              <div
                key={edu._id}
                className="border-2 border-neutral-200 p-4 bg-neutral-50 flex flex-col gap-3 rounded-lg w-full md:w-3/5 my-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between">
                  <div className="flex gap-6 text-sm">
                    <div className="h-12 w-12 overflow-hidden border-2 border-neutral-300 rounded-md p-1 bg-white">
                      <img
                        src="https://wellfound.com/images/shared/nopic_college.png"
                        alt="Institution Logo"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-text-primary">{edu.institution}</p>
                      <p className="text-primary font-medium">
                        {edu.fieldOfStudy}, {edu.degree}
                      </p>
                      <p className="text-text-secondary text-sm">
                        {formatDate(edu.startYear + "-01")} to{" "}
                        {formatDate(edu.endYear + "-01")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {userDetails?.userProfile?.skills?.length > 0 && (
          <div>
            <h3 className="text-primary font-semibold mb-4">Skills</h3>
            <div className="flex gap-3 flex-wrap my-4">
              {userDetails?.userProfile?.skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-primary to-primary-light text-white shadow-md py-2 px-4 rounded-full my-1 text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

export default UserPublicProfile;
