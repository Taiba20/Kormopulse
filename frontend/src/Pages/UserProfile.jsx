import React, { useState } from "react";
import EditProfile from "../components/UserProfile/EditProfile";
import UpdateResume from "../components/UserProfile/UpdateResume";
import ChangePassword from "../components/UserProfile/ChangePassword";
import TwoFactorSettings from "../components/UserProfile/TwoFactorSettings";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useI18n } from "../i18n/I18nContext";

function UserProfile() {
  const { t } = useI18n();
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
          <h2 className="font-semibold text-4xl text-text-primary">{t("profile.pageTitle")}</h2>
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
              {t("profile.tabProfile")}
            </div>
            <div
              className={`hover:cursor-pointer text-text-secondary transition-colors duration-200 ${
                selectedSection === "resume"
                  ? "text-primary font-medium border-b-2 border-primary"
                  : "hover:border-b-2 hover:border-primary-light"
              } pb-3 hover:text-primary`}
              onClick={() => switchSection("resume")}
            >
              {t("profile.tabResume")}
            </div>
            <div
              className={`hover:cursor-pointer text-text-secondary transition-colors duration-200 ${
                selectedSection === "password"
                  ? "text-primary font-medium border-b-2 border-primary"
                  : "hover:border-b-2 hover:border-primary-light"
              } pb-3 hover:text-primary`}
              onClick={() => switchSection("password")}
            >
              {t("profile.tabPassword")}
            </div>
            <div
              className={`hover:cursor-pointer text-text-secondary transition-colors duration-200 ${
                selectedSection === "security"
                  ? "text-primary font-medium border-b-2 border-primary"
                  : "hover:border-b-2 hover:border-primary-light"
              } pb-3 hover:text-primary`}
              onClick={() => switchSection("security")}
            >
              {t("profile.tabSecurity")}
            </div>
          </div>

          <div
            className="text-sm font-medium text-primary hover:cursor-pointer hover:text-primary-dark transition-colors duration-200"
            onClick={openPublicProfile}
          >
            {t("profile.viewPublic")}
          </div>
        </div>
      </div>
      <div className="border border-neutral-200 my-5 rounded-lg shadow-sm bg-white">
        {selectedSection === "editProfile" && <EditProfile />}
        {selectedSection === "resume" && <UpdateResume />}
        {selectedSection === "password" && <ChangePassword />}
        {selectedSection === "security" && <TwoFactorSettings />}
      </div>
    </div>
  );
}

export default UserProfile;
