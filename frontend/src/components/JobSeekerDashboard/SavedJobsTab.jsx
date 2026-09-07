import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { jobService } from '../../services/jobService';
import { Link } from 'react-router-dom';

function SavedJobsTab() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await userService.getSavedJobs();
      setSavedJobs(response?.data || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      setSavedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedJob = async (jobId) => {
    try {
      await userService.removeSavedJob(jobId);
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
    } catch (error) {
      console.error('Error removing saved job:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <i className="fas fa-bookmark text-2xl text-text-secondary"></i>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No Saved Jobs</h3>
          <p className="text-text-secondary mb-6">Save jobs that interest you to review them later.</p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors"
          >
            <i className="fas fa-search mr-2"></i>
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saved Jobs Summary */}
      <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Saved Jobs</h2>
            <p className="text-sm text-neutral-500 mt-1">
              You have {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{savedJobs.length}</div>
            <div className="text-sm text-neutral-500">Total Saved</div>
          </div>
        </div>
      </div>

      {/* Saved Jobs Grid */}
      <div className="grid gap-6">
        {savedJobs.map((job) => (
          <div key={job._id} className="bg-white rounded-lg shadow-md border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Company Logo */}
                  <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {job.company?.logo ? (
                      <img src={job.company.logo} alt={job.company?.name || 'Company'} className="w-8 h-8 rounded" />
                    ) : (
                      <i className="fas fa-building text-neutral-400"></i>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {job.title}
                    </h3>
                    
                    <p className="text-md text-neutral-700 mb-3">
                      {job.company?.name || job.company || 'Company Not Specified'}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-4">
                      <span className="flex items-center">
                        <i className="fas fa-map-marker-alt mr-1 text-neutral-400"></i>
                        {job.location || 'Location not specified'}
                      </span>
                      
                      <span className="flex items-center">
                        <i className="fas fa-briefcase mr-1 text-neutral-400"></i>
                        {job.jobType || 'Full-time'}
                      </span>
                      
                      <span className="flex items-center">
                        <i className="fas fa-clock mr-1 text-neutral-400"></i>
                        {job.experienceLevel || 'Experience level not specified'}
                      </span>
                      
                      {job.salaryRange && (
                        <span className="flex items-center">
                          <i className="fas fa-dollar-sign mr-1 text-neutral-400"></i>
                          {job.salaryRange.min} - {job.salaryRange.max} {job.salaryRange.currency}
                        </span>
                      )}
                    </div>
                    
                    {/* Job Description Preview */}
                    {job.description && (
                      <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
                        {job.description.substring(0, 150)}...
                      </p>
                    )}
                    
                    {/* Skills Tags */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requiredSkills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 5 && (
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full">
                            +{job.requiredSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-neutral-500">
                      Saved on {new Date(job.savedAt || job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  <Link
                    to={`/jobs/${job._id}`}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors"
                  >
                    <i className="fas fa-eye mr-2"></i>
                    View Job
                  </Link>
                  
                  <button
                    onClick={() => handleRemoveSavedJob(job._id)}
                    className="inline-flex items-center px-4 py-2 bg-error/10 text-error text-sm font-medium rounded-md hover:bg-error/20 transition-colors"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Remove
                  </button>
                </div>
              </div>
            </div>
            
            {/* Job Footer */}
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 rounded-b-lg">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                {job.applicants && (
                  <span>{job.applicants.length} applicant{job.applicants.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SavedJobsTab;