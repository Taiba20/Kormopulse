import React, { useState, useEffect } from "react";
import SimilerJobCard from "./SimilerJobCard";
import { contentService } from "../../services/contentService";

function SimilerJobsSidebar({ currentJobId }) {
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilarJobs = async () => {
      try {
        setLoading(true);
        console.log('Fetching similar jobs for job ID:', currentJobId);
        
        // Fetch jobs excluding the current job
        const response = await contentService.getJobs({
          limit: 5,
          exclude: currentJobId
        });

        console.log('Similar jobs response:', response);
        
        if (response?.success && response?.data?.jobs) {
          setSimilarJobs(response.data.jobs.slice(0, 3)); // Take only 3 jobs
        } else {
          setSimilarJobs([]);
        }
      } catch (err) {
        console.error('Error fetching similar jobs:', err);
        setError('Failed to load similar jobs');
        setSimilarJobs([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentJobId) {
      fetchSimilarJobs();
    }
  }, [currentJobId]);

  if (loading) {
    return (
      <div className="border border-neutral-200 bg-background rounded-3xl p-5 flex flex-col gap-5 shadow-md">
        <div>
          <h3 className="font-medium text-text-primary">Jobs you might be interested in</h3>
        </div>
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="border-b border-neutral-200 pb-3 p-2">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-14 w-14 bg-neutral-200 rounded-3xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-background rounded-3xl p-5 flex flex-col gap-5 shadow-md">
      <div>
        <h3 className="font-medium text-text-primary">Jobs you might be interested in</h3>
      </div>
      <div className="flex flex-col gap-5">
        {error ? (
          <div className="text-center py-4">
            <p className="text-text-secondary text-sm">{error}</p>
          </div>
        ) : similarJobs.length > 0 ? (
          similarJobs.map((job) => (
            <SimilerJobCard key={job._id} jobData={job} />
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-text-secondary text-sm">No similar jobs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimilerJobsSidebar;
