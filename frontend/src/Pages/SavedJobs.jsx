import React from 'react';
import SavedJobsTab from '../components/JobSeekerDashboard/SavedJobsTab';

function SavedJobs() {
  return (
    <div className="min-h-screen bg-background-secondary pt-16">
      <div className="container mx-auto px-4 py-8">
        <SavedJobsTab />
      </div>
    </div>
  );
}

export default SavedJobs;
