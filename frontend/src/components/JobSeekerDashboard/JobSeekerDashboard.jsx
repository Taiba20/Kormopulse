import React from "react";
import { Routes, Route } from "react-router-dom";
import JobSeekerSidebar from "./JobSeekerSidebar";
import OverviewTab from "./OverviewTab";
import ApplicationsTab from "./ApplicationsTab";
import SavedJobsTab from "./SavedJobsTab";

function JobSeekerDashboard() {
  return (
    <div className="min-h-screen bg-background-secondary pt-16">
      <div className="flex">
        <JobSeekerSidebar />
        
        <div className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<OverviewTab />} />
            <Route path="/applications" element={<ApplicationsTab />} />
            <Route path="/saved-jobs" element={<SavedJobsTab />} />
            <Route index element={<OverviewTab />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default JobSeekerDashboard;