import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { messageService } from '../../services/messageService';
import { Link } from 'react-router-dom';

function OverviewTab() {
  const [stats, setStats] = useState({
    applications: 0,
    savedJobs: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    unreadMessages: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [applicationsResponse, savedJobsResponse, messagesResponse, unreadResponse] = await Promise.allSettled([
        userService.getMyApplications(),
        userService.getSavedJobs(),
        messageService.getMyMessages({ limit: 5 }),
        messageService.getUnreadMessageCount()
      ]);

      const applications = applicationsResponse.status === 'fulfilled' ? applicationsResponse.value?.data || [] : [];
      const savedJobs = savedJobsResponse.status === 'fulfilled' ? savedJobsResponse.value?.data || [] : [];
      const messages = messagesResponse.status === 'fulfilled' ? messagesResponse.value?.data?.messages || [] : [];
      const unreadCount = unreadResponse.status === 'fulfilled' ? unreadResponse.value?.data?.unreadCount || 0 : 0;

      // Calculate stats
      setStats({
        applications: applications.length,
        savedJobs: savedJobs.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        shortlistedApplications: applications.filter(app => app.status === 'shortlisted').length,
        unreadMessages: unreadCount
      });

      // Set recent data
      setRecentApplications(applications.slice(0, 3));
      setRecentMessages(messages.slice(0, 3));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-warning/10 text-warning';
      case 'reviewed': return 'bg-primary/10 text-primary';
      case 'shortlisted': return 'bg-success/10 text-success';
      case 'rejected': return 'bg-error/10 text-error';
      case 'hired': return 'bg-success/10 text-success';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/90 to-primary-light/90 rounded-lg p-6 text-white mb-6">
        <h1 className="text-2xl font-bold mb-2">Welcome to Your Dashboard!</h1>
        <p className="text-text-inverse/80">Track your job search progress and stay organized.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border border-neutral-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[var(--color-primary)] text-white">
              <i className="fas fa-paper-plane text-lg"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-neutral-900">{stats.applications}</h3>
              <p className="text-sm text-neutral-600">Applications</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[var(--color-success)] text-white">
              <i className="fas fa-bookmark text-lg"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">{stats.savedJobs}</h3>
              <p className="text-sm text-gray-600">Saved Jobs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[var(--color-warning)] text-white">
              <i className="fas fa-clock text-lg"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">{stats.pendingApplications}</h3>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success text-white">
              <i className="fas fa-check-circle text-lg"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">{stats.shortlistedApplications}</h3>
              <p className="text-sm text-gray-600">Shortlisted</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-error text-white">
              <i className="fas fa-envelope text-lg"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">{stats.unreadMessages}</h3>
              <p className="text-sm text-gray-600">New Messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <Link
                to="/jobseeker/applications"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-paper-plane text-3xl mb-4 text-gray-300"></i>
                <p className="mb-4">No applications yet</p>
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                  <i className="fas fa-search mr-2"></i>
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {application.job?.title || 'Job Title'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {application.job?.company?.name || application.job?.company || 'Company'}
                        </p>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">
                            {new Date(application.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {application.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
              <Link
                to="/messages"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-envelope text-3xl mb-4 text-gray-300"></i>
                <p>No messages yet</p>
                <p className="text-sm mt-2">Messages from employers will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div key={message._id} className={`border rounded-lg p-4 hover:bg-neutral-50 transition-colors ${!message.isRead ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {message.subject || 'New Message'}
                          </h3>
                          {!message.isRead && (
                            <span className="bg-error text-white text-xs px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          From: {message.from?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {message.content?.substring(0, 80)}...
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/jobs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-primary/10 rounded-lg mr-3">
              <i className="fas fa-search text-primary"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Find Jobs</h3>
              <p className="text-sm text-gray-500">Browse available positions</p>
            </div>
          </Link>

          <Link
            to="/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-success/10 rounded-lg mr-3">
              <i className="fas fa-user text-success"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-500">Keep your profile current</p>
            </div>
          </Link>

          <Link
            to="/saved-jobs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-warning/10 rounded-lg mr-3">
              <i className="fas fa-bookmark text-warning"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Saved Jobs</h3>
              <p className="text-sm text-gray-500">Review your saved positions</p>
            </div>
          </Link>

          <Link
            to="/companies"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-success/10 rounded-lg mr-3">
              <i className="fas fa-building text-success"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Companies</h3>
              <p className="text-sm text-gray-500">Explore companies</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;