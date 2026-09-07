import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import LogoSlider from "../components/Home/LogoSlider";
import JobSeekers from "../components/Home/JobSeekers";
import Hero from "../components/Home/Hero";
import HomeStats from "../components/Home/HomeStats";
import DemoProgress from "../components/Home/DemoProgress";
import HomeRecruiters from "../components/Home/HomeRecruiters";
import Footer from "../components/Home/Footer";

function Home() {
  const { userData } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if user just logged in (came from login page) or on app initialization
    // Allow logged-in users to access home page directly
    const cameFromLogin = location.state?.fromLogin;
    const isAppInitialization = !location.state;
    
    if (userData && (cameFromLogin || isAppInitialization)) {
      if (userData.role === "jobSeeker" && (userData.jobSeekerProfile || userData.userProfile?.doneOnboarding)) {
        navigate("/jobseeker/profile", { replace: true });
      } else if (userData.role === "employer" && (userData.companyProfile || userData.userProfile?.doneOnboarding)) {
        navigate("/dashboard/home", { replace: true });
      }
    }
  }, [userData, navigate, location]);

  return (
    <div className="font-Poppins justify-center items-center">
      <Hero />
      <HomeStats />
      <DemoProgress />
      <LogoSlider />
      <JobSeekers />
      <HomeRecruiters />
      <Footer />
    </div>
  );
}

export default Home;
