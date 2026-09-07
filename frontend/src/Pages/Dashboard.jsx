import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

function Dashboard() {
  const { userData } = useSelector((store) => store.auth);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'Profile';
    if (path.includes('/jobs')) return 'Job Search';
    if (path.includes('/applications')) return 'My Applications';
    return 'Dashboard';
  };

  const getPageContent = () => {
    const path = location.pathname;
    
    if (path.includes('/profile')) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Name</label>
              <p className="mt-1 text-sm text-neutral-900">{userData?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Email</label>
              <p className="mt-1 text-sm text-neutral-900">{userData?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Role</label>
              <p className="mt-1 text-sm text-neutral-900">{userData?.role}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (path.includes('/jobs')) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Job Search</h2>
          <p className="text-neutral-600">Find your next opportunity here.</p>
        </div>
      );
    }
    
    if (path.includes('/applications')) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">My Applications</h2>
          <p className="text-neutral-600">Track your job applications here.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Profile Completion</h3>
          <p className="text-neutral-600">Complete your profile to attract employers.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Job Recommendations</h3>
          <p className="text-neutral-600">Discover jobs that match your skills.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Application Status</h3>
          <p className="text-neutral-600">Track your application progress.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-16">
      {/* Dashboard Sidebar */}
      <div className="flex">
        <div className="w-64 bg-white shadow-md min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-neutral-800">Job Seeker</h2>
            <p className="text-sm text-neutral-600">Welcome, {userData?.name}</p>
          </div>
          
          <nav className="mt-6">
            <a 
              href="/jobseeker/profile" 
              className={`block px-6 py-3 text-sm font-medium transition-colors ${
                location.pathname === '/jobseeker/profile' 
                  ? 'bg-primary text-white' 
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Profile
            </a>
            <a 
              href="/jobseeker/jobs" 
              className={`block px-6 py-3 text-sm font-medium transition-colors ${
                location.pathname === '/jobseeker/jobs' 
                  ? 'bg-primary text-white' 
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Find Jobs
            </a>
            <a 
              href="/jobseeker/applications" 
              className={`block px-6 py-3 text-sm font-medium transition-colors ${
                location.pathname === '/jobseeker/applications' 
                  ? 'bg-primary text-white' 
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              My Applications
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900">{getPageTitle()}</h1>
          </div>
          
          {getPageContent()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;