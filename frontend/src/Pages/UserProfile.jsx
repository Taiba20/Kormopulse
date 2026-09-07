import React, { useState } from "react";
import EditProfile from "../components/UserProfile/EditProfile";
import UpdateResume from "../components/UserProfile/UpdateResume";
import ChangePassword from "../components/UserProfile/ChangePassword";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function UserProfile() {
  const { userData } = useSelector((store) => store.auth);
  const [selectedSection, setSelectedSection] = useState("editProfile");
  const navigate = useNavigate();

  if (userData.role === "employer") {
    return <Navigate to="/" />;
  }

  const switchSection = (section) => {
    setSelectedSection(section);
  };

  const openPublicProfile = () => {
    navigate(`/user/${userData._id}`);
  };

  return (
    <div className="mt-20 xl:px-28 px-5 bg-neutral-50 min-h-screen">
      <div>
        <div>
          <h2 className="font-semibold text-4xl text-text-primary">Edit your Kormopulse profile</h2>
        </div>
        <div className="flex flex-col md:flex-row md:justify-between border-b border-neutral-300 mt-10 md:items-center pb-3 md:pb-0">
          <div className="flex gap-6 mb-3 md:mb-0 ">
            <div
              className={`hover:cursor-pointer text-text-secondary transition-colors duration-200 ${
                selectedSection === "editProfile"
                  ? "text-primary font-medium border-b-2 border-primary"
                  : "hover:border-b-2 hover:border-primary-light"
              } pb-3 hover:text-primary`}
              onClick={() => switchSection("editProfile")}
            >
              Profile
            </div>
            <div
              className={`hover:cursor-pointer text-text-secondary transition-colors duration-200 ${
                selectedSection === "resume"
                  ? "text-primary font-medium border-b-2 border-primary"
                  : "hover:border-b-2 hover:border-primary-light"
              } pb-3 hover:text-primary`}
              onClick={() => switchSection("resume")}
            >
              Resume / CV
            </div>
            <div
              className={`hover:cursor-pointer text-text-secondary transition-colors duration-200 ${
                selectedSection === "password"
                  ? "text-primary font-medium border-b-2 border-primary"
                  : "hover:border-b-2 hover:border-primary-light"
              } pb-3 hover:text-primary`}
              onClick={() => switchSection("password")}
            >
              Change Password
            </div>
          </div>

          <div
            className="text-sm font-medium text-primary hover:cursor-pointer hover:text-primary-dark transition-colors duration-200"
            onClick={openPublicProfile}
          >
            View public profile
          </div>
        </div>
      </div>
      <div className="border border-neutral-200 my-5 rounded-lg shadow-sm bg-white">
        {selectedSection === "editProfile" && <EditProfile />}
        {selectedSection === "resume" && <UpdateResume />}
        {selectedSection === "password" && <ChangePassword />}
      </div>
    </div>
  );
}

export default UserProfile;
