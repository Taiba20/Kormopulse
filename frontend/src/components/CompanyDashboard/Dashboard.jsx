import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Button,
} from "@tremor/react";

import { companyService } from "../../services/companyService";
import { messageService } from "../../services/messageService";

function Dashboard() {
  const [jobData, setJobData] = useState([]);
  const [applicants, setApplicants] = useState(0);
  const [closedJobs, setClosedJobs] = useState(0);
  const [recentApplications, setRecentApplications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const { userData } = useSelector((store) => store.auth);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsResponse, , unreadResponse] = await Promise.allSettled([
        companyService.getMyJobs(),
        messageService.getMyMessages({ limit: 5 }),
        messageService.getUnreadMessageCount()
      ]);

      // Handle jobs data
      const jobs = jobsResponse.status === 'fulfilled' ? jobsResponse.value?.jobs || [] : [];
      setJobData(jobs);
      
      // Calculate total applicants from all jobs
      const totalApplicants = jobs.reduce((total, job) => {
        return total + (job.applicants ? job.applicants.length : 0);
      }, 0);
      setApplicants(totalApplicants);

      // Calculate closed/inactive jobs
      const inactiveJobs = jobs.filter(job => job.isActive === false).length;
      setClosedJobs(inactiveJobs);

      // Get recent applications across all jobs
      const allApplications = jobs.reduce((acc, job) => {
        if (job.applicants && job.applicants.length > 0) {
          const jobApplications = job.applicants.map(app => ({
            ...app,
            jobTitle: job.title,
            jobId: job._id
          }));
          return [...acc, ...jobApplications];
        }
        return acc;
      }, []);
      
      // Sort by most recent and take first 5
      const sortedApplications = allApplications.sort((a, b) => 
        new Date(b.createdAt || b.appliedAt) - new Date(a.createdAt || a.appliedAt)
      );
      setRecentApplications(sortedApplications.slice(0, 5));

      // Handle messages
      const unreadCount = unreadResponse.status === 'fulfilled' ? unreadResponse.value?.data?.unreadCount || 0 : 0;
      setUnreadMessages(unreadCount);

    } catch (error) {
      console.log(error);
      // Set empty array on error to prevent crashes
      setJobData([]);
      setApplicants(0);
      setClosedJobs(0);
      setRecentApplications([]);
      setUnreadMessages(0);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const redirectToDetail = (id) => {
    navigate(`/job-management/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userData?.userProfile?.companyName || userData?.name}!
        </h1>
        <p className="text-gray-600">Manage your recruitment process and track applications.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-full h-12 w-12 p-2 bg-[var(--color-success)] flex justify-center items-center text-[var(--color-text-inverse)]">
              <i className="fa-solid fa-briefcase text-lg"></i>
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-semibold text-xl text-gray-900">{Array.isArray(jobData) ? jobData.length : 0}</p>
              <p className="text-sm text-gray-500">Active Jobs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-full h-12 w-12 p-2 bg-[var(--color-primary)] flex justify-center items-center text-[var(--color-text-inverse)]">
              <i className="fa-solid fa-users text-lg"></i>
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-semibold text-xl text-gray-900">{applicants}</p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-full h-12 w-12 p-2 bg-[var(--color-warning)] flex justify-center items-center text-[var(--color-text-inverse)]">
              <i className="fa-regular fa-rectangle-xmark text-lg"></i>
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-semibold text-xl text-gray-900">{closedJobs}</p>
              <p className="text-sm text-gray-500">Closed Jobs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="rounded-full h-12 w-12 p-2 bg-primary flex justify-center items-center text-white">
              <i className="fa-solid fa-envelope text-lg"></i>
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-semibold text-xl text-gray-900">{unreadMessages}</p>
              <p className="text-sm text-gray-500">New Messages</p>
            </div>
          </div>
        </div>

        <Link to="/dashboard/post-job">
          <div className="bg-[var(--color-text-primary)] hover:bg-gray-800 transition-colors rounded-xl border shadow-md p-4 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="rounded-full h-12 w-12 p-2 bg-[var(--color-background)] flex justify-center items-center text-[var(--color-text-primary)]">
                <i className="fa-solid fa-plus text-lg"></i>
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-semibold text-lg text-[var(--color-text-inverse)]">Post a Job</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Applications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
            <Link
              to="/dashboard/applications"
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              View All
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-inbox text-3xl mb-4 text-gray-300"></i>
              <p>No recent applications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((application, index) => (
                <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {application.applicant?.name || 'Applicant'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Applied for: {application.jobTitle}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>{new Date(application.createdAt || application.appliedAt).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          application.status === 'pending' ? 'bg-warning/10 text-warning' :
                          application.status === 'shortlisted' ? 'bg-success/10 text-success' :
                          application.status === 'rejected' ? 'bg-error/10 text-error' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {application.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => redirectToDetail(application.jobId)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/dashboard/post-job"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg mr-3">
                <i className="fas fa-plus text-primary"></i>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Post New Job</h4>
                <p className="text-sm text-gray-500">Create a new job listing</p>
              </div>
            </Link>

            <Link
              to="/dashboard/applications"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-success/10 rounded-lg mr-3">
                <i className="fas fa-users text-success"></i>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Review Applications</h4>
                <p className="text-sm text-gray-500">Manage candidate applications</p>
              </div>
            </Link>

            <Link
              to="/dashboard/messages"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-warning/10 rounded-lg mr-3">
                <i className="fas fa-envelope text-warning"></i>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Messages</h4>
                <p className="text-sm text-gray-500">Communicate with candidates</p>
              </div>
            </Link>

            <Link
              to="/dashboard/profile"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-success/10 rounded-lg mr-3">
                <i className="fas fa-building text-success"></i>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Company Profile</h4>
                <p className="text-sm text-gray-500">Update company information</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Job Listings Table */}
      <Card>
        <h3 className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold text-lg mb-4">
          Your Job Listings
        </h3>
        <Table className="mt-2">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Job Title</TableHeaderCell>
              <TableHeaderCell>Applications</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Posted Date</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(jobData) && jobData.length > 0 ? (
              jobData.map((job, index) => (
                <TableRow key={index}>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>
                    <span className="font-medium">{job?.applicants?.length || 0}</span>
                  </TableCell>
                  <TableCell>
                    <Badge color={job.isActive !== false ? "emerald" : "red"}>
                      {job.isActive !== false ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      color="black"
                      onClick={() => redirectToDetail(job._id)}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  {Array.isArray(jobData) ? "No jobs posted yet" : "Loading jobs..."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default Dashboard;
