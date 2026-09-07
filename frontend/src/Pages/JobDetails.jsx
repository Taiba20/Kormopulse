import React, { useState, useEffect } from "react";
import JobDetailsCard from "../components/JobDetails/JobDetailsCard";
import SimilerJobsSidebar from "../components/JobDetails/SimilerJobsSidebar";
import { contentService } from "../services/contentService";
import { useParams } from "react-router-dom";
import JobDescription from "../components/JobDetails/JobDescription";
import DisclaimerBanner from "../components/Common/DisclaimerBanner";

function JobDetails() {
  const [jobData, setJobData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const getDetails = async (id) => {
    if (!id) {
      setError("Job ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching job details for ID:', id);
      
      const res = await contentService.getSingleJob(id);
      console.log('Job details response:', res);
      
      if (res && res.data) {
        setJobData(res.data);
      } else if (res) {
        // Handle direct response without .data wrapper
        setJobData(res);
      } else {
        setError("No job data received");
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError(error.response?.data?.message || "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      getDetails(id);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="mt-16 bg-neutral-50 min-h-screen">
        <DisclaimerBanner />
        <div className="px-5 md:px-10 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-neutral-600">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16 bg-neutral-50 min-h-screen">
        <DisclaimerBanner />
        <div className="px-5 md:px-10 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-error text-lg mb-4">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Error Loading Job
            </div>
            <p className="text-neutral-600 mb-4">{error}</p>
            <button 
              onClick={() => getDetails(id)}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 bg-neutral-50 min-h-screen">
      <DisclaimerBanner />
      <div className="px-5 md:px-10 flex gap-6 lg:gap-8 flex-col lg:flex-row py-6">
        {/* Left */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <JobDetailsCard jobData={jobData} />
          <JobDescription jobData={jobData} />
        </div>
        {/* Right */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-6">
            <SimilerJobsSidebar currentJobId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;
