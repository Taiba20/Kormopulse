import React, { useEffect, useState } from "react";
import ApplicantsCard from "./ApplicantsCard";
import SelectInput from "../Common/FormComponents/SelectInput";
import { companyService } from "../../services/companyService";

function Shortlisted() {
  const [sortValue, setSortValue] = useState("latest value");
  const sortOptions = [
    { value: "experience", label: "Experience" },
    { value: "date", label: "Application Date" },
  ];

  const handleSortChange = (event) => {
    setSortValue(event.target.value);
  };

  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      console.log("=== Shortlisted: fetchApplications called ===");
      const res = await companyService.getAllApplications({ status: 'shortlisted' });
      console.log("Shortlisted API Response received:", res);
      console.log("Shortlisted applications array:", res?.applications);
      console.log("Shortlisted applications length:", res?.applications?.length || 0);
      
      // Handle the response structure: { applications, pagination }
      // Map the backend response to match frontend expectations
      const applications = (res?.applications || []).map(app => ({
        applicantProfile: app.applicantProfile, // Backend now sends properly formatted applicantProfile
        jobDetails: app.jobDetails, // Backend now sends properly formatted jobDetails
        status: app.status,
        appliedAt: app.appliedAt,
        coverLetter: app.coverLetter,
        resume: app.resume
      }));
      
      console.log("Mapped shortlisted applications:", applications);
      setShortlistedCandidates(Array.isArray(applications) ? applications : []);
    } catch (error) {
      console.log("Error fetching shortlisted applications:", error);
      console.error("Full error:", error);
      setShortlistedCandidates([]);
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
        <span>Shortlisted Candidates</span>
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
        {Array.isArray(shortlistedCandidates) && shortlistedCandidates.length > 0 ? (
          shortlistedCandidates.map((applicant, index) => (
            <ApplicantsCard
              key={index}
              data={applicant}
              isShortlisted={true}
              fetchApplications={fetchApplications}
            />
          ))
        ) : (
          <p className="text-center font-medium">
            {loading ? "Loading shortlisted candidates..." : "No shortlisted candidates found."}
          </p>
        )}
      </div>
    </div>
  );
}

export default Shortlisted;
