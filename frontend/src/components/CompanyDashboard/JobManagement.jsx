import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { companyService } from "../../services/companyService";

function JobManagement() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobDetails = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/jobs/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const jobData = await response.json();
        setJob(jobData);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  }, [jobId]);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await companyService.getJobApplications(jobId);
      setApplications(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    const loadData = async () => {
      await fetchJobDetails();
      await fetchApplications();
    };
    loadData();
  }, [fetchJobDetails, fetchApplications]);

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const response = await fetch(`http://localhost:3000/api/jobs/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchApplications(); // Refresh applications
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-20">
      {/* Job Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </button>
        
        {job && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-gray-600 mb-4">{job.company}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span><i className="fas fa-map-marker-alt mr-1"></i>{job.location}</span>
              <span><i className="fas fa-clock mr-1"></i>{job.jobType}</span>
              <span><i className="fas fa-dollar-sign mr-1"></i>{job.salaryRange?.min} - {job.salaryRange?.max} {job.salaryRange?.currency}</span>
            </div>
          </div>
        )}
      </div>

      {/* Applications Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Applications ({applications.length})</h2>
        
        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-inbox text-4xl mb-4"></i>
            <p>No applications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {application.applicant?.name || 'Unknown Applicant'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {application.applicant?.email}
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      {application.coverLetter}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                      {application.applicant?.skills && (
                        <span>Skills: {application.applicant.skills.slice(0, 3).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                    
                    <div className="flex space-x-2">
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'reviewed')}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'shortlisted')}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            Shortlist
                          </button>
                        </>
                      )}
                      
                      {application.status === 'reviewed' && (
                        <>
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'shortlisted')}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'rejected')}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {application.applicant?.resume && (
                        <a
                          href={application.applicant.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                        >
                          Resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobManagement;