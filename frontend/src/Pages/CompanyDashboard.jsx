import React from "react";
import DashboardSidebar from "../components/UserOnboarding/DashboardSidebar";
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../components/CompanyDashboard/Dashboard";
import Applications from "../components/CompanyDashboard/Applications";
import Shortlisted from "../components/CompanyDashboard/Shortlisted";
import CompanyProfile from "../components/CompanyDashboard/CompanyProfile";
import Messages from "../Pages/Messages";
import JobPosting from "./JobPosting";
// import { useSelector } from "react-redux";

function CompanyDashboard() {
  // const { userData } = useSelector((store) => store.auth);
  // Temporarily disabled for design viewing
  // if (userData.role !== "employer") {
  //   return <Navigate to="/" />;
  // }
  return (
    <div className="flex pt-16">
      <aside className="max-w-[64px] xl:w-full xl:max-w-[280px]">
        <DashboardSidebar />
      </aside>
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="home" element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="shortlisted" element={<Shortlisted />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<CompanyProfile />} />
          <Route path="post-job" element={<JobPosting />} />
          <Route path="" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default CompanyDashboard;
