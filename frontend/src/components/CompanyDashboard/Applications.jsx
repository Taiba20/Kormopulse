import React, { useEffect, useState } from "react";
import ApplicantsCard from "./ApplicantsCard";
import SelectInput from "../Common/FormComponents/SelectInput";
import { companyService } from "../../services/companyService.js";
function Applications() {
  const [sortValue, setSortValue] = useState("latest value");
  const sortOptions = [
    { value: "experience", label: "Experience" },
    { value: "date", label: "Application Date" },
  ];

  const handleSortChange = (event) => {
    setSortValue(event.target.value);
  };

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("useEffect triggered - fetching applications");
    fetchApplications();
  }, []); // Empty dependency array to only run on mount

  const fetchApplications = async () => {
    setLoading(true);
    try {
      console.log("=== Frontend: fetchApplications called ===");
      const res = await companyService.getAllApplications({ status: 'all' }); // Get all applications to see what statuses they have
      console.log("API Response received:", res);
      console.log("Applications array:", res?.applications);
      console.log("Applications length:", res?.applications?.length || 0);
      console.log("Raw response structure:", Object.keys(res || {}));
      
      // Handle the response structure: { applications, pagination }
      // Map the backend response to match frontend expectations
      const allApplications = (res?.applications || []).map(app => ({
        applicantProfile: app.applicantProfile, // Backend now sends properly formatted applicantProfile
        jobDetails: app.jobDetails, // Backend now sends properly formatted jobDetails
        status: app.status,
        appliedAt: app.appliedAt,
        coverLetter: app.coverLetter,
        resume: app.resume
      }));
      
      // Filter to show only pending/applied applications (not shortlisted, hired, or rejected)
      const applications = allApplications.filter(app => 
        app.status === 'pending' || app.status === 'applied' || app.status === 'reviewed'
      );
      
      console.log("All applications:", allApplications.length);
      console.log("Filtered applications (active):", applications.length);
      console.log("Application statuses:", allApplications.map(app => app.status));
      setApplicants(Array.isArray(applications) ? applications : []);
    } catch (error) {
      console.log("Error fetching applications:", error);
      console.error("Full error details:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      setApplicants([]);
    }
    finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen ">
        Loading...
      </div>
    );
  }

  return (
    <div className="py-3 px-2 md:px-8 lg:px-20 pt-20">
      <div className="font-medium text-2xl my-5 flex flex-col md:flex-row gap-3 justify-between md:items-center ml-5 md:ml-0">
        <span>Applications</span>
        <div className="flex items-center gap-3">
          <span className="text-sm">Sort by</span>
          <SelectInput
            options={sortOptions}
            value={sortValue}
            onChange={handleSortChange}
          />
        </div>
      </div>
      <div className="border rounded p-1.5 md:p-5 flex flex-col gap-5">
        {Array.isArray(applicants) && applicants.length > 0 ? (
          applicants.map((applicant, index) => (
            <ApplicantsCard
              key={index}
              data={applicant}
              isShortlisted={false}
              fetchApplications={fetchApplications}
            />
          ))
        ) : (
          <p className="text-center w font-medium">
            {loading ? "Loading applications..." : "No applicants found."}
          </p>
        )}
      </div>
    </div>
  );
}

export default Applications;
